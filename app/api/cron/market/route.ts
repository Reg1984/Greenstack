/**
 * VERDANT Monthly Market Analysis
 * Runs on the 1st of every month at 7am UTC via Vercel Cron
 * Runs the full 8-section strategic advisor against the entire green energy market.
 * Emails a strategic briefing to Reginald and saves findings to permanent memory.
 */

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { loadTopMemories, saveMemory } from '@/lib/verdant-memory'
import { getCRMSummary } from '@/lib/outreach-crm'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { thinkStrategically } from '@/lib/verdant-strategy'

const client = new Anthropic()

async function sendMarketBriefing(period: string, analysis: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VERDANT <verdant@greenstackai.co.uk>',
      to: 'info@greenstackai.co.uk',
      subject: `VERDANT Monthly Market Intelligence — ${period}`,
      html: `<div style="font-family:sans-serif;max-width:760px;line-height:1.8;color:#1a1a1a">
        <h2 style="color:#16a34a;margin-bottom:4px">VERDANT Monthly Market Analysis</h2>
        <p style="color:#6b7280;margin-top:0">${period}</p>
        <hr style="border-color:#e5e7eb"/>
        <div style="white-space:pre-wrap;font-size:14px">${analysis
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/^## (.*)/gm, '<h3 style="color:#16a34a;margin-top:24px">$1</h3>')
          .replace(/^### (.*)/gm, '<h4 style="color:#374151">$1</h4>')
        }</div>
        <hr style="border-color:#e5e7eb"/>
        <p style="color:#9ca3af;font-size:12px">VERDANT Autonomous Agent — GreenStack AI</p>
      </div>`,
    }),
  })
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createClient()
  const period = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const periodKey = new Date().toISOString().slice(0, 7) // e.g. "2026-04"

  try {
    // ── Load all available intelligence ──────────────────────────────────────

    const [
      { data: tenders },
      { data: bids },
      { data: outreachEmails },
      { data: crmContacts },
      { data: previousAnalyses },
      persistentMemory,
      crmSummary,
    ] = await Promise.all([
      supabase.from('tenders').select('title, value, status, sector, buyer, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('bids').select('title, value, status, buyer, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('outreach_emails').select('organisation, subject, status, sent_at').order('sent_at', { ascending: false }).limit(100),
      supabase.from('outreach_contacts').select('organisation, sector, status, country, followup_count').order('updated_at', { ascending: false }).limit(100),
      supabase.from('market_analyses').select('period, key_findings').order('created_at', { ascending: false }).limit(3),
      loadTopMemories(),
      getCRMSummary(),
    ])

    // ── Summarise the data into a market intelligence brief ──────────────────

    const tendersBySector: Record<string, number> = {}
    const tendersByStatus: Record<string, number> = {}
    let totalPipelineValue = 0

    for (const t of tenders ?? []) {
      tendersBySector[t.sector ?? 'unknown'] = (tendersBySector[t.sector ?? 'unknown'] ?? 0) + 1
      tendersByStatus[t.status ?? 'unknown'] = (tendersByStatus[t.status ?? 'unknown'] ?? 0) + 1
      totalPipelineValue += t.value ?? 0
    }

    const bidsWon = bids?.filter(b => b.status === 'won').length ?? 0
    const bidsLost = bids?.filter(b => b.status === 'lost').length ?? 0
    const bidsPending = bids?.filter(b => b.status === 'pending' || b.status === 'submitted').length ?? 0
    const winRate = (bidsWon + bidsLost) > 0 ? Math.round((bidsWon / (bidsWon + bidsLost)) * 100) : 0

    const emailsSent = outreachEmails?.length ?? 0
    const repliesReceived = crmContacts?.filter(c => c.status === 'replied').length ?? 0
    const replyRate = emailsSent > 0 ? Math.round((repliesReceived / emailsSent) * 100) : 0

    const contactsBySector: Record<string, number> = {}
    for (const c of crmContacts ?? []) {
      contactsBySector[c.sector ?? 'unknown'] = (contactsBySector[c.sector ?? 'unknown'] ?? 0) + 1
    }

    const prevAnalysisSummary = previousAnalyses?.length
      ? previousAnalyses.map(a => `${a.period}: ${JSON.stringify(a.key_findings)}`).join('\n')
      : 'No previous monthly analyses — this is the first.'

    const marketIntelligence = `## GREENSTACK AI — FULL MARKET INTELLIGENCE BRIEF
Period: ${period}

### PIPELINE STATISTICS
- Total tenders in database: ${tenders?.length ?? 0}
- Total pipeline value: £${(totalPipelineValue / 1000000).toFixed(2)}M
- Tenders by sector: ${Object.entries(tendersBySector).sort((a,b) => b[1]-a[1]).map(([s,n]) => `${s}: ${n}`).join(', ')}
- Tenders by status: ${Object.entries(tendersByStatus).map(([s,n]) => `${s}: ${n}`).join(', ')}

### BID PERFORMANCE
- Bids won: ${bidsWon}
- Bids lost: ${bidsLost}
- Bids pending: ${bidsPending}
- Win rate: ${winRate}%

### OUTREACH & CRM
- Total outreach emails sent: ${emailsSent}
- Contacts in CRM: ${crmContacts?.length ?? 0}
- Reply rate: ${replyRate}%
- Contacts by sector: ${Object.entries(contactsBySector).sort((a,b) => b[1]-a[1]).map(([s,n]) => `${s}: ${n}`).join(', ')}
- ${crmSummary}

### PREVIOUS MONTHLY ANALYSES
${prevAnalysisSummary}

### ACCUMULATED INTELLIGENCE
${persistentMemory}`

    // ── Run the 8-section strategic advisor at market level ──────────────────

    const analysis = await thinkStrategically(
      marketIntelligence,
      `This is the monthly full-market strategic review for GreenStack AI.
Analyse our complete position in the UK green energy and sustainability consultancy market.
What is our current strategic standing, who are the key threats and opportunities,
and what should be our primary market move for the next 90 days?
Apply all 8 sections to the market as a whole — not a single tender.`
    )

    // ── Save to permanent market_analyses table ───────────────────────────────

    // Extract key findings for quick lookup
    const topMoveMatch = analysis.match(/COMBINATION|OPENING|POSITIONAL|SACRIFICE|PASS/i)
    const keyFindings = {
      period: periodKey,
      win_rate: winRate,
      reply_rate: replyRate,
      pipeline_value_gbp: totalPipelineValue,
      top_strategic_move: topMoveMatch?.[0] ?? 'see analysis',
      tenders_analysed: tenders?.length ?? 0,
      bids_won: bidsWon,
    }

    await supabase.from('market_analyses').insert({
      period: periodKey,
      analysis,
      key_findings: keyFindings,
      created_at: new Date().toISOString(),
    })

    // ── Save headline findings to persistent VERDANT memory ──────────────────

    await Promise.all([
      saveMemory('market', `Monthly analysis ${periodKey}`, `Win rate: ${winRate}%. Reply rate: ${replyRate}%. Pipeline: £${(totalPipelineValue/1000000).toFixed(1)}M. Strategic move: ${keyFindings.top_strategic_move}`, 9),
      saveMemory('market', `Sector distribution ${periodKey}`, Object.entries(tendersBySector).sort((a,b) => b[1]-a[1]).slice(0,5).map(([s,n]) => `${s}:${n}`).join(', '), 7),
      saveMemory('market', `Outreach performance ${periodKey}`, `${emailsSent} emails sent, ${replyRate}% reply rate, ${repliesReceived} active conversations`, 7),
    ])

    // ── Send email briefing ───────────────────────────────────────────────────

    await sendMarketBriefing(period, analysis)

    return NextResponse.json({ success: true, period: periodKey, key_findings: keyFindings })
  } catch (error) {
    console.error('Market analysis cron error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
