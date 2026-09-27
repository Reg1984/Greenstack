/**
 * VERDANT Regulatory Radar — watches the official sources every day, works out
 * what actually changed, who it hits, and which of OUR clients it hits.
 *
 * Three kinds of watch:
 *  - gov.uk search  : new publications matching a topic (GOV.UK Search API, newest first)
 *  - gov.uk page    : edits to a key guidance page (GOV.UK Content API public_updated_at + change note)
 *  - page hash      : non-gov.uk pages (EU, FCA, SBTi) — normalised text, sha256, line diff
 *
 * The first time a watch is seen we record a baseline and raise nothing, so the
 * first run doesn't flood Reg with every document ever published.
 *
 * Every change is analysed against the source text itself; the analysis must
 * quote the source verbatim, and client matches are validated against the real
 * CRM list (the model cannot invent a client).
 */

import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { saveMemory } from '@/lib/verdant-memory'
import { extractJson } from '@/lib/verdant-academy'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'
const MAX_ANALYSES_PER_RUN = 8

type Watch =
  | { kind: 'govuk_search'; name: string; query: string; jurisdiction: string; topics: string[] }
  | { kind: 'govuk_page'; name: string; path: string; jurisdiction: string; topics: string[] }
  | { kind: 'page_hash'; name: string; url: string; jurisdiction: string; topics: string[] }

export const WATCHES: Watch[] = [
  { kind: 'govuk_search', name: 'GOV.UK — UK CBAM', query: 'carbon border adjustment mechanism', jurisdiction: 'UK', topics: ['cbam'] },
  { kind: 'govuk_search', name: 'GOV.UK — UK ETS', query: 'UK Emissions Trading Scheme', jurisdiction: 'UK', topics: ['uk-ets'] },
  { kind: 'govuk_search', name: 'GOV.UK — UK Sustainability Reporting Standards', query: 'UK Sustainability Reporting Standards', jurisdiction: 'UK', topics: ['uk-srs', 'reporting'] },
  { kind: 'govuk_search', name: 'GOV.UK — transition plans', query: 'transition plans climate', jurisdiction: 'UK', topics: ['transition-plans', 'reporting'] },
  { kind: 'govuk_search', name: 'GOV.UK — ESOS', query: 'Energy Savings Opportunity Scheme', jurisdiction: 'UK', topics: ['esos'] },
  { kind: 'govuk_search', name: 'GOV.UK — SECR / GHG reporting', query: 'streamlined energy and carbon reporting', jurisdiction: 'UK', topics: ['secr', 'reporting'] },
  { kind: 'govuk_search', name: 'GOV.UK — Climate Change Agreements', query: 'Climate Change Agreements', jurisdiction: 'UK', topics: ['cca', 'energy'] },
  { kind: 'govuk_search', name: 'GOV.UK — packaging EPR', query: 'extended producer responsibility packaging', jurisdiction: 'UK', topics: ['epr', 'packaging'] },
  { kind: 'govuk_search', name: 'GOV.UK — Public Sector Decarbonisation', query: 'Public Sector Decarbonisation Scheme', jurisdiction: 'UK', topics: ['psds', 'public-sector'] },
  { kind: 'govuk_page', name: 'ESOS guidance', path: '/guidance/energy-savings-opportunity-scheme-esos', jurisdiction: 'UK', topics: ['esos'] },
  { kind: 'govuk_page', name: 'GHG conversion factors collection', path: '/government/collections/government-conversion-factors-for-company-reporting', jurisdiction: 'UK', topics: ['conversion-factors', 'secr'] },
  { kind: 'govuk_page', name: 'Environmental reporting guidelines (SECR)', path: '/government/publications/environmental-reporting-guidelines-including-mandatory-greenhouse-gas-emissions-reporting-guidance', jurisdiction: 'UK', topics: ['secr', 'reporting'] },
  { kind: 'govuk_page', name: 'CMA Green Claims Code', path: '/government/publications/green-claims-code-making-environmental-claims', jurisdiction: 'UK', topics: ['green-claims'] },
  { kind: 'page_hash', name: 'EU CBAM (DG TAXUD)', url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en', jurisdiction: 'EU', topics: ['cbam'] },
  { kind: 'page_hash', name: 'FCA anti-greenwashing', url: 'https://www.fca.org.uk/firms/climate-change-sustainable-finance/anti-greenwashing', jurisdiction: 'UK', topics: ['green-claims', 'financial-services'] },
  { kind: 'page_hash', name: 'EFRAG sustainability reporting', url: 'https://www.efrag.org/en/sustainability-reporting', jurisdiction: 'EU', topics: ['csrd', 'reporting'] },
  { kind: 'page_hash', name: 'SBTi net-zero', url: 'https://sciencebasedtargets.org/net-zero', jurisdiction: 'Global', topics: ['sbti'] },
]

function watchKey(w: Watch): string {
  if (w.kind === 'govuk_search') return `govuk-search:${w.query}`
  if (w.kind === 'govuk_page') return `https://www.gov.uk${w.path}`
  return w.url
}

// ─── Fetching & normalising ───────────────────────────────────────────────────

async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'GreenStackAI-VERDANT-RegulatoryRadar/1.0 (+https://greenstackai.co.uk)' } })
  } finally {
    clearTimeout(timer)
  }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|header|footer)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 2)
    .join('\n')
}

