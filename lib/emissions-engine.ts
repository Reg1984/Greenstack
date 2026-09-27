/**
 * VERDANT traceable emissions engine.
 *
 * The rule that makes this auditor-grade: VERDANT never supplies a number it
 * can't trace. Factors come ONLY from the emission_factors table, which is
 * loaded from the official DESNZ flat file by scripts/import-desnz-factors.mjs.
 * Each line must name an exact factor row; the engine checks the unit, does the
 * arithmetic itself (not the model), and records the formula. Anything it can't
 * resolve is listed as UNRESOLVED rather than estimated.
 *
 * Output is a draft calculation pack for a qualified human to review and sign.
 */

import { createClient } from '@/lib/supabase/server'

export interface FactorRow {
  id: string
  factor_set: string
  scope: string | null
  level_1: string | null
  level_2: string | null
  level_3: string | null
  level_4: string | null
  column_text: string | null
  unit: string
  ghg_unit: string
  factor: number
  source_url: string
}

export interface ActivityInput {
  factor_id: string
  quantity: number
  unit: string
  description: string
  evidence?: string // where the activity data came from, e.g. "Jan–Dec 2025 British Gas invoices"
}

export interface CalcLine extends ActivityInput {
  scope: string
  factor_path: string
  factor: number
  factor_unit: string
  factor_source: string
  formula: string
  kg_co2e: number
}

export interface Unresolved extends Partial<ActivityInput> { reason: string }

export function factorPath(f: FactorRow): string {
  return [f.level_1, f.level_2, f.level_3, f.level_4, f.column_text].filter(Boolean).join(' › ')
}

// Case, spacing and plurals only. Qualifiers like "(Net CV)" vs "(Gross CV)" are real
// differences and must match exactly.
const normUnit = (u: string) => u.toLowerCase().replace(/\s+/g, '').replace(/s$/, '')

/** Pure calculation — no I/O, so it can be checked in isolation. */
export function computeLines(inputs: ActivityInput[], factors: Map<string, FactorRow>) {
  const lines: CalcLine[] = []
  const unresolved: Unresolved[] = []
  for (const input of inputs) {
    const f = factors.get(input.factor_id)
    if (!f) { unresolved.push({ ...input, reason: `Factor ${input.factor_id} not found in the loaded factor set` }); continue }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) { unresolved.push({ ...input, reason: 'Quantity is not a valid non-negative number' }); continue }
    if (normUnit(input.unit) !== normUnit(f.unit)) {
      unresolved.push({ ...input, reason: `Unit mismatch: activity is "${input.unit}" but factor is per "${f.unit}". Convert the activity data first — the engine does not guess conversions.` })
      continue
    }
    if (!/co2e/i.test(f.ghg_unit)) { unresolved.push({ ...input, reason: `Factor is expressed in "${f.ghg_unit}", not CO2e — pick the kg CO2e row` }); continue }
    const kg = input.quantity * f.factor
    lines.push({
      ...input,
      scope: f.scope ?? 'Unspecified',
      factor_path: factorPath(f),
      factor: f.factor,
      factor_unit: `${f.ghg_unit} per ${f.unit}`,
      factor_source: `${f.factor_set}, row ${f.id.split(':').pop()} — ${f.source_url}`,
      formula: `${input.quantity} ${f.unit} × ${f.factor} ${f.ghg_unit}/${f.unit} = ${kg.toFixed(3)} kg CO2e`,
      kg_co2e: kg,
    })
  }
  const byScope: Record<string, number> = {}
  for (const l of lines) byScope[l.scope] = (byScope[l.scope] ?? 0) + l.kg_co2e / 1000
  const totalT = Object.values(byScope).reduce((s, v) => s + v, 0)
  const totals = {
    tonnes_co2e_by_scope: Object.fromEntries(Object.entries(byScope).map(([k, v]) => [k, Number(v.toFixed(3))])),
    tonnes_co2e_total: Number(totalT.toFixed(3)),
    complete: unresolved.length === 0,
  }
  return { lines, unresolved, totals }
}

