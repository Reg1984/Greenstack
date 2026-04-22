/**
 * VERDANT Shared Tool Definitions & Executors
 * Used by both the hourly cron cycle (route.ts) and interactive chat (chat/route.ts)
 * so both modes have identical capabilities and VERDANT behaves consistently.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkContactExists, upsertContact } from '@/lib/outreach-crm'
import { saveMemory } from '@/lib/verdant-memory'
import { navigateAndExtract } from '@/lib/browser-agent'
import { updateGoalProgress } from '@/lib/verdant-goals'

// ─── Tool Executors ───────────────────────────────────────────────────────────

export async function browseUrl(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
    })
    if (!res.ok) return `Could not fetch ${url} — status ${res.status}`
    return (await res.text()).slice(0, 8000)
  } catch (err) {
    return `Browse error for ${url}: ${String(err)}`
  }
}

export async function searchWeb(query: string): Promise<string> {
  const exaKey = process.env.EXA_API_KEY
  if (exaKey) {
    try {
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': exaKey },
        body: JSON.stringify({
          query,
          numResults: 8,
          useAutoprompt: true,
          type: 'neural',
          contents: { text: { maxCharacters: 800 } },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return (data?.results ?? [])
          .map((r: any) => `## ${r.title}\n${r.url}\n${r.text ?? ''}`)
          .join('\n\n')
          .slice(0, 6000)
      }
    } catch { /* fall through to Jina */ }
  }
  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
    })
    if (!res.ok) return `Search failed for "${query}" — status ${res.status}`
    return (await res.text()).slice(0, 6000)
  } catch (err) {
    return `Search error: ${String(err)}`
  }
}

export async function executeOutreachEmail(input: {
  to_email: string
  to_name?: string
  organisation: string
  subject: string
  body: string
  signal?: string
}): Promise<string> {
  // CRM dedup — skip if contacted in last 3 days
  const existing = await checkContactExists(input.to_email, input.organisation)
  if (existing?.last_contacted_at) {
    const daysSince = Math.floor(
      (Date.now() - new Date(existing.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince < 3) {
      return `⚠️ CRM: ${input.organisation} contacted ${daysSince}d ago (${existing.status}). Skipping to avoid spam.`
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return `Email queued for ${input.to_email} — no RESEND_API_KEY configured`

  const html = `<div style="font-family:sans-serif;max-width:600px;line-height:1.7;color:#222">${input.body.replace(/\n/g, '<br/>')}</div>`

  let resendId: string | null = null
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VERDANT | GreenStack AI <verdant@greenstackai.co.uk>',
      to: input.to_email,
      bcc: 'info@greenstackai.co.uk',
      subject: input.subject,
      text: input.body,
      html,
    }),
  })
  const data = await res.json()
  if (!res.ok) return `Email send failed: ${data.message ?? res.status}`
  resendId = data.id ?? null

  // Log to outreach_emails + update CRM contact
  const supabase = await createClient()
  await Promise.all([
    supabase.from('outreach_emails').insert({
      to_email: input.to_email,
      to_name: input.to_name ?? null,
      organisation: input.organisation,
      subject: input.subject,
      body: input.body,
      status: 'sent',
      resend_id: resendId,
      sent_at: new Date().toISOString(),
    }),
    upsertContact({
      organisation: input.organisation,
      contact_name: input.to_name,
      contact_email: input.to_email,
      signal: input.signal,
      source: 'verdant',
    }),
  ])

  return `✅ Email sent to ${input.to_email} at ${input.organisation}. Subject: "${input.subject}". Logged in CRM.`
}

// ─── Tool Schema Definitions ──────────────────────────────────────────────────

