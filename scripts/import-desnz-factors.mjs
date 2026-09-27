#!/usr/bin/env node
/**
 * Import the official DESNZ GHG conversion factors "flat file" into emission_factors.
 *
 * 1. Download the flat file for the year from
 *    https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 * 2. Open it in Excel and "Save As" CSV (UTF-8).
 * 3. node scripts/import-desnz-factors.mjs <file.csv> "DESNZ 2025" <exact URL of the publication page>
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from the environment or .env.local.
 * Idempotent: re-running upserts the same IDs.
 */

import { readFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const [file, factorSet, sourceUrl] = process.argv.slice(2)
if (!file || !factorSet || !sourceUrl) {
  console.error('Usage: node scripts/import-desnz-factors.mjs <flat-file.csv> "<factor set, e.g. DESNZ 2025>" <source URL>')
  process.exit(1)
}

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

/** RFC4180-ish CSV parser (quoted fields, escaped quotes, newlines in quotes). */
export function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

const rows = parseCsv(readFileSync(file, 'utf8').replace(/^﻿/, ''))
// The flat file has title rows above the table — find the real header.
const headerIdx = rows.findIndex(r => r.some(c => /^UOM$/i.test(c.trim())) && r.some(c => /^Scope$/i.test(c.trim())))
if (headerIdx === -1) { console.error('Could not find a header row containing "Scope" and "UOM".'); process.exit(1) }
const header = rows[headerIdx].map(h => h.trim())
const col = name => header.findIndex(h => h.toLowerCase() === name.toLowerCase())
const factorCol = header.findIndex(h => /^GHG Conversion Factor/i.test(h))
const idx = {
  id: col('ID'), scope: col('Scope'), l1: col('Level 1'), l2: col('Level 2'), l3: col('Level 3'), l4: col('Level 4'),
  text: col('Column Text'), uom: col('UOM'), ghg: col('GHG/Unit'),
}
if (factorCol === -1 || idx.uom === -1 || idx.ghg === -1) { console.error(`Unexpected columns: ${header.join(' | ')}`); process.exit(1) }

const records = []
for (const r of rows.slice(headerIdx + 1)) {
  const raw = (r[factorCol] ?? '').replace(/,/g, '').trim()
  const factor = Number(raw)
  if (!raw || !Number.isFinite(factor)) continue
  const rowId = idx.id >= 0 && r[idx.id]?.trim() ? r[idx.id].trim() : String(records.length + 1)
  const v = i => (i >= 0 ? (r[i] ?? '').trim() || null : null)
  records.push({
    id: `${factorSet}:${rowId}`, factor_set: factorSet,
    scope: v(idx.scope), level_1: v(idx.l1), level_2: v(idx.l2), level_3: v(idx.l3), level_4: v(idx.l4),
    column_text: v(idx.text), unit: v(idx.uom) ?? '', ghg_unit: v(idx.ghg) ?? '', factor, source_url: sourceUrl,
  })
}
console.log(`Parsed ${records.length} factor rows (column "${header[factorCol]}").`)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL / key.'); process.exit(1) }
const supabase = createClient(url, key)
for (let i = 0; i < records.length; i += 500) {
  const { error } = await supabase.from('emission_factors').upsert(records.slice(i, i + 500), { onConflict: 'id' })
  if (error) { console.error(`Batch ${i}: ${error.message}`); process.exit(1) }
}
console.log(`✅ Imported ${records.length} rows into emission_factors as "${factorSet}".`)
