export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchContractsFinder, fetchDevolvedTenders } from '@/lib/contracts-finder'
import { fetchAllInternationalTenders } from '@/lib/international-tenders'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { loadVerdantMemory, saveVerdantMemory } from '@/lib/verdant-memory'
import { runBuyerIntentScan, formatSignalsForVerdant } from '@/lib/buyer-intent'
import { getCRMSummary } from '@/lib/outreach-crm'
import { classifyTenders, isGemmaAvailable } from '@/lib/gemma'
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
- **Education sector sustainability** — whole-estate energy audits, net zero roadmaps for schools, colleges, universities, and academy trusts; carbon reporting for education buildings and campuses; Scope 1/2/3 for educational institutions; compliance with DfE sustainability frameworks and Public Sector Decarbonisation Scheme

**SOURCES:**
- UK: Contracts Finder, Find a Tender (live data provided)
- International: GIZ, World Bank, UNGM (live data provided)
- US Federal: SAM.gov (search beta.sam.gov/search?index=opp for sustainability/ESG/climate consultancy), USAID, EPA, Department of Energy grants
- Africa: African Development Bank (afdb.org/en/projects-and-operations/procurement), African Union Commission, USAID Africa, GIZ Africa programmes, Kenya Public Procurement (ppip.go.ke), South Africa Treasury eTender
- Private sector: Fortune 500 ESG consultancy RFPs

**TARGET BUYERS:**
- Corporate boards seeking ESG compliance
- UK public sector bodies
- UK schools, academy trusts, multi-academy trusts (MATs), colleges, universities — estate sustainability and net zero
- Financial services firms with ESG investor pressure
- Multinational corporations needing sustainability strategy
- Development banks and sovereign wealth funds
- Southeast Asian manufacturers exporting to the EU (CBAM compliance — PRIORITY)
- North African and MENA manufacturers facing EU carbon tariffs
- US federal agencies and state governments with sustainability mandates
- African development finance institutions and government ministries

## CBAM PROACTIVE INTELLIGENCE DIRECTIVE

EU Carbon Border Adjustment Mechanism (CBAM) is a top-priority growth market. When live feeds yield zero qualifying tenders, activate CBAM intelligence operations:

1. Search EuroCham Vietnam (eurochamvn.org) and EuroCham Indonesia (eurocham.or.id) member directories for manufacturing companies exporting to the EU
2. Find the name and contact of the Head of Sustainability, CFO, or Managing Director at each company
3. Draft a personalised cold outreach email for each target referencing their specific sector and CBAM exposure
4. Identify GIZ Southeast Asia programme officers and draft a capability statement submission email
5. Search for any live CBAM-related tenders on GIZ, World Bank, UNGM or EU procurement portals

Output all contacts found and all outreach emails drafted in the NEXT ACTIONS section.

## US FEDERAL & STATE INTELLIGENCE DIRECTIVE

When live feeds yield zero qualifying tenders, also activate US intelligence operations:

1. Search SAM.gov (beta.sam.gov) for active sustainability, ESG, climate, energy efficiency, or net zero consultancy solicitations
2. Check USAID's business opportunities (usaid.gov/partner-with-us/business-opportunities) for climate/environment consultancy RFPs
3. Search EPA and Department of Energy grants/contracts for consultancy scope
4. Target large US corporations (Fortune 500) with unfulfilled ESG/CSRD reporting obligations — especially those with EU operations subject to CSRD
5. Draft cold outreach emails to US Sustainability Officers, Chief ESG Officers, or VP Environment at companies with significant EU revenue exposure

## AFRICA INTELLIGENCE DIRECTIVE

When live feeds yield zero qualifying tenders, also activate Africa intelligence operations:

1. Search the African Development Bank procurement portal (afdb.org/en/projects-and-operations/procurement) for sustainability/climate/energy consultancy notices
2. Search GIZ Africa programme tenders — GIZ runs major climate and energy programmes across Kenya, Nigeria, South Africa, Ethiopia, Ghana
3. Check USAID Africa mission procurement opportunities — climate and clean energy are priority sectors
4. Target South African corporates with JSE sustainability reporting obligations and UK/EU trade exposure
5. Target Kenyan and Nigerian businesses seeking international ESG credibility for export financing
6. Look for African Union climate finance and green economy programme consultancy needs

Output all contacts found and all outreach emails drafted in the NEXT ACTIONS section.

## REGULATORY CALENDAR — KEY DEADLINES TO EXPLOIT

Use these deadlines proactively in outreach and bid writing. Companies need consultancy 6–12 months BEFORE the deadline:

