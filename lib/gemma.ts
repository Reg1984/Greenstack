/**
 * VERDANT Gemma 4 Intelligence Layer
 *
 * Uses Google AI Studio's Gemma 4 (free, no rate-limit charges) for:
 * - Tender relevance classification (pre-filters junk before Claude sees it)
 * - Tender document field extraction (parse raw spec text into structured data)
 * - Buyer signal classification (is this Exa result actually a buying signal?)
 *
 * Claude is reserved for: bid writing, outreach emails, strategic analysis, chat.
 *
 * Setup: Add GOOGLE_AI_API_KEY to Vercel env vars (get from aistudio.google.com)
 * Model: gemma-4-26b-a4b-it (MoE — fast, free, activates 4B params per inference)
 *        Override via GEMMA_MODEL env var (e.g. gemma-4-31b-it for max capability)
 */

const GEMMA_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function getModel() {
  return process.env.GEMMA_MODEL ?? 'gemma-4-26b-a4b-it'
}

/** Core Gemma call via native Gemini API */
async function callGemma(
  prompt: string,
  options: { maxTokens?: number; json?: boolean; temperature?: number } = {}
): Promise<string> {
  const key = process.env.GOOGLE_AI_API_KEY
  if (!key) return ''

  const { maxTokens = 2048, json = false, temperature = 0.1 } = options

  try {
    const res = await fetch(
      `${GEMMA_BASE}/${getModel()}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
            ...(json ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      }
    )

    if (!res.ok) {
      console.warn(`Gemma API error: ${res.status} ${await res.text().catch(() => '')}`)
      return ''
    }

    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  } catch (err) {
    console.warn('Gemma call failed (non-fatal):', String(err))
    return ''
  }
}

/** Check if Gemma is available (key configured) */
export function isGemmaAvailable(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY
}

// ─────────────────────────────────────────────
// TENDER CLASSIFICATION
// ─────────────────────────────────────────────

export interface TenderScore {
  id: string
  relevant: boolean
  score: number // 0–100
  reason?: string
}

/**
 * Classify a batch of tenders as relevant or not for GreenStack AI.
 * Returns all as relevant=true if Gemma is unavailable (graceful degradation).
 * Reduces Claude's context by 70–80% on low-quality tender feeds.
 */
export async function classifyTenders(
  tenders: Array<{ id: string; title: string; description: string; authority: string; value: number }>
): Promise<TenderScore[]> {
  if (!isGemmaAvailable() || tenders.length === 0) {
    return tenders.map(t => ({ id: t.id, relevant: true, score: 50 }))
  }

  // Batch in groups of 30 to stay within context
  const batches: typeof tenders[] = []
  for (let i = 0; i < tenders.length; i += 30) {
    batches.push(tenders.slice(i, i + 30))
  }

  const allScores: TenderScore[] = []

  for (const batch of batches) {
    const list = batch
      .map((t, i) => `${i + 1}. [ID:${t.id.slice(-8)}] "${t.title}" | ${t.authority} | £${t.value > 0 ? t.value.toLocaleString() : 'TBC'}`)
      .join('\n')

    const prompt = `You are classifying UK procurement tenders for GreenStack AI, a sustainability consultancy.

MARK RELEVANT (score 60-100):
- Sustainability consultancy or strategy
- Net zero roadmap or strategy
- ESG / TCFD / CSRD / GRI reporting
- Energy efficiency consultancy or audit
- ESOS compliance assessment
- Carbon footprint (Scope 1, 2, 3)
- Decarbonisation strategy
- Green procurement policy
- Climate change strategy
- Estate sustainability (schools, NHS, councils)
- Environmental consultancy

MARK NOT RELEVANT (score 0-40):
- Transport / delivery / bus routes
- IT software, hardware, licensing, managed services
- Construction, civil engineering, maintenance
- Equipment or vehicle supply
- Staffing, recruitment, temporary labour
- Cleaning, catering, security, printing
- Medical, clinical, legal services
- Furniture, stationery

Tenders:
${list}

Return valid JSON array only:
[{"id":"last8chars","relevant":true,"score":85,"reason":"net zero roadmap for NHS trust"}]`

    const response = await callGemma(prompt, { maxTokens: 1024, json: true })

    try {
      const parsed: Array<{ id: string; relevant: boolean; score: number; reason?: string }> =
        JSON.parse(response)

      for (const tender of batch) {
        const shortId = tender.id.slice(-8)
        const match = parsed.find(
          p => p.id === shortId || tender.id.endsWith(p.id) || shortId.endsWith(p.id)
        )
        allScores.push({
          id: tender.id,
          relevant: match?.relevant ?? true,
          score: match?.score ?? 50,
          reason: match?.reason,
        })
      }
    } catch {
      // Parsing failed — mark all as relevant so nothing is lost
      batch.forEach(t => allScores.push({ id: t.id, relevant: true, score: 50 }))
    }
  }

  return allScores
}

// ─────────────────────────────────────────────
// TENDER DOCUMENT EXTRACTION
// ─────────────────────────────────────────────

export interface TenderFields {
  title?: string
  buyer?: string
  value?: string
  deadline?: string
  location?: string
  scope?: string
  keyRequirements: string[]
  evaluationCriteria: string[]
  mustHave: string[]
  contactEmail?: string
  cpvHint?: string
  wordLimit?: string
  submissionMethod?: string
}

/**
 * Extract structured fields from raw tender document text.
 * Use this before passing a large tender spec to Claude for bid writing —
 * saves tokens and gives Claude a cleaner brief to work from.
 */
export async function extractTenderFields(tenderText: string): Promise<TenderFields> {
  if (!isGemmaAvailable()) {
    return { keyRequirements: [], evaluationCriteria: [], mustHave: [] }
  }

  const prompt = `Extract the key fields from this tender document. Return JSON only.

Tender text:
${tenderText.slice(0, 12000)}

Return this JSON structure:
{
  "title": "contract title",
  "buyer": "buying organisation",
  "value": "contract value as string",
  "deadline": "submission deadline",
  "location": "UK location or region",
  "scope": "2-3 sentence description of what's required",
  "keyRequirements": ["requirement 1", "requirement 2"],
  "evaluationCriteria": ["price X%", "quality Y%"],
  "mustHave": ["accreditations or mandatory requirements"],
  "contactEmail": "procurement contact email if listed",
  "cpvHint": "likely CPV category",
  "wordLimit": "word limits for responses if stated",
  "submissionMethod": "how to submit"
}`

  const response = await callGemma(prompt, { maxTokens: 1024, json: true })

  try {
    return JSON.parse(response)
  } catch {
    return { keyRequirements: [], evaluationCriteria: [], mustHave: [] }
  }
}

// ─────────────────────────────────────────────
// BUYER SIGNAL CLASSIFICATION
// ─────────────────────────────────────────────

export interface ClassifiedSignal {
  isSignal: boolean
  signalType: string
  priority: 'high' | 'medium' | 'low'
  organisation?: string
  insight?: string
}

/**
 * Classify whether a web search result represents a genuine buying signal.
 * Used by the buyer intent monitor to filter noise from Exa search results.
 */
export async function classifyBuyerSignal(title: string, text: string, url: string): Promise<ClassifiedSignal> {
  if (!isGemmaAvailable()) {
    return { isSignal: true, signalType: 'unknown', priority: 'medium' }
  }

  const prompt = `Determine if this web content represents a genuine buying signal for sustainability consultancy services.

Title: ${title}
URL: ${url}
Content: ${text.slice(0, 600)}

A genuine signal means this organisation is ACTIVELY investing in or needs sustainability work:
- HIGH priority: job posting for sustainability/ESG/net zero role, announcing CBAM compliance need, CSRD reporting obligation, ESOS assessment due
- MEDIUM priority: announcing net zero target, sustainability report published (needs help next year), expansion into EU market
- LOW priority: general news mention, no clear action required
- NOT a signal: opinion piece, academic paper, unrelated content

Return JSON only:
{"isSignal": true, "signalType": "sustainability_job", "priority": "high", "organisation": "Company Name", "insight": "one sentence why this is a signal"}`

  const response = await callGemma(prompt, { maxTokens: 256, json: true })

  try {
    return JSON.parse(response)
  } catch {
    return { isSignal: true, signalType: 'unknown', priority: 'medium' }
  }
}

// ─────────────────────────────────────────────
// OUTREACH EMAIL FIRST DRAFT
// ─────────────────────────────────────────────

/**
 * Generate an outreach email first draft using Gemma (free).
 * Used for high-volume outreach where Claude would be expensive.
 * Output is reviewed/polished before sending if quality flag is set.
 */
export async function draftOutreachEmail(params: {
  organisation: string
  contactTitle?: string
  sector: string
  signal: string
  country: string
  isCBAM?: boolean
}): Promise<{ subject: string; body: string } | null> {
  if (!isGemmaAvailable()) return null

  const prompt = `Write a short cold outreach email on behalf of GreenStack AI, an AI-native sustainability consultancy.

Target: ${params.contactTitle ?? 'Sustainability/ESG team'} at ${params.organisation} (${params.sector}, ${params.country})
Why we're contacting: ${params.signal}
${params.isCBAM ? 'Include CBAM compliance angle and link: https://www.greenstackai.co.uk/cbam' : 'Include link: https://www.greenstackai.co.uk'}

GreenStack AI delivers:
- AI-native sustainability intelligence reports
- Net zero roadmaps, ESG/CSRD reports, carbon assessments
- 60-80% cheaper than Big Four, delivered in weeks not months
- Registered on UNGM (Vendor No. 1203916)

Rules:
- Under 180 words
- Specific to their situation — reference ${params.signal}
- Professional peer-to-peer tone, not salesy
- Clear CTA: 30-minute call or free pilot report
- Sign off: VERDANT | GreenStack AI | verdant@greenstackai.co.uk

Return JSON only: {"subject": "...", "body": "..."}`

  const response = await callGemma(prompt, { maxTokens: 512, json: true, temperature: 0.3 })

  try {
    return JSON.parse(response)
  } catch {
    return null
  }
}