export async function searchFactors(query: string, factorSet?: string, limit = 15): Promise<FactorRow[]> {
  const supabase = await createClient()
  const terms = query.split(/\s+/).filter(t => t.length > 1).slice(0, 5)
  let q = supabase.from('emission_factors').select('*').ilike('ghg_unit', '%co2e%').limit(200)
  if (factorSet) q = q.eq('factor_set', factorSet)
  for (const t of terms) {
    const like = `*${t.replace(/[%_*,().]/g, '')}*`
    q = q.or(`level_1.ilike.${like},level_2.ilike.${like},level_3.ilike.${like},level_4.ilike.${like},column_text.ilike.${like},unit.ilike.${like}`)
  }
  const { data } = await q
  return ((data ?? []) as FactorRow[]).slice(0, limit)
}

export async function latestFactorSet(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('emission_factors').select('factor_set').order('factor_set', { ascending: false }).limit(1)
  return data?.[0]?.factor_set ?? null
}

export async function createCalculationPack(input: {
  client: string
  reporting_period: string
  activities: ActivityInput[]
}) {
  const supabase = await createClient()
  const ids = [...new Set(input.activities.map(a => a.factor_id))]
  const { data } = await supabase.from('emission_factors').select('*').in('id', ids)
  const factors = new Map(((data ?? []) as FactorRow[]).map(f => [f.id, f]))
  const sets = new Set([...factors.values()].map(f => f.factor_set))
  const { lines, unresolved, totals } = computeLines(input.activities, factors)
  if (sets.size > 1) unresolved.push({ reason: `Mixed factor sets used (${[...sets].join(', ')}). A pack must use one year's set.` })

  const { data: pack, error } = await supabase.from('calculation_packs').insert({
    client: input.client,
    reporting_period: input.reporting_period,
    factor_set: [...sets].join(', ') || 'none',
    lines, totals, unresolved,
  }).select('id').single()
  if (error) throw new Error(error.message)
  return { id: pack.id as string, lines, unresolved, totals }
}

export function renderPackMarkdown(pack: {
  id: string; client: string; reporting_period: string; factor_set: string
  lines: CalcLine[]; totals: any; unresolved: Unresolved[]; status?: string; signed_off_by?: string | null; created_at?: string
}): string {
  const scopeRows = Object.entries(pack.totals?.tonnes_co2e_by_scope ?? {}).map(([s, t]) => `| ${s} | ${t} |`).join('\n')
  const lineRows = pack.lines.map((l, i) =>
    `| ${i + 1} | ${l.scope} | ${l.description} | ${l.quantity} ${l.unit} | ${l.factor_path} | ${l.factor} ${l.factor_unit} | ${(l.kg_co2e / 1000).toFixed(3)} | ${l.evidence ?? '—'} |`).join('\n')
  return `# GHG Calculation Pack — ${pack.client}
**Reporting period:** ${pack.reporting_period}
**Factor set:** ${pack.factor_set} (UK Government GHG Conversion Factors for Company Reporting)
**Pack ID:** ${pack.id}${pack.created_at ? ` · prepared ${pack.created_at.slice(0, 10)}` : ''}
**Status:** ${(pack.status ?? 'draft').toUpperCase()}${pack.totals?.complete ? '' : ' — INCOMPLETE, see unresolved items'}

## Totals (tCO2e)
| Scope | tCO2e |
|---|---|
${scopeRows}
| **Total** | **${pack.totals?.tonnes_co2e_total ?? 0}** |

## Calculation lines
Every figure = activity quantity × the cited DESNZ factor. Arithmetic performed by the engine, not estimated.

| # | Scope | Activity | Quantity | Factor (DESNZ path) | Factor value | tCO2e | Evidence |
|---|---|---|---|---|---|---|---|
${lineRows}

${pack.unresolved.length ? `## ⚠️ Unresolved — not included in totals
${pack.unresolved.map(u => `- ${u.description ?? '(pack-level)'}${u.factor_id ? ` [${u.factor_id}]` : ''}: ${u.reason}`).join('\n')}
` : ''}
## Methodology
- Organisational boundary, operational boundary and exclusions: **to be confirmed by the reviewer**.
- Method: GHG Protocol Corporate Standard; factors from the DESNZ set named above; Scope 2 reported location-based unless market-based instruments are evidenced.
- Formulae per line are stored with the pack for audit.

## Review & sign-off
Prepared by: VERDANT (GreenStack AI) — draft for professional review.
Reviewed and signed off by: ${pack.signed_off_by ?? '______________________'}   Date: ____________
`
}
