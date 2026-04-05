/**
 * VERDANT Buyer Intent Monitor
 * Uses Exa semantic search to detect organisations actively investing in sustainability
 * — these are warm leads before they even publish a tender.
 *
 * Key signals:
 * - Sustainability/ESG/net zero job postings (they're hiring = they're investing)
 * - CSRD/ESOS/CBAM compliance announcements
 * - Companies announcing net zero targets or ESG commitments
 * - EU-exporting manufacturers that haven't yet addressed CBAM
 */

import { createClient } from '@/lib/supabase/server'
import { classifyBuyerSignal } from '@/lib/gemma'

export interface BuyerSignal {
  organisation: string
  signalType: 'sustainability_job' | 'esos_deadline' | 'csrd_obligation' | 'cbam_exposure' | 'net_zero_target' | 'expansion_news'
  signalText: string
  sourceUrl: string
  country: string
  priority: 'high' | 'medium' | 'low'
}

async function searchExa(query: string, numResults = 5): Promise<Array<{ title: string; url: string; text: string }>> {
  const exaKey = process.env.EXA_API_KEY
  if (!exaKey) return []

  try {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': exaKey },
      body: JSON.stringify({
        query,
        numResults,
        useAutoprompt: true,
        type: 'neural',
        contents: { text: { maxCharacters: 400 } },
        startPublishedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.results ?? []
  } catch {
    return []
  }
}

/** Detect UK organisations posting sustainability jobs — strong buying signal */
async function detectSustainabilityJobSignals(): Promise<BuyerSignal[]> {
  const signals: BuyerSignal[] = []

  const queries = [
    'UK company hiring "Head of Sustainability" OR "Director of ESG" 2026',
    'UK organisation recruiting "Net Zero Manager" OR "Carbon Manager" site:linkedin.com OR site:indeed.co.uk',
    'UK academy trust OR university hiring sustainability energy manager 2026',
  ]

  for (const query of queries) {
    const results = await searchExa(query, 5)
    for (const r of results) {
      if (!r.title || !r.url) continue
      // Use Gemma to classify if this is a genuine signal
      const classification = await classifyBuyerSignal(r.title, r.text ?? '', r.url)
      if (!classification.isSignal) continue
      const org = classification.organisation ?? r.title.split(' - ')[0]?.trim() ?? 'Unknown'
      if (org.length < 3) continue
      signals.push({
        organisation: org,
        signalType: 'sustainability_job',
        signalText: classification.insight ?? `Job posting detected: ${r.title.slice(0, 120)}`,
        sourceUrl: r.url,
        country: 'UK',
        priority: classification.priority,
      })
    }
  }

  return signals.slice(0, 8)
}

/** Detect CBAM-exposed manufacturers in target markets */
async function detectCBAMSignals(): Promise<BuyerSignal[]> {
  const signals: BuyerSignal[] = []

  const queries = [
    'Vietnam Indonesia manufacturer EU export CBAM carbon compliance 2026',
    'Southeast Asia steel aluminium producer EU carbon border adjustment',
    'African manufacturer EU export CBAM carbon declaration requirement',
  ]

  for (const query of queries) {
    const results = await searchExa(query, 4)
    for (const r of results) {
      if (!r.title) continue
      signals.push({
        organisation: r.title.split(' - ')[0]?.trim() ?? 'Unknown Manufacturer',
        signalType: 'cbam_exposure',
        signalText: r.text?.slice(0, 120) ?? r.title,
        sourceUrl: r.url,
        country: 'International',
        priority: 'high',
      })
    }
  }

  return signals.slice(0, 6)
}

/** Detect CSRD-obligated UK companies */
async function detectCSRDSignals(): Promise<BuyerSignal[]> {
  const signals: BuyerSignal[] = []

  const results = await searchExa(
    'UK large company CSRD Corporate Sustainability Reporting Directive compliance 2025 2026',
    6
  )

  for (const r of results) {
    if (!r.title) continue
    signals.push({
      organisation: r.title.split(' - ')[0]?.trim() ?? 'UK Company',
      signalType: 'csrd_obligation',
      signalText: r.text?.slice(0, 120) ?? r.title,
      sourceUrl: r.url,
      country: 'UK',
      priority: 'medium',
    })
  }

  return signals.slice(0, 5)
}

/** Run all buyer intent scans and save to Supabase */
export async function runBuyerIntentScan(): Promise<BuyerSignal[]> {
  const [jobSignals, cbamSignals, csrdSignals] = await Promise.all([
    detectSustainabilityJobSignals(),
    detectCBAMSignals(),
    detectCSRDSignals(),
  ])

  const all = [...jobSignals, ...cbamSignals, ...csrdSignals]

  // Save to Supabase
  try {
    const supabase = await createClient()
    if (all.length > 0) {
      await supabase.from('buyer_signals').insert(
        all.map(s => ({
          organisation: s.organisation,
          signal_type: s.signalType,
          signal_text: s.signalText,
          source_url: s.sourceUrl,
          country: s.country,
          priority: s.priority,
          acted_on: false,
          detected_at: new Date().toISOString(),
        }))
      )
    }
  } catch { /* non-fatal */ }

  return all
}

/** Format signals as context string for VERDANT */
export function formatSignalsForVerdant(signals: BuyerSignal[]): string {
  if (signals.length === 0) return 'No new buyer intent signals this cycle.'

  const high = signals.filter(s => s.priority === 'high')
  const medium = signals.filter(s => s.priority === 'medium')

  return `## BUYER INTENT SIGNALS (${signals.length} detected this cycle)

### 🔴 High Priority (${high.length}):
${high.map(s => `- **${s.organisation}** [${s.signalType}]: ${s.signalText}`).join('\n') || 'None'}

### 🟡 Medium Priority (${medium.length}):
${medium.map(s => `- **${s.organisation}** [${s.signalType}]: ${s.signalText}`).join('\n') || 'None'}

For each HIGH priority signal: research the organisation, find the right contact, and send a personalised outreach email using send_outreach_email. These are warm leads — they are actively investing in sustainability right now.`
}