| Regulation | Who | Deadline | Our Opportunity |
|------------|-----|----------|-----------------|
| CBAM Full Enforcement | EU-exporting manufacturers (steel, aluminium, cement, fertilisers, hydrogen) | **January 2026 — NOW ACTIVE** | CBAM compliance assessments, carbon declarations |
| CSRD Phase 1 | Large EU-listed companies (>500 employees) | FY2024 reporting (2025 deadline) | ESG/CSRD reports |
| CSRD Phase 2 | Large UK/non-EU companies with EU operations (>250 employees, €40M+ turnover) | FY2025 reporting (2026 deadline) | **URGENT NOW** |
| CSRD Phase 3 | Listed SMEs | FY2026 reporting (2027 deadline) | Approaching window |
| ESOS Phase 3 | UK large companies (>250 employees OR £44M+ turnover) | **December 2027** — but audits take 12–18 months | Target NOW for Phase 3 contracts |
| SECR Annual | UK quoted companies & large unquoted | Annual (April) | Carbon reporting each year |
| TCFD | UK premium listed companies, large LLPs | Already mandatory | Ongoing advisory |
| UK SRS (Sustainability Reporting Standards) | UK companies | Expected 2025/2026 | Get in early as advisors |
| Public Sector Decarbonisation Scheme | UK public sector estates | Ongoing rounds | Feasibility + strategy consultancy |
| NHS Net Zero | NHS trusts and suppliers | 2040 target (emissions plans due now) | NHS estate decarbonisation |
| DfE Sustainability Framework | Schools, academies, MATs | Ongoing | Education estate sustainability |
| EUDR (EU Deforestation Regulation) | Companies exporting forest-risk commodities to EU | December 2025 | Due diligence + supply chain mapping |

## SECTOR CAPABILITY STATEMENTS

When targeting specific sectors, adapt the pitch:

**Education (Schools, MATs, Universities):**
"We deliver whole-estate carbon audits and DfE-aligned net zero roadmaps for academy trusts and universities — covering all buildings, travel, procurement and supply chain. Delivered in weeks, not months, aligned to the Public Sector Decarbonisation Scheme funding criteria."

**Manufacturing (CBAM):**
"Your EU customers now legally require verified embedded carbon data per product. We deliver CBAM-ready Scope 1 & 2 assessments per product line in 3 weeks — at 60-80% below Big Four cost."

**Financial Services (CSRD/TCFD):**
"CSRD Phase 2 requires comprehensive sustainability reporting for FY2025. We deliver CSRD-aligned ESG reports covering double materiality assessment, Scope 1/2/3, and governance — investor-ready in 4 weeks."

**NHS & Healthcare:**
"NHS trusts must demonstrate net zero delivery plans aligned to Greener NHS targets. We produce board-ready net zero roadmaps covering estate, fleet, procurement and supply chain — in 3 weeks."

**Local Government:**
"We help councils meet their climate emergency declarations with practical, fundable net zero roadmaps — covering estate, transport fleet, procurement, and community engagement — aligned to PSDS and UK100 frameworks."

## FRAMEWORK REGISTRATION DIRECTIVE

GreenStack AI should be registered on these frameworks to receive direct award invitations. When no live tenders qualify, use your browser research to identify which frameworks are currently open for applications and note any deadlines:

- **G-Cloud 15** (Crown Commercial Service) — cloud and digital services framework. Open periodically. Register at crowncommercial.gov.uk. Direct awards possible with no competitive tender.
- **DOS6 / Digital Outcomes** (CCS) — consultancy and specialist services. Check status.
- **NHS Shared Business Services** — sustainability consultancy framework for NHS buyers.
- **YPO Framework** (education sector) — used by schools and councils. ypoprocurement.co.uk
- **CPC (Crescent Purchasing Consortium)** — education sustainability framework.
- **ESPO** — East of England/national framework for public sector sustainability.
- **NEUPC / SUPC / LUPC** — regional university purchasing consortia with sustainability frameworks.

Include in NEXT ACTIONS section: which frameworks are currently open, and which the browser agent should register on.

## DEVOLVED MARKETS DIRECTIVE

Always scan devolved UK procurement in addition to Contracts Finder:
- **Scotland**: Search publiccontractsscotland.gov.uk — sustainability, net zero, energy, decarbonisation
- **Wales**: Search sell2wales.gov.wales — net zero, sustainability, carbon, energy efficiency
- **Northern Ireland**: Search etendersni.gov.uk — environmental, sustainability, energy

Use your browse_url tool to search each portal when the main UK feed is sparse.

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
  // Allow Vercel cron (passes CRON_SECRET) or unauthenticated internal calls
  // POST is already open — GET is cron-only so no meaningful security benefit
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runVerdantCycle()
}

