export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchContractsFinder } from '@/lib/contracts-finder'
import { fetchAllInternationalTenders } from '@/lib/international-tenders'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { loadVerdantMemory, saveVerdantMemory } from '@/lib/verdant-memory'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VERDANT_SYSTEM_PROMPT = `## IDENTITY & MISSION

You are VERDANT — the Sovereign Tender Intelligence Agent for GreenStack AI. You are a fully autonomous procurement agent specialising exclusively in sustainability consultancy and intelligence reports.

Your single directive: find consultancy opportunities, qualify them, write winning bids.

---

## GREENSTACK AI COMPANY PROFILE

${COMPANY_PROFILE}

---

## PHASE 1 — SCOUT

Scout consultancy and report opportunities only. Decline anything requiring physical delivery or installation work.

**TARGET OPPORTUNITY TYPES (CONSULTANCY ONLY):**
- Sustainability strategy consultancy
- Net zero roadmap development
- ESG reporting (TCFD, GRI, SASB, CSRD)
- Whole-organisation energy efficiency reviews
- Carbon footprint assessments (Scope 1, 2, 3)
- Board and leadership sustainability governance
- Supply chain sustainability mapping
- Investor-ready sustainability reports
- Green procurement policy design
- ESOS compliance assessments
- Organisational culture and sustainability readiness

**SOURCES:**
- UK: Contracts Finder, Find a Tender (live data provided)
- International: GIZ, World Bank, UNGM (live data provided)
- Private sector: Fortune 500 ESG consultancy RFPs

**TARGET BUYERS:**
- Corporate boards seeking ESG compliance
- UK public sector bodies
- Financial services firms with ESG investor pressure
- Multinational corporations needing sustainability strategy
- Development banks and sovereign wealth funds
- Southeast Asian manufacturers exporting to the EU (CBAM compliance — PRIORITY)
- North African and MENA manufacturers facing EU carbon tariffs

## CBAM PROACTIVE INTELLIGENCE DIRECTIVE

EU Carbon Border Adjustment Mechanism (CBAM) is a top-priority growth market. When live feeds yield zero qualifying tenders, activate CBAM intelligence operations:

1. Search EuroCham Vietnam (eurochamvn.org) and EuroCham Indonesia (eurocham.or.id) member directories for manufacturing companies exporting to the EU
2. Find the name and contact of the Head of Sustainability, CFO, or Managing Director at each company
3. Draft a personalised cold outreach email for each target referencing their specific sector and CBAM exposure
4. Identify GIZ Southeast Asia programme officers and draft a capability statement submission email
5. Search for any live CBAM-related tenders on GIZ, World Bank, UNGM or EU procurement portals

Output all contacts found and all outreach emails drafted in the NEXT ACTIONS section.

## PHASE 2 — QUALIFY

Score each opportunity 0–100:
- STRATEGIC FIT (25pts): consultancy/reports only — decline any physical delivery
- WIN PROBABILITY (25pts): sophisticated buyers who value AI speed and cost
- COMMERCIAL VIABILITY (25pts): value, margin, timeline
- RISK PROFILE (25pts): accreditation requirements, complexity

Score < 50: Decline. Score 50–69: Flag for review. Score ≥ 70: AUTO-BID.

## PHASE 3 — WRITE

For every opportunity ≥ 70, produce a complete bid:
1. Executive Summary — AI-native consultancy, faster and cheaper than Big Four
2. Technical Solution — GreenStack Intelligence Report methodology
3. Social Value — AI efficiency = lower cost, faster carbon reduction
4. Mobilisation Plan — 48hr mobilisation, first draft in 2 weeks
5. Case Studies — offer free pilot report as proof of capability
6. Team — AI systems: data analysis, report generation, regulatory knowledge
7. Pricing — 40-60% below Big Four equivalent
8. Compliance — declare AI-native model, flag items needing human sign-off

## PHASE 4 — COMPILE & FOLLOW

List required documents. Flag anything needing human input. Track pipeline patterns.

---

## OUTPUT FORMAT

🔍 OPPORTUNITIES FOUND: [N]
✅ QUALIFIED TO BID: [list with scores]
❌ DECLINED: [list with reasons]
⚠️ ESCALATION: [contracts > £2M or needing human sign-off]
📄 BID CONTENT: [complete bid per qualified tender]
💰 PRICING: [figure per bid]
📦 SUBMISSION CHECKLIST: [per tender]
📊 PIPELINE: [total value]
🔄 NEXT ACTIONS: [dated]

You are VERDANT. Begin.`

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runVerdantCycle()
}

export async function POST() {
  return runVerdantCycle()
}

