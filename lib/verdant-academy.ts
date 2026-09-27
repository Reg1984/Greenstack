/**
 * VERDANT Academy — VERDANT studies the syllabus of the professional courses
 * sustainability consultants take, from the primary sources those courses teach
 * (the standards, regulations and official guidance themselves), then proves it
 * learned them with a closed-book self-test it cannot see the answers to.
 *
 * Why primary sources and not the courses: certificates are issued to a named
 * person, most course platforms ban automated completion, and a consultancy that
 * advises on greenwashing cannot claim credentials it does not hold. What
 * clients actually pay for is the knowledge — and the knowledge is in the source
 * documents, which are free. So VERDANT learns the source, and the website
 * reports exactly that: "studied from the primary source, self-tested at N%".
 *
 * One module per run (cron: /api/cron/academy). Each run:
 *   A. Study   — read the primary sources, write cited study notes
 *   B. Examine — a separate call reads the same sources and sets 10 questions
 *                with an answer key and verbatim quotes (never sees A's notes)
 *   C. Sit     — a third call answers the exam using ONLY A's notes (closed book)
 *   D. Grade   — mark C against B's key; weak areas feed the next restudy
 * A and B run in parallel. Mastered at >= 85%.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'
const MASTERY_THRESHOLD = 85
const REFRESH_AFTER_DAYS = 60

export interface CurriculumModule {
  slug: string
  title: string
  mirrorsCourse: string
  syllabus: string
  seedUrls: string[]
}

export const CURRICULUM: CurriculumModule[] = [
  {
    slug: 'ghg-protocol-corporate',
    title: 'GHG Protocol Corporate Accounting & Reporting Standard',
    mirrorsCourse: 'GHG Protocol Corporate Standard e-learning; IEMA carbon management modules',
    syllabus: 'Accounting principles; organisational boundaries (equity share vs control approaches); operational boundaries; Scope 1/2/3 definitions; base year and recalculation policy; tracking over time; reporting requirements vs optional disclosures.',
    seedUrls: ['https://ghgprotocol.org/corporate-standard'],
  },
  {
    slug: 'ghg-protocol-scope-2',
    title: 'GHG Protocol Scope 2 Guidance',
    mirrorsCourse: 'GHG Protocol Scope 2 training',
    syllabus: 'Location-based vs market-based methods; dual reporting requirement; Scope 2 Quality Criteria for contractual instruments; REGOs/GOs/PPAs; residual mix.',
    seedUrls: ['https://ghgprotocol.org/scope-2-guidance'],
  },
  {
    slug: 'ghg-protocol-scope-3',
    title: 'GHG Protocol Scope 3 (Corporate Value Chain) Standard',
    mirrorsCourse: 'GHG Protocol Scope 3 training',
    syllabus: 'The 15 categories and their boundaries; screening and relevance; calculation methods (supplier-specific, hybrid, average-data, spend-based) per category; data quality; exclusions and justification.',
    seedUrls: ['https://ghgprotocol.org/corporate-value-chain-scope-3-standard'],
  },
  {
    slug: 'uk-conversion-factors',
    title: 'UK Government GHG Conversion Factors for Company Reporting (DESNZ)',
    mirrorsCourse: 'SECR / carbon footprinting practitioner courses',
    syllabus: 'How the annual factor set is structured; which factor to use for fuels, electricity (generation vs T&D), WTT, travel, freight, waste, water; gross vs net CV; methodology paper caveats; when to use the current vs prior year set.',
    seedUrls: ['https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting'],
  },
  {
    slug: 'secr',
    title: 'Streamlined Energy and Carbon Reporting (SECR)',
    mirrorsCourse: 'SECR compliance training',
    syllabus: 'Who is in scope (quoted, large unquoted, large LLPs); what must be disclosed; intensity ratio; energy efficiency narrative; exemptions (low energy, seriously prejudicial); where it sits in the annual report.',
    seedUrls: ['https://www.gov.uk/government/publications/environmental-reporting-guidelines-including-mandatory-greenhouse-gas-emissions-reporting-guidance'],
  },
  {
    slug: 'esos',
    title: 'Energy Savings Opportunity Scheme (ESOS) — current phase',
    mirrorsCourse: 'ESOS Lead Assessor preparation',
    syllabus: 'Qualification test and dates; total energy consumption and 90% significant energy; compliance routes (ISO 50001, audits, DECs, GDAs); Lead Assessor role and registers; notification and action plan requirements; penalties.',
    seedUrls: ['https://www.gov.uk/guidance/energy-savings-opportunity-scheme-esos'],
  },
  {
    slug: 'ifrs-s1-s2',
    title: 'IFRS S1 & S2 (ISSB) and the UK Sustainability Reporting Standards',
    mirrorsCourse: 'IFRS Sustainability Alliance FSA Credential',
    syllabus: 'S1 general requirements and the four pillars; S2 climate-related risks and opportunities; industry-based metrics; scenario analysis; transition reliefs; how the UK SRS endorses and modifies S1/S2, and the UK timetable.',
    seedUrls: ['https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/'],
  },
  {
    slug: 'csrd-esrs',
    title: 'CSRD and the European Sustainability Reporting Standards (ESRS)',
    mirrorsCourse: 'EFRAG / ESRS practitioner courses',
    syllabus: 'Who is in scope after the Omnibus changes, including non-EU parents; ESRS structure; double materiality assessment process; datapoints; assurance; phase-in reliefs.',
    seedUrls: ['https://www.efrag.org/en/sustainability-reporting'],
  },
  {
    slug: 'eu-cbam',
    title: 'EU Carbon Border Adjustment Mechanism (CBAM)',
    mirrorsCourse: 'CBAM declarant / embedded emissions training',
    syllabus: 'Covered goods and CN codes; definitive period obligations; authorised declarant; direct and indirect embedded emissions methodology; default values vs actual data; verification; certificate purchase and surrender; de minimis threshold after simplification.',
    seedUrls: ['https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en'],
  },
  {
    slug: 'uk-cbam',
    title: 'UK Carbon Border Adjustment Mechanism',
    mirrorsCourse: 'UK CBAM readiness training',
    syllabus: 'Start date; sectors and goods covered; liable persons and thresholds; how the rate is set relative to UK ETS; embedded emissions calculation; interaction with EU CBAM and any linking.',
    seedUrls: ['https://www.gov.uk/search/all?keywords=UK+carbon+border+adjustment+mechanism'],
  },
  {
    slug: 'sbti',
    title: 'Science Based Targets initiative — Corporate Net-Zero Standard',
    mirrorsCourse: 'SBTi target-setting training',
    syllabus: 'Near-term vs long-term targets; coverage requirements for Scopes 1, 2 and 3; approved methods; neutralisation vs beyond-value-chain mitigation; the latest version of the standard and its changes; validation process.',
    seedUrls: ['https://sciencebasedtargets.org/net-zero'],
  },
  {
    slug: 'tcfd',
    title: 'TCFD Recommendations (and UK mandatory climate disclosure)',
    mirrorsCourse: 'TCFD / climate risk disclosure courses',
    syllabus: 'The four pillars and 11 recommended disclosures; physical vs transition risk; scenario analysis; UK Companies Act climate-related financial disclosure (CFD) requirements and who they apply to.',
    seedUrls: ['https://www.fsb-tcfd.org/recommendations/'],
  },
  {
    slug: 'gri',
    title: 'GRI Universal Standards',
    mirrorsCourse: 'GRI Certified Sustainability Professional',
    syllabus: 'GRI 1/2/3 structure; reporting "in accordance with" vs "with reference to"; material topics process; GRI content index; sector standards.',
    seedUrls: ['https://www.globalreporting.org/standards/'],
  },
  {
    slug: 'green-claims',
    title: 'UK Green Claims: CMA Green Claims Code, DMCC Act and FCA Anti-Greenwashing Rule',
    mirrorsCourse: 'Green claims compliance training',
    syllabus: 'The six Green Claims Code principles; CMA enforcement powers under the DMCC Act; FCA anti-greenwashing rule (who it applies to, "fair, clear and not misleading"); offsetting and "carbon neutral" claims.',
    seedUrls: [
      'https://www.gov.uk/government/publications/green-claims-code-making-environmental-claims',
      'https://www.fca.org.uk/firms/climate-change-sustainable-finance/anti-greenwashing',
    ],
  },
  {
    slug: 'pcaf',
    title: 'PCAF Global GHG Accounting Standard for the Financial Industry',
    mirrorsCourse: 'PCAF financed emissions training',
    syllabus: 'Financed emissions by asset class; attribution factors; data quality score 1–5; facilitated and insurance-associated emissions.',
    seedUrls: ['https://carbonaccountingfinancials.com/standard'],
  },
]

// ─── Research call helper — server-side web tools only ────────────────────────

const WEB_TOOLS: any[] = [
  { type: 'web_search_20260209', name: 'web_search', max_uses: 4 },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 6, max_content_tokens: 12000 },
]

async function research(system: string, prompt: string, maxTokens = 8000): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]
  let text = ''
  let containerId: string | null = null
  for (let i = 0; i < 6; i++) {
    const response: Anthropic.Message = await (client.messages.create as any)({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      tools: WEB_TOOLS,
      messages,
      ...(containerId ? { container: containerId } : {}),
    })
    if ((response as any).container?.id) containerId = (response as any).container.id
    text += response.content.filter(b => b.type === 'text').map(b => (b as Anthropic.TextBlock).text).join('\n')
    if (response.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: response.content })
  }
  return text
}

async function plain(system: string, prompt: string, maxTokens = 4000): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content.filter(b => b.type === 'text').map(b => (b as Anthropic.TextBlock).text).join('\n')
}

/** Pull the first JSON object/array out of a model response. */
export function extractJson<T>(text: string): T | null {
  const start = text.search(/[[{]/)
  if (start === -1) return null
  const open = text[start]
  const end = text.lastIndexOf(open === '{' ? '}' : ']')
  if (end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as T
  } catch {
    return null
  }
}

// ─── The four study stages ────────────────────────────────────────────────────

const STUDY_SYSTEM = `You are VERDANT studying for a professional sustainability qualification. You learn ONLY from primary sources — the official standard, regulation, legislation or regulator guidance. Secondary blogs may help you find the primary source but are never cited as authority.

Your notes will be the ONLY reference VERDANT uses when advising paying clients, so:
- Every rule, threshold, date and definition must carry a citation: (Source: <url>, <section/page if known>).
- Record exact numbers and dates verbatim. If sources conflict or something is still at consultation stage, say so explicitly.
- Include a "Common practitioner mistakes" section and a "What changed recently" section.
- Never invent. If you could not verify something, write "UNVERIFIED:" in front of it.`

async function studyModule(mod: CurriculumModule, previousNotes: string | null, weakAreas: string | null) {
  const restudy = previousNotes
    ? `\n\nThis is a RESTUDY. Your previous notes are below. Your last self-test showed these weak areas: ${weakAreas ?? 'none recorded'}. Verify the previous notes against the sources, correct anything wrong, fill the gaps, and focus on the weak areas.\n\n--- PREVIOUS NOTES ---\n${previousNotes.slice(0, 20000)}`
    : ''
  const text = await research(STUDY_SYSTEM, `Module: ${mod.title}
Syllabus to cover: ${mod.syllabus}
Start from these primary sources (follow links to the actual standard/guidance documents; use web_search to find the current official version if a page has moved): ${mod.seedUrls.join(', ')}
Today's date: ${new Date().toISOString().slice(0, 10)}${restudy}

Return ONLY a JSON object:
{"notes_markdown": "<comprehensive cited study notes, 1500-3000 words>", "sources": [{"url": "...", "title": "..."}]}`, 12000)
  return extractJson<{ notes_markdown: string; sources: { url: string; title: string }[] }>(text)
}

interface ExamQuestion { q: string; answer: string; source_url: string; source_quote: string; topic: string }

async function setExam(mod: CurriculumModule): Promise<ExamQuestion[] | null> {
  const text = await research(
    `You are a strict examiner for a professional sustainability qualification. You set questions ONLY from the primary source text, and every answer in your key is backed by a verbatim quote from that source.`,
    `Set a 10-question exam for: ${mod.title}
Syllabus: ${mod.syllabus}
Primary sources: ${mod.seedUrls.join(', ')} (follow links to the actual documents).

Cover the whole syllabus. Favour questions a practitioner would get wrong: exact thresholds, dates, scope edge-cases, which method applies when. Short-answer, not multiple choice.

Return ONLY a JSON array:
[{"q": "...", "answer": "...", "source_url": "...", "source_quote": "<verbatim>", "topic": "<syllabus area>"}]`,
    8000,
  )
  const exam = extractJson<ExamQuestion[]>(text)
  return exam && exam.length >= 5 ? exam.slice(0, 10) : null
}

async function sitExam(notes: string, exam: ExamQuestion[]): Promise<string[]> {
  const text = await plain(
    `You are sitting a closed-book exam. You may use ONLY the study notes provided — not your own background knowledge. If the notes do not contain the answer, answer exactly "NOT IN NOTES".`,
    `STUDY NOTES:\n${notes.slice(0, 40000)}\n\nQUESTIONS:\n${exam.map((e, i) => `${i + 1}. ${e.q}`).join('\n')}\n\nReturn ONLY a JSON array of ${exam.length} answer strings, in order.`,
  )
  return extractJson<string[]>(text) ?? []
}

async function gradeExam(exam: ExamQuestion[], answers: string[]) {
  const text = await plain(
    `You are a strict examiner. Mark each candidate answer correct only if it matches the answer key in substance, including any numbers, dates and thresholds. "NOT IN NOTES" is always wrong.`,
    exam.map((e, i) => `Q${i + 1} [${e.topic}]: ${e.q}\nKEY: ${e.answer}\nCANDIDATE: ${answers[i] ?? '(no answer)'}`).join('\n\n') +
      `\n\nReturn ONLY JSON: {"correct": [true/false x${exam.length}], "weak_areas": "<comma-separated topics answered wrongly, with what the notes got wrong or missed>"}`,
    2000,
  )
  return extractJson<{ correct: boolean[]; weak_areas: string }>(text)
}

// ─── Scheduling & persistence ─────────────────────────────────────────────────

interface KnowledgeRow {
  slug: string
  status: 'not_started' | 'studied' | 'mastered' | 'needs_restudy'
  notes: string | null
  weak_areas: string | null
  best_score: number | null
  attempts: number
  last_studied_at: string | null
}

async function ensureSeeded(supabase: Awaited<ReturnType<typeof createClient>>) {
  await supabase.from('verdant_knowledge').upsert(
    CURRICULUM.map(m => ({ slug: m.slug, title: m.title, mirrors_course: m.mirrorsCourse })),
    { onConflict: 'slug', ignoreDuplicates: true },
  )
}

/** Weakest first: failed restudies, then untouched modules in curriculum order, then refresh stale mastery. */
function pickNext(rows: KnowledgeRow[]): CurriculumModule | null {
  const bySlug = new Map(rows.map(r => [r.slug, r]))
  const age = (r?: KnowledgeRow) => (r?.last_studied_at ? Date.now() - new Date(r.last_studied_at).getTime() : Infinity)
  const ordered = [
    ...CURRICULUM.filter(m => bySlug.get(m.slug)?.status === 'needs_restudy').sort((a, b) => age(bySlug.get(b.slug)) - age(bySlug.get(a.slug))),
    ...CURRICULUM.filter(m => (bySlug.get(m.slug)?.status ?? 'not_started') === 'not_started'),
    ...CURRICULUM.filter(m => bySlug.get(m.slug)?.status === 'studied'),
    ...CURRICULUM.filter(m => bySlug.get(m.slug)?.status === 'mastered' && age(bySlug.get(m.slug)) > REFRESH_AFTER_DAYS * 86_400_000),
  ]
  return ordered[0] ?? null
}

export interface StudyResult { slug: string; title: string; score: number | null; status: string; weakAreas: string | null; error?: string }

export async function studyNextModule(slug?: string): Promise<StudyResult | null> {
  const supabase = await createClient()
  await ensureSeeded(supabase)
  const { data: rows } = await supabase.from('verdant_knowledge').select('slug, status, notes, weak_areas, best_score, attempts, last_studied_at')
  const mod = slug ? CURRICULUM.find(m => m.slug === slug) ?? null : pickNext((rows ?? []) as KnowledgeRow[])
  if (!mod) return null
  const row = (rows ?? []).find(r => r.slug === mod.slug) as KnowledgeRow | undefined

  const [study, exam] = await Promise.all([
    studyModule(mod, row?.notes ?? null, row?.weak_areas ?? null),
    setExam(mod),
  ])
  if (!study?.notes_markdown) {
    return { slug: mod.slug, title: mod.title, score: null, status: row?.status ?? 'not_started', weakAreas: null, error: 'Study call returned no usable notes' }
  }

  let score: number | null = null
  let weakAreas: string | null = null
  if (exam) {
    const answers = await sitExam(study.notes_markdown, exam)
    const graded = await gradeExam(exam, answers)
    if (graded?.correct?.length) {
      score = Math.round((graded.correct.filter(Boolean).length / exam.length) * 100)
      weakAreas = graded.weak_areas || null
    }
  }

  const status = score === null ? 'studied' : score >= MASTERY_THRESHOLD ? 'mastered' : 'needs_restudy'
  const now = new Date().toISOString()
  await supabase.from('verdant_knowledge').update({
    notes: study.notes_markdown,
    sources_read: (study.sources ?? []).map(s => ({ ...s, retrieved_at: now })),
    status,
    last_score: score,
    best_score: score === null ? row?.best_score ?? null : Math.max(score, row?.best_score ?? 0),
    weak_areas: weakAreas,
    attempts: (row?.attempts ?? 0) + 1,
    last_studied_at: now,
  }).eq('slug', mod.slug)

  // Mirror into VERDANT's native memory so the main cycle and chat can read it directly.
  await supabase.from('verdant_memory_files').upsert({
    path: `/memories/knowledge/${mod.slug}.md`,
    content: `# ${mod.title}\n_Studied ${now.slice(0, 10)} · self-test ${score ?? 'n/a'}% · status ${status}_\n\n${study.notes_markdown}`,
    updated_at: now,
  }, { onConflict: 'path' })

  return { slug: mod.slug, title: mod.title, score, status, weakAreas }
}

/** consult_knowledge tool — keyword search over study notes, returning cited excerpts. */
export async function consultKnowledge(query: string, slug?: string): Promise<string> {
  const supabase = await createClient()
  let q = supabase.from('verdant_knowledge').select('slug, title, notes, status, last_score, last_studied_at').not('notes', 'is', null)
  if (slug) q = q.eq('slug', slug)
  const { data } = await q
  if (!data?.length) return 'No study notes yet — VERDANT Academy has not studied this area. Verify from the primary source with web_fetch before stating it to a client.'

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  const hits: { title: string; meta: string; score: number; excerpt: string }[] = []
  for (const row of data) {
    const paragraphs = (row.notes as string).split(/\n{2,}/)
    for (const p of paragraphs) {
      const lower = p.toLowerCase()
      const score = terms.reduce((s, t) => s + (lower.includes(t) ? 1 : 0), 0)
      if (score > 0) hits.push({ title: row.title, meta: `${row.status}, self-test ${row.last_score ?? 'n/a'}%, studied ${String(row.last_studied_at).slice(0, 10)}`, score, excerpt: p.slice(0, 1200) })
    }
  }
  if (!hits.length) return `No notes matched "${query}". Modules studied: ${data.map(d => d.slug).join(', ')}. Verify from the primary source before stating it to a client.`
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(h => `### ${h.title} (${h.meta})\n${h.excerpt}`)
    .join('\n\n')
}

/** Public progress summary for the /credentials page. */
export async function getAcademyProgress() {
  const supabase = await createClient()
  const { data } = await supabase.from('verdant_knowledge').select('slug, status, last_score, best_score, attempts, last_studied_at, sources_read')
  const bySlug = new Map((data ?? []).map(r => [r.slug, r]))
  return CURRICULUM.map(m => {
    const r = bySlug.get(m.slug)
    return {
      ...m,
      status: (r?.status ?? 'not_started') as KnowledgeRow['status'],
      lastScore: r?.last_score ?? null,
      bestScore: r?.best_score ?? null,
      attempts: r?.attempts ?? 0,
      lastStudiedAt: r?.last_studied_at ?? null,
      sources: ((r?.sources_read ?? []) as { url: string; title: string }[]).slice(0, 4),
    }
  })
}