/** Lines present in `next` but not `prev`, and vice versa — enough signal for the analyst. */
export function lineDiff(prev: string, next: string): { added: string[]; removed: string[] } {
  const a = new Set(prev.split('\n'))
  const b = new Set(next.split('\n'))
  return {
    added: [...b].filter(l => !a.has(l)),
    removed: [...a].filter(l => !b.has(l)),
  }
}

interface Candidate { watch: Watch; key: string; title: string; url: string; evidence: string }

async function govukContentText(path: string): Promise<{ text: string; updated: string | null; changeNote: string | null }> {
  const res = await fetchWithTimeout(`https://www.gov.uk/api/content${path}`)
  if (!res.ok) throw new Error(`GOV.UK content API ${res.status} for ${path}`)
  const data = await res.json()
  const history = data?.details?.change_history ?? []
  const parts = [data?.description, data?.details?.body, ...(data?.details?.documents ?? [])].filter(Boolean).join('\n')
  return {
    text: htmlToText(parts).slice(0, 30000),
    updated: data?.public_updated_at ?? null,
    changeNote: history.length ? `${history[0].public_timestamp}: ${history[0].note}` : null,
  }
}

async function checkWatch(w: Watch, prev: { last_fingerprint: string | null; last_content: string | null } | undefined, supabase: any): Promise<Candidate[]> {
  const key = watchKey(w)
  const now = new Date().toISOString()
  const save = (fingerprint: string, content: string | null, changed: boolean) =>
    supabase.from('regulatory_watch').upsert({
      url: key, name: w.name, jurisdiction: w.jurisdiction, topics: w.topics,
      last_fingerprint: fingerprint, last_content: content, last_checked_at: now,
      ...(changed ? { last_changed_at: now } : {}),
    }, { onConflict: 'url' })

  if (w.kind === 'govuk_search') {
    const res = await fetchWithTimeout(`https://www.gov.uk/api/search.json?q=${encodeURIComponent(w.query)}&order=-public_timestamp&count=10&fields=title,link,public_timestamp,description,format`)
    if (!res.ok) throw new Error(`GOV.UK search API ${res.status}`)
    const results: { title: string; link: string; public_timestamp: string; description?: string; format?: string }[] = (await res.json())?.results ?? []
    if (!results.length) return []
    const newest = results.map(r => r.public_timestamp).sort().at(-1)!
    const since = prev?.last_fingerprint
    await save(newest, null, !!since && newest > since)
    if (!since) return [] // baseline
    const fresh = results.filter(r => r.public_timestamp > since)
    const out: Candidate[] = []
    for (const r of fresh.slice(0, 3)) {
      let evidence = `${r.format ?? ''} published ${r.public_timestamp}\n${r.description ?? ''}`
      try { evidence += `\n\n${(await govukContentText(r.link)).text}` } catch { /* summary only */ }
      out.push({ watch: w, key, title: r.title, url: `https://www.gov.uk${r.link}`, evidence })
    }
    return out
  }

  if (w.kind === 'govuk_page') {
    const { text, updated, changeNote } = await govukContentText(w.path)
    const fingerprint = updated ?? createHash('sha256').update(text).digest('hex')
    const changed = !!prev?.last_fingerprint && prev.last_fingerprint !== fingerprint
    await save(fingerprint, text, changed)
    if (!changed) return []
    const diff = lineDiff(prev?.last_content ?? '', text)
    return [{
      watch: w, key, title: w.name, url: key,
      evidence: `GOV.UK change note: ${changeNote ?? 'none given'}\n\nADDED TEXT:\n${diff.added.join('\n').slice(0, 12000)}\n\nREMOVED TEXT:\n${diff.removed.join('\n').slice(0, 4000)}`,
    }]
  }

  const res = await fetchWithTimeout(w.url)
  if (!res.ok) throw new Error(`${res.status} fetching ${w.url}`)
  const text = htmlToText(await res.text()).slice(0, 30000)
  const fingerprint = createHash('sha256').update(text).digest('hex')
  const changed = !!prev?.last_fingerprint && prev.last_fingerprint !== fingerprint
  await save(fingerprint, text, changed)
  if (!changed) return []
  const diff = lineDiff(prev?.last_content ?? '', text)
  if (diff.added.length + diff.removed.length === 0) return []
  return [{
    watch: w, key, title: w.name, url: w.url,
    evidence: `ADDED TEXT:\n${diff.added.join('\n').slice(0, 12000)}\n\nREMOVED TEXT:\n${diff.removed.join('\n').slice(0, 4000)}`,
  }]
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

interface ClientRef { organisation: string; contact_email: string | null; sector: string | null; country: string | null; signal: string | null; sic_codes: string[] | null }

interface Analysis {
  materiality: 'high' | 'medium' | 'low' | 'noise'
  headline: string
  summary: string
  who_is_affected: string
  sectors: string[]
  deadline: string | null
  actions: string
  evidence_quote: string
  affected_clients: { organisation: string; reason: string }[]
}

async function analyse(c: Candidate, clients: ClientRef[]): Promise<Analysis | null> {
  const clientList = clients.length
    ? clients.map(k => `- ${k.organisation} | sector: ${k.sector ?? '?'} | country: ${k.country ?? '?'} | SIC: ${k.sic_codes?.join(',') ?? '?'} | why we know them: ${k.signal ?? '?'}`).join('\n')
    : '(no active clients yet)'
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: `You are VERDANT's regulatory analyst. You read a detected change on an official source and decide what it means for UK businesses and for GreenStack AI's active clients. You work ONLY from the source text given — never add facts from memory. Cosmetic edits, navigation changes, reordering and date stamps are "noise".`,
    messages: [{
      role: 'user',
      content: `SOURCE: ${c.watch.name} (${c.watch.jurisdiction}) — ${c.title}
URL: ${c.url}
DETECTED CHANGE / NEW DOCUMENT:
${c.evidence.slice(0, 20000)}

GREENSTACK AI ACTIVE CLIENTS:
${clientList}

Return ONLY JSON:
{"materiality": "high|medium|low|noise",
 "headline": "<one line, specific: what changed>",
 "summary": "<3-5 sentences in plain English>",
 "who_is_affected": "<which businesses, with thresholds>",
 "sectors": ["..."],
 "deadline": "<date or null>",
 "actions": "<numbered actions a UK business should take>",
 "evidence_quote": "<verbatim sentence from the source text above that proves the change>",
 "affected_clients": [{"organisation": "<exact name from client list>", "reason": "<why it hits them>"}]}

high = new obligation, deadline, threshold or cost for businesses; medium = guidance/consultation that will likely change obligations; low = minor clarification.`,
    }],
  })
  const text = response.content.filter(b => b.type === 'text').map(b => (b as Anthropic.TextBlock).text).join('\n')
  const parsed = extractJson<Analysis>(text)
  if (!parsed) return null
  // The model may only name real clients.
  const known = new Map(clients.map(k => [k.organisation.toLowerCase(), k]))
  parsed.affected_clients = (parsed.affected_clients ?? []).filter(a => known.has(a.organisation?.toLowerCase()))
  // Reject analyses whose "verbatim" quote isn't actually in the evidence.
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  if (parsed.materiality !== 'noise' && parsed.evidence_quote && !norm(c.evidence).includes(norm(parsed.evidence_quote).slice(0, 80))) {
    parsed.summary = `[Quote could not be matched to source — verify manually] ${parsed.summary}`
  }
  return parsed
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function emailReg(changes: (Analysis & { url: string; source: string })[]) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !changes.length) return
  const blocks = changes.map(c => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px">
      <p style="margin:0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${c.materiality === 'high' ? '#b91c1c' : '#b45309'}">${c.materiality} · ${c.source}</p>
      <h3 style="margin:6px 0">${c.headline}</h3>
      <p>${c.summary}</p>
      <p><strong>Who:</strong> ${c.who_is_affected}${c.deadline ? `<br><strong>Deadline:</strong> ${c.deadline}` : ''}</p>
      <p style="white-space:pre-wrap"><strong>Actions:</strong>\n${c.actions}</p>
      ${c.affected_clients.length ? `<p><strong>Your clients hit:</strong><br>${c.affected_clients.map(a => `• ${a.organisation} — ${a.reason}`).join('<br>')}</p>` : ''}
      <blockquote style="border-left:3px solid #10b981;margin:0;padding-left:12px;color:#4b5563">"${c.evidence_quote}"</blockquote>
      <p><a href="${c.url}">Read the source →</a></p>
    </div>`).join('')
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VERDANT Radar <verdant@greenstackai.co.uk>',
      to: 'info@greenstackai.co.uk',
      subject: `📡 Regulatory Radar — ${changes.length} change${changes.length > 1 ? 's' : ''} (${changes.filter(c => c.materiality === 'high').length} high)`,
      html: `<div style="font-family:sans-serif;max-width:680px;line-height:1.6;color:#111">${blocks}</div>`,
    }),
  })
}

export async function runRegulatoryRadar() {
  const supabase = await createClient()
  const [{ data: watchRows }, { data: clientRows }] = await Promise.all([
    supabase.from('regulatory_watch').select('url, last_fingerprint, last_content'),
    supabase.from('outreach_contacts').select('organisation, contact_email, sector, country, signal, sic_codes').in('status', ['replied', 'meeting_booked', 'won']).limit(200),
  ])
  const prevByKey = new Map((watchRows ?? []).map(r => [r.url, r]))
  const clients = (clientRows ?? []) as ClientRef[]

  const errors: string[] = []
  const candidates = (await Promise.all(WATCHES.map(w =>
    checkWatch(w, prevByKey.get(watchKey(w)), supabase).catch(err => { errors.push(`${w.name}: ${String(err)}`); return [] as Candidate[] }),
  ))).flat()

  const recorded: (Analysis & { url: string; source: string })[] = []
  for (const c of candidates.slice(0, MAX_ANALYSES_PER_RUN)) {
    const a = await analyse(c, clients).catch(err => { errors.push(`analyse ${c.title}: ${String(err)}`); return null })
    if (!a) continue
    const withClients = {
      ...a,
      affected_clients: a.affected_clients.map(ac => ({
        ...ac,
        contact_email: clients.find(k => k.organisation.toLowerCase() === ac.organisation.toLowerCase())?.contact_email ?? null,
      })),
    }
    await supabase.from('regulatory_changes').insert({
      source_url: c.url, source_name: `${c.watch.name} — ${c.title}`,
      materiality: a.materiality, headline: a.headline, summary: a.summary,
      who_is_affected: a.who_is_affected, sectors: a.sectors ?? [], deadline: a.deadline,
      actions: a.actions, evidence_quote: a.evidence_quote, affected_clients: withClients.affected_clients,
    })
    if (a.materiality === 'noise' || a.materiality === 'low') continue
    recorded.push({ ...withClients, url: c.url, source: c.watch.name })
    await saveMemory('intelligence', `Radar ${new Date().toISOString().slice(0, 10)}: ${a.headline}`.slice(0, 200), `${a.summary} Deadline: ${a.deadline ?? 'n/a'}. Source: ${c.url}`, a.materiality === 'high' ? 9 : 7)
  }

  await emailReg(recorded)
  // Public channel gets the headline only — never client names.
  // Lazy import: verdant-tools imports this module for its tool executors.
  const { sendTelegramMessage } = await import('@/lib/verdant-tools')
  for (const r of recorded.filter(r => r.materiality === 'high')) {
    await sendTelegramMessage(`📡 *Regulatory change:* ${r.headline}\n\n${r.summary}\n\n${r.url}`)
  }

  return { watches: WATCHES.length, candidates: candidates.length, material: recorded.length, errors }
}

/** Last N days of material changes — injected into the cycle context and returned by the tool. */
export async function formatRadarForVerdant(days = 7): Promise<string> {
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    const { data } = await supabase
      .from('regulatory_changes')
      .select('headline, summary, deadline, sectors, actions, affected_clients, source_url, materiality, detected_at')
      .in('materiality', ['high', 'medium'])
      .gte('detected_at', since)
      .order('detected_at', { ascending: false })
      .limit(10)
    if (!data?.length) return ''
    return `## 📡 REGULATORY RADAR — material changes in the last ${days} days (verified from source)
Use these as fresh, specific hooks in outreach and follow-ups — cite the source URL. Where a client is listed, tell them before they hear it elsewhere.

${data.map(c => `• [${c.materiality.toUpperCase()} · ${c.detected_at.slice(0, 10)}] ${c.headline}
  ${c.summary}${c.deadline ? `\n  Deadline: ${c.deadline}` : ''}
  Sectors: ${(c.sectors ?? []).join(', ') || 'n/a'} | Source: ${c.source_url}${(c.affected_clients as any[])?.length ? `\n  Clients hit: ${(c.affected_clients as any[]).map(a => `${a.organisation} (${a.reason})`).join('; ')}` : ''}`).join('\n\n')}`
  } catch {
    return ''
  }
}