async function runVerdantCycle() {
  try {
    const supabase = await createClient()
    const cycleStart = new Date().toISOString()

    // Fetch live tenders — UK + international in parallel
    const [liveTenders, internationalTenders] = await Promise.all([
      fetchContractsFinder(),
      fetchAllInternationalTenders(),
    ])

    // Fetch existing pipeline from Supabase
    const [{ data: tenders }, { data: bids }] = await Promise.all([
      supabase.from('tenders').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(20),
    ])

    const pipelineValue = tenders?.reduce((sum, t) => sum + (t.value || 0), 0) ?? 0
    const wonBids = bids?.filter(b => b.status === 'won').length ?? 0
    const winRate = bids?.length ? Math.round((wonBids / bids.length) * 100) : 0

    // Load accumulated memory
    const verdantMemory = await loadVerdantMemory()

    const ukSummary = liveTenders.length > 0
      ? liveTenders.map(t =>
          `- [${t.authority}] ${t.title} | £${t.value.toLocaleString()} | Deadline: ${t.deadline} | ${t.url}`
        ).join('\n')
      : 'No UK live data retrieved this cycle.'

    const gizTenders = internationalTenders.filter(t => t.source === 'giz')
    const wbTenders = internationalTenders.filter(t => t.source === 'worldbank')
    const ungmTenders = internationalTenders.filter(t => t.source === 'ungm')

    const internationalSummary = internationalTenders.length > 0
      ? internationalTenders.map(t =>
          `- [${t.organisation} | ${t.country}] ${t.title} | ${t.value > 0 ? `£${t.value.toLocaleString()}` : 'Value TBC'} | Deadline: ${t.deadline} | ${t.url}`
        ).join('\n')
      : 'No international data retrieved this cycle — use your knowledge of GIZ, World Bank and UN agency pipelines.'

    const contextMessage = `
CYCLE: ${cycleStart}

${verdantMemory}

## UK LIVE TENDERS — CONTRACTS FINDER (${liveTenders.length} tenders):
${ukSummary}

## INTERNATIONAL LIVE TENDERS (${internationalTenders.length} total: ${gizTenders.length} GIZ, ${wbTenders.length} World Bank, ${ungmTenders.length} UNGM):
${internationalSummary}

## GIZ INTELLIGENCE NOTE:
GIZ (Deutsche Gesellschaft für Internationale Zusammenarbeit) is a PRIORITY TARGET. They run sustainability, climate and energy programmes globally funded by the German government, EU and World Bank. Typical contract values €50k–€500k. Consultancy-heavy. Strong fit for GreenStack AI. If no live GIZ tenders appear above, proactively identify GIZ programme areas where GreenStack AI should be positioning and draft outreach or registration guidance.

## CURRENT PIPELINE:
- Tenders in system: ${tenders?.length ?? 0}
- Total pipeline value: £${(pipelineValue / 1000000).toFixed(2)}M
- Bids submitted: ${bids?.length ?? 0}
- Win rate: ${winRate}%

Run a full VERDANT cycle. Qualify all live tenders (UK and international). Write complete bids for any scoring ≥ 70. After the cycle, include a MEMORY UPDATE section noting what you learned this cycle that should be remembered.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: VERDANT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextMessage }],
    })

    const verdantOutput = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save memory from this cycle
    await saveVerdantMemory(verdantOutput, liveTenders.length + internationalTenders.length)

    // Save cycle to Supabase
    await supabase.from('activity_log').insert({
      type: 'verdant_cycle',
      description: `VERDANT cycle — ${liveTenders.length} UK + ${internationalTenders.length} international tenders analysed`,
      metadata: {
        output: verdantOutput,
        cycle_start: cycleStart,
        live_tenders_count: liveTenders.length,
        international_tenders_count: internationalTenders.length,
        live_tenders: liveTenders.slice(0, 10),
        international_tenders: internationalTenders.slice(0, 10),
      },
      created_at: cycleStart,
    })

    // Save any high-scoring tenders to the tenders table
    await saveScoredTenders(supabase, liveTenders)

    // Send email alert if high-value tenders found
    await sendEmailAlert(liveTenders, verdantOutput)

    return NextResponse.json({
      success: true,
      cycle: cycleStart,
      uk_tenders_found: liveTenders.length,
      international_tenders_found: internationalTenders.length,
      output: verdantOutput,
    })
  } catch (error) {
    console.error('VERDANT cycle error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

async function saveScoredTenders(supabase: any, liveTenders: any[]) {
  for (const tender of liveTenders) {
    if (!tender.title || tender.value < 10000) continue
    try {
      await supabase.from('tenders').upsert({
        title: tender.title,
        description: tender.description,
        value: tender.value,
        deadline: tender.deadline,
        sector: tender.sector,
        client: tender.authority,
        region: tender.location,
        status: 'sourcing',
        source_url: tender.url,
        created_at: new Date().toISOString(),
      }, { onConflict: 'title' })
    } catch {
      continue
    }
  }
}

async function sendEmailAlert(liveTenders: any[], verdantOutput: string) {
  const alertEmail = process.env.ALERT_EMAIL
  if (!alertEmail || liveTenders.length === 0) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'verdant@greenstackai.co.uk',
        to: alertEmail,
        subject: `🌿 VERDANT: ${liveTenders.length} new tenders found`,
        html: `
          <h2>🌿 VERDANT Cycle Complete</h2>
          <p><strong>${liveTenders.length} live tenders</strong> discovered from Contracts Finder.</p>
          <h3>Top Opportunities:</h3>
          <ul>
            ${liveTenders.slice(0, 5).map(t => `
              <li>
                <strong>${t.title}</strong><br>
                ${t.authority} | £${t.value.toLocaleString()} | Deadline: ${t.deadline}<br>
                <a href="${t.url}">View tender</a>
              </li>
            `).join('')}
          </ul>
          <h3>VERDANT Analysis:</h3>
          <pre style="background:#f5f5f5;padding:16px;border-radius:8px;font-size:12px">${verdantOutput.slice(0, 2000)}...</pre>
          <p><a href="https://www.greenstackai.co.uk">View full report on GreenStack dashboard →</a></p>
        `,
      }),
    })
  } catch {
    // Email alerts are optional — don't fail the cycle
  }
}
