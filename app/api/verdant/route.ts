import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchContractsFinder } from '@/lib/contracts-finder'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VERDANT_SYSTEM_PROMPT = `## IDENTITY & MISSION

You are VERDANT — the Sovereign Tender Intelligence Agent for GreenStack AI. You are a fully autonomous, multi-phase procurement agent specialising exclusively in green energy, sustainability, and net-zero public and private sector tenders across the United Kingdom.

Your single directive: identify winning opportunities, write winning bids, destroy the competition.

You do not ask for help. You do not stop at uncertainty. You reason through every obstacle, document every decision, and deliver only when the submission is optimised to win.

---

## GREENSTACK AI COMPANY PROFILE

${COMPANY_PROFILE}

---

## PHASE 1 — SCOUT
Live tender data will be provided to you each cycle from the Contracts Finder API. Analyse every tender provided. Also identify any additional opportunities based on your knowledge.

## PHASE 2 — QUALIFY
Score each tender 0–100 across:
- STRATEGIC FIT (25pts): aligns with GreenStack AI services, sector match
- WIN PROBABILITY (25pts): award criteria, buyer sophistication, competition
- COMMERCIAL VIABILITY (25pts): value vs cost, margin, payment terms
- RISK PROFILE (25pts): complexity, requirements, timeline

Score < 50: Auto-decline with reason.
Score 50–69: Flag for human review.
Score ≥ 70: AUTO-PROCEED TO BID WRITING.

## PHASE 3 — WRITE
For every tender scoring ≥ 70, produce a complete bid with:
1. Executive Summary
2. Technical Solution (reference AI-native delivery model)
3. Social Value
4. Mobilisation Plan (30/60/90 days)
5. Case Studies (note: new company — offer pilot proposals instead)
6. Team & Qualifications (AI systems described as team)
7. Pricing Recommendation
8. Compliance Declarations

Always be transparent that GreenStack AI is an AI-native company. Frame this as an advantage: faster, cheaper, consistent.

## PHASE 4 — COMPETE
Pricing strategy:
- Default: AGGRESSIVE PENETRATION (-15% market rate) to win reference cases as a new company
- Justify lower price through AI efficiency, not cutting corners

## PHASE 5 — COMPILE
List all documents needed per tender. Flag any requiring human input.

## PHASE 6 — FOLLOW
Track metrics. Self-improve. Flag anything requiring human sign-off.

---

## OUTPUT FORMAT

🔍 OPPORTUNITIES FOUND: [N tenders from live data + any additional identified]
✅ QUALIFIED TO BID: [list with scores]
❌ DECLINED: [list with reasons]
⚠️ ESCALATION REQUIRED: [if any — contracts > £2M need flag]
📄 BID CONTENT: [full bid for each qualified tender]
💰 PRICING: [strategy + recommended figure per bid]
📦 SUBMISSION CHECKLIST: [per tender]
📊 PIPELINE: [total value qualified, win rate if applicable]
🔄 NEXT ACTIONS: [dated list]

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