export const VERDANT_BASE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'browse_url',
    description: 'Fetch and read the full content of any public webpage. Use to read tender specs, research organisations, check GIZ/World Bank/UNGM notices, or read any document online.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Full URL starting with https://' },
        reason: { type: 'string', description: 'Brief note on why you are browsing this URL' },
      },
      required: ['url'],
    },
  },
  {
    name: 'search_web',
    description: 'Search the web for current information — procurement contacts, company details, live tenders, regulatory updates, pricing benchmarks.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_outreach_email',
    description: 'Send a personalised cold outreach email to a qualified lead. Always call check_crm first. Keep under 200 words. Peer-to-peer tone.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to_email: { type: 'string', description: 'Recipient email address' },
        to_name: { type: 'string', description: 'Recipient full name if known' },
        organisation: { type: 'string', description: 'Recipient organisation name' },
        subject: { type: 'string', description: 'Specific subject line — not generic' },
        body: {
          type: 'string',
          description: 'Full email body, under 200 words. For CBAM leads include https://www.greenstackai.co.uk/cbam. For general outreach use https://www.greenstackai.co.uk. Sign off: VERDANT | GreenStack AI | verdant@greenstackai.co.uk',
        },
        signal: { type: 'string', description: 'Why this lead is warm, e.g. cbam_exposure, sustainability_job, net_zero_target' },
      },
      required: ['to_email', 'organisation', 'subject', 'body'],
    },
  },
  {
    name: 'check_crm',
    description: 'Check if an organisation or email is already in the outreach CRM. Always call this before send_outreach_email to prevent duplicate contact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string', description: 'Email address to check (optional)' },
        organisation: { type: 'string', description: 'Organisation name to check' },
      },
      required: ['organisation'],
    },
  },
  {
    name: 'save_memory',
    description: 'Save intelligence or a decision to persistent memory — available in ALL future cycles. Use proactively to remember: organisations targeted, contacts found, bid decisions made, market intelligence discovered, anything worth knowing next time.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Memory category: contacts | pipeline | decisions | market | intelligence | outreach',
        },
        key: {
          type: 'string',
          description: 'Short identifier, e.g. "Gorse Academies Trust — outreach sent 2026-04-19"',
        },
        value: {
          type: 'string',
          description: 'The information to remember — be specific and actionable',
        },
        importance: {
          type: 'number',
          description: '1–10 scale. 8–10 for confirmed leads/decisions, 5–7 for general intel, 1–4 for low-priority notes.',
        },
      },
      required: ['category', 'key', 'value'],
    },
  },
  {
    name: 'browse_portal',
    description: 'Navigate a website with a REAL browser that executes JavaScript. Use this when browse_url fails on JS-heavy pages — procurement portals, GIZ/World Bank tender systems, dynamic company sites, pages requiring login. Returns the full rendered page text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Full URL to navigate to' },
        goal: { type: 'string', description: 'What you are trying to extract — helps interpret the result' },
      },
      required: ['url', 'goal'],
    },
  },
  {
    name: 'update_goal_strategy',
    description: 'Update your strategy and log an action toward an active goal. Call this at the end of every cycle to record what you did and adjust your approach to hit the target.',
    input_schema: {
      type: 'object' as const,
      properties: {
        goal_id: { type: 'string', description: 'The goal ID from the ACTIVE GOALS section of your context' },
        strategy: { type: 'string', description: 'Your updated strategy to hit this goal — be specific: which markets, which actions, what run rate is needed' },
        action_taken: { type: 'string', description: 'What you did this cycle toward this goal, e.g. "Sent 3 CBAM outreach emails to Indian steel exporters"' },
      },
      required: ['goal_id', 'strategy'],
    },
  },
  {
    name: 'queue_portal_form',
    description: 'Fill a procurement portal registration or application form using a real browser, then queue it for human approval before submitting. Use for: Crown Commercial Service supplier registration, GIZ DAMOS portal, UNGM profile completion, World Bank STEP, YPO, ESPO, NHS frameworks. VERDANT fills the form with GreenStack AI company data and takes a screenshot — the human reviews and approves before anything is submitted.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'URL of the registration or application form' },
        purpose: { type: 'string', description: 'What this form does, e.g. "Crown Commercial Service G-Cloud supplier registration"' },
        custom_instructions: { type: 'string', description: 'Any specific guidance for filling this form' },
      },
      required: ['url', 'purpose'],
    },
  },
]

// ─── Tool Executor ────────────────────────────────────────────────────────────

export async function executeBaseTool(name: string, input: any): Promise<string> {
  switch (name) {
    case 'browse_url':
      return browseUrl(input.url)

    case 'search_web':
      return searchWeb(input.query)

    case 'send_outreach_email':
      return executeOutreachEmail(input)

    case 'check_crm': {
      const contact = await checkContactExists(input.email ?? null, input.organisation)
      return contact
        ? `CRM record found for ${input.organisation}: status=${contact.status}, last contacted=${contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString('en-GB') : 'never'}, follow-ups sent=${contact.followup_count}`
        : `No CRM record for ${input.organisation} — safe to send initial outreach.`
    }

    case 'save_memory':
      await saveMemory(input.category, input.key, input.value, input.importance ?? 5)
      return `Memory saved: [${input.category}] ${input.key}`

    case 'browse_portal': {
      const result = await navigateAndExtract(input.url, input.goal)
      if (result.error) return `Browser navigation failed: ${result.error}`
      return `PAGE CONTENT (${input.url}):\n\n${result.content}`
    }

    case 'queue_portal_form': {
      // Call the browser agent route — it handles AI form analysis + Playwright fill + Supabase save
      const appUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://www.greenstackai.co.uk'
      try {
        const res = await fetch(`${appUrl}/api/verdant/browser`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: input.url,
            purpose: input.purpose,
            custom_instructions: input.custom_instructions ?? '',
          }),
        })
        const data = await res.json()
        if (!res.ok) return `Portal form failed: ${data.error ?? res.status}`

        const needsHuman = data.needs_human?.length
          ? `\n⚠️ Needs human input before submission: ${data.needs_human.join(', ')}`
          : ''
        const filledFields = data.form_data
          ? Object.entries(data.form_data).map(([k, v]) => `  • ${k}: ${v}`).join('\n').slice(0, 600)
          : ''

        return `✅ Portal form queued for review (session: ${data.session_id}).
Purpose: ${data.purpose}
Fields filled:\n${filledFields}${needsHuman}

The screenshot is saved. Check the GreenStack dashboard → Browser Sessions to review and approve before submission.`
      } catch (err) {
        return `Portal form error: ${String(err)}`
      }
    }

    case 'update_goal_strategy':
      await updateGoalProgress(input.goal_id, 0, input.strategy, input.action_taken)
      return `Goal strategy updated for ${input.goal_id}. Action logged: ${input.action_taken ?? 'none'}`

    default:
      return `Unknown tool: ${name}`
  }
}
