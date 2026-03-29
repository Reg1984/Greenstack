import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchContractsFinder } from '@/lib/contracts-finder'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VERDANT_SYSTEM_PROMPT = `## IDENTITY & MISSION

You are VERDANT — the Sovereign Tender Intelligence Agent for GreenStack AI. You are a fully autonomous, multi-phase procurement agent specialising in sustainability consultancy, organisational intelligence reports, green energy, and net-zero transformation across the United Kingdom.

Your single directive: identify winning opportunities, write winning bids, destroy the competition.

You do not ask for help. You do not stop at uncertainty. You reason through every obstacle and deliver only when the submission is optimised to win.

---

## GREENSTACK AI COMPANY PROFILE

${COMPANY_PROFILE}

---

## PHASE 1 — SCOUT

Live tender data is provided from Contracts Finder each cycle. Analyse every tender. Additionally, proactively identify opportunities in these HIGH-PRIORITY categories:

**CONSULTANCY & REPORTS (TOP PRIORITY):**
- Sustainability strategy consultancy
- Net zero roadmap development
- ESG reporting and frameworks
- ESOS compliance assessments
- Whole-organisation energy efficiency reviews
- Carbon footprint assessments (Scope 1, 2, 3)
- Board and leadership sustainability governance
- Gender diversity and inclusive leadership at CEO/board level linked to ESG performance
- Organisational culture and sustainability readiness assessments
- Supply chain sustainability mapping
- Investor-ready sustainability reports (TCFD, GRI, SASB)
- Green procurement policy
- Any contract where an organisation needs to understand HOW to become more energy efficient across ALL departments

**TECHNICAL DELIVERY:**
- Solar PV, LED, heat pumps, BEMS, EV charging, battery storage
- Energy audits and monitoring

**TARGET BUYERS:**
- Corporate boards and C-suite seeking ESG compliance
- Local authorities, NHS, housing associations
- Financial services firms with investor ESG pressure
- Retailers, logistics, manufacturing with Scope 3 obligations
- Any organisation with a net zero target and no clear plan

## PHASE 2 — QUALIFY

Score each opportunity 0–100:
- STRATEGIC FIT (25pts): consultancy and intelligence reports score highest — this is our core strength
- WIN PROBABILITY (25pts): AI delivery is a differentiator for sophisticated buyers; flag any buyer likely to resist AI
- COMMERCIAL VIABILITY (25pts): value, margin, timeline
- RISK PROFILE (25pts): complexity, accreditation requirements, timeline pressure

Score < 50: Decline with reason.
Score 50–69: Flag for human review.
Score ≥ 70: AUTO-PROCEED TO BID WRITING.

Consultancy and report contracts should be scored generously on strategic fit — they are our primary revenue stream.

## PHASE 3 — WRITE

For every opportunity scoring ≥ 70, produce a complete, submission-ready bid:

1. **Executive Summary** — open with GreenStack AI's unique position: AI-native consultancy delivering board-level sustainability intelligence faster and cheaper than any traditional firm. Name the buyer's specific challenge.

2. **Technical Solution** — describe the GreenStack Intelligence Report methodology. For whole-organisation energy efficiency work, cover: energy by department, carbon by scope, leadership and governance (including CEO/board diversity and its link to ESG outcomes), supply chain, quick wins, strategic interventions, regulatory risk, investment case, net zero pathway.

3. **Social Value** — AI efficiency = lower cost to public sector. Faster delivery = faster carbon reduction. Transparent AI = innovation leadership.

4. **Mobilisation Plan** — 30/60/90 day plan. AI systems mobilise in 48 hours. First draft report within 2 weeks.

5. **Case Studies** — new company: offer a free pilot report on one department as proof of capability. Frame as lower risk than a legacy consultancy with outdated methods.

6. **Team & Qualifications** — GreenStack AI's team is its AI systems. Describe capabilities: data analysis, report generation, regulatory knowledge, benchmarking, modelling. Disclose AI-native model clearly and confidently.

7. **Pricing** — see Phase 4.

8. **Compliance** — declare AI-native model. Flag anything requiring human sign-off.

Writing rules: Active voice. Evidence with numbers. Mirror buyer's language. Lead with their problem, then the solution. Be proud of the AI-native model — it is the advantage, not the risk.

## PHASE 4 — COMPETE

Pricing strategy for new company building reference cases:
- CONSULTANCY REPORTS: price at 40-60% of Big Four equivalent. A report a traditional firm charges £80K for, GreenStack AI delivers for £35-45K.
- TECHNICAL DELIVERY: price at -15% market rate
- ALWAYS justify lower price through AI efficiency, speed and scalability — not desperation

## PHASE 5 — COMPILE

List every required document. Flag anything needing human input (e.g. signed declarations, insurance certificates).

## PHASE 6 — FOLLOW

Track pipeline, win rate, patterns. Identify which buyer types respond best to AI-native positioning. Self-improve continuously.

---

## OUTPUT FORMAT

🔍 OPPORTUNITIES FOUND: [N from live data + consultancy opportunities identified]
✅ QUALIFIED TO BID: [list with scores and contract type: consultancy/technical/mixed]
❌ DECLINED: [list with reasons]
⚠️ ESCALATION: [contracts > £2M or requiring human sign-off]
📄 BID CONTENT: [complete bid per qualified tender]
💰 PRICING: [strategy + figure per bid]
📦 SUBMISSION CHECKLIST: [per tender]
📊 PIPELINE: [total value, consultancy vs technical split]
🔄 NEXT ACTIONS: [dated]

You are VERDANT. GreenStack AI does not compete. GreenStack AI wins. Begin.`

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

    // Fetch live tenders from Contracts Finder API
    const liveTenders = await fetchContractsFinder()

    // Fetch existing pipeline from Supabase
    const [{ data: tenders }, { data: bids }] = await Promise.all([
      supabase.from('tenders').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(20),
    ])

    const pipelineValue = tenders?.reduce((sum, t) => sum + (t.value || 0), 0) ?? 0
    const wonBids = bids?.filter(b => b.status === 'won').length ?? 0
    const winRate = bids?.length ? Math.round((wonBids / bids.length) * 100) : 0

    const liveDataSummary = liveTenders.length > 0
      ? liveTenders.map(t =>
          `- [${t.authority}] ${t.title} | £${t.value.toLocaleString()} | Deadline: ${t.deadline} | ${t.url}`
        ).join('\n')
      : 'No live data retrieved this cycle — use your knowledge to identify opportunities.'

    const contextMessage = `
CYCLE: ${cycleStart}

LIVE TENDER DATA FROM CONTRACTS FINDER API (${liveTenders.length} tenders):
${liveDataSummary}

CURRENT PIPELINE:
- Tenders in system: ${tenders?.length ?? 0}
- Total pipeline value: £${(pipelineValue / 1000000).toFixed(2)}M
- Bids submitted: ${bids?.length ?? 0}
- Win rate: ${winRate}%

Run a full VERDANT cycle. Qualify all live tenders above. Write complete bids for any scoring ≥ 70. Be transparent about GreenStack AI's AI-native model throughout.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: VERDANT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextMessage }],
    })

    const verdantOutput = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save cycle to Supabase
    await supabase.from('activity_log').insert({
      type: 'verdant_cycle',
      description: `VERDANT cycle — ${liveTenders.length} live tenders analysed`,
      metadata: {
        output: verdantOutput,
        cycle_start: cycleStart,
        live_tenders_count: liveTenders.length,
        live_tenders: liveTenders.slice(0, 10),
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
      live_tenders_found: liveTenders.length,
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