export async function POST() {
  return runVerdantCycle()
}

async function runVerdantCycle() {
  // Hard 240s timeout — ensures we always return before Vercel's 300s limit
  const cycleTimeout = new Promise<NextResponse>(resolve =>
    setTimeout(() => resolve(NextResponse.json({
      success: false,
      error: 'Cycle timed out after 240s — partial data may have been collected',
    })), 240000)
  )
  return Promise.race([runCycleInternal(), cycleTimeout])
}

/** Race a promise against a timeout — returns fallback value if timeout wins */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))])
}

async function runCycleInternal() {
  try {
    const supabase = await createClient()
    const cycleStart = new Date().toISOString()

    // Phase 1: Fetch all data — hard 45s cap on the entire phase
    const [liveTenders, internationalTenders, devolvedPortals, buyerSignals, crmSummary] = await withTimeout(
      Promise.all([
        fetchContractsFinder(),
        fetchAllInternationalTenders(),
        fetchDevolvedTenders(),
        runBuyerIntentScan(),
        getCRMSummary(),
      ]),
      45000,
      [[], [], [], [], 'CRM: timeout']
    )

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

    // Phase 2: Gemma pre-filter — hard 25s cap, falls back to all tenders
    let filteredTenders = liveTenders
    let gemmaStats = ''
    if (isGemmaAvailable() && liveTenders.length > 0) {
      const scores = await withTimeout(classifyTenders(liveTenders), 25000, liveTenders.map(t => ({ id: t.id, relevant: true, score: 50 })))
      const filtered = liveTenders.filter(t => {
        const s = scores.find(sc => sc.id === t.id)
        return !s || s.relevant
      })
      gemmaStats = `Gemma 4 pre-filter: ${liveTenders.length} fetched → ${filtered.length} relevant (${liveTenders.length - filtered.length} rejected)`
      filteredTenders = filtered
    } else {
      gemmaStats = isGemmaAvailable() ? 'No tenders to classify' : 'Gemma unavailable — showing all tenders'
    }

    // Cap tenders sent to Claude at 40 to control token usage and response time
    filteredTenders = filteredTenders.slice(0, 40)

    const ukSummary = filteredTenders.length > 0
      ? filteredTenders.map(t =>
          `- [${t.authority}] ${t.title} | £${t.value.toLocaleString()} | Deadline: ${t.deadline} | ${t.url}`
        ).join('\n')
      : 'No qualifying UK tenders after Gemma classification.'

    const gizTenders = internationalTenders.filter(t => t.source === 'giz')
    const wbTenders = internationalTenders.filter(t => t.source === 'worldbank')
    const ungmTenders = internationalTenders.filter(t => t.source === 'ungm')

    const internationalSummary = internationalTenders.length > 0
      ? internationalTenders.map(t =>
          `- [${t.organisation} | ${t.country}] ${t.title} | ${t.value > 0 ? `£${t.value.toLocaleString()}` : 'Value TBC'} | Deadline: ${t.deadline} | ${t.url}`
        ).join('\n')
      : 'No international data retrieved this cycle — use your knowledge of GIZ, World Bank and UN agency pipelines.'

    const devolvedSummary = devolvedPortals.map(p => `- ${p.region}: ${p.url}`).join('\n')
    const buyerIntentSummary = formatSignalsForVerdant(buyerSignals)

    const contextMessage = `
CYCLE: ${cycleStart}

${verdantMemory}

## CURRENT PIPELINE:
- Tenders in system: ${tenders?.length ?? 0}
- Total pipeline value: £${(pipelineValue / 1000000).toFixed(2)}M
- Bids submitted: ${bids?.length ?? 0}
- Win rate: ${winRate}%
- ${crmSummary}

## 🤖 GEMMA 4 INTELLIGENCE LAYER: ${gemmaStats}

## UK LIVE TENDERS — CONTRACTS FINDER (${filteredTenders.length} qualifying of ${liveTenders.length} fetched):
${ukSummary}

## DEVOLVED MARKET PORTALS — Browse these for additional UK opportunities not on Contracts Finder:
${devolvedSummary}

## INTERNATIONAL LIVE TENDERS (${internationalTenders.length} total: ${gizTenders.length} GIZ, ${wbTenders.length} World Bank, ${ungmTenders.length} UNGM):
${internationalSummary}

${buyerIntentSummary}

Run a full VERDANT cycle. Qualify all live tenders (UK + international + devolved). Act on HIGH priority buyer intent signals with personalised outreach. Write complete bids for any scoring ≥ 70. After the cycle, include a MEMORY UPDATE section noting what you learned this cycle that should be remembered.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
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
