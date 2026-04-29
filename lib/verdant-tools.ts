/**
 * VERDANT Shared Tool Definitions & Executors
 * Used by both the hourly cron cycle (route.ts) and interactive chat (chat/route.ts)
 * so both modes have identical capabilities and VERDANT behaves consistently.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkContactExists, upsertContact, markContactReplied } from '@/lib/outreach-crm'
import { saveMemory } from '@/lib/verdant-memory'
import { navigateAndExtract } from '@/lib/browser-agent'
import { updateGoalProgress } from '@/lib/verdant-goals'

// ─── Telegram ────────────────────────────────────────────────────────────────

export async function sendTelegramMessage(text: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHANNEL_ID
  if (!token || !chatId) return 'Telegram not configured — add TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID env vars'
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })
    const data = await res.json()
    if (!data.ok) return `Telegram error: ${data.description}`
    return `✅ Telegram message posted to channel.`
  } catch (err) {
    return `Telegram error: ${String(err)}`
  }
}

// ─── Tool Executors ───────────────────────────────────────────────────────────
// Note: web_search and web_fetch are Anthropic server-side tools — the API
// executes them automatically. No executor needed here.

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

  // Ensure every email is signed off as Reginald Orme
  const signoff = `\n\nKind regards,\n\nReginald Orme\nGreenStack AI\nverdant@greenstackai.co.uk\nwww.greenstackai.co.uk`
  const bodyWithSignoff = input.body.includes('Reginald') ? input.body : input.body.trimEnd() + signoff

  const html = `<div style="font-family:sans-serif;max-width:600px;line-height:1.7;color:#222">${bodyWithSignoff.replace(/\n/g, '<br/>')}</div>`

  let resendId: string | null = null
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VERDANT | GreenStack AI <verdant@greenstackai.co.uk>',
      to: input.to_email,
      bcc: 'info@greenstackai.co.uk',
      subject: input.subject,
      text: bodyWithSignoff,
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

export const VERDANT_BASE_TOOLS: any[] = [
  // Native Anthropic server tools — executed by the API, not our code
  {
    type: 'web_search_20260209',
    name: 'web_search',
    max_uses: 6,
    user_location: { type: 'approximate', city: 'London', region: 'England', country: 'GB', timezone: 'Europe/London' },
  },
  {
    type: 'web_fetch_20260209',
    name: 'web_fetch',
    max_uses: 10,
    max_content_tokens: 8000,
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
          description: 'Full email body, under 200 words. For CBAM leads include https://www.greenstackai.co.uk/cbam. For general outreach use https://www.greenstackai.co.uk. Do NOT add a sign-off — Reginald Orme sign-off is added automatically.',
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
    name: 'send_telegram',
    description: 'Post a message to the GreenStack AI Telegram channel. Use to share breaking tender alerts, outreach wins, bid submissions, or market intelligence with the green energy community. Keep under 300 words, use plain language, no jargon.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'The message to post. Markdown supported (*bold*, _italic_, `code`). Max 4000 chars.',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'log_reply',
    description: 'Log that a contact has replied to our outreach. Immediately marks them as replied in CRM (cancels follow-up sequence), saves a draft response for human approval, and sends a Telegram alert. Use this as soon as you are told a contact replied — then draft the response as part of the same tool call.',
    input_schema: {
      type: 'object' as const,
      properties: {
        organisation: { type: 'string', description: 'Organisation name' },
        contact_email: { type: 'string', description: 'Their email address' },
        contact_name: { type: 'string', description: 'Their name if known' },
        their_reply: { type: 'string', description: 'What they said — paste the key content of their reply' },
        draft_subject: { type: 'string', description: 'Subject line for your draft response' },
        draft_body: { type: 'string', description: 'Full draft response body. Under 300 words. No sign-off — Reginald Orme sign-off added automatically. Be warm, move toward a discovery call.' },
      },
      required: ['organisation', 'contact_email', 'their_reply', 'draft_subject', 'draft_body'],
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
    case 'send_outreach_email':
      return executeOutreachEmail(input)

    case 'check_crm': {
      const contact = await checkContactExists(input.email ?? null, input.organisation)
      return contact
        ? `CRM record found for ${input.organisation}: status=${contact.status}, last contacted=${contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString('en-GB') : 'never'}, follow-ups sent=${contact.followup_count}`
        : `No CRM record for ${input.organisation} — safe to send initial outreach.`
    }

    case 'send_telegram':
      return sendTelegramMessage(input.message)

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

    case 'log_reply': {
      const supabase = await createClient()

      // Mark contact as replied in CRM (cancels follow-up sequence)
      const contact = await checkContactExists(input.contact_email, input.organisation)
      if (contact?.id) await markContactReplied(contact.id)

      // Save draft response
      await supabase.from('reply_drafts').insert({
        organisation: input.organisation,
        contact_email: input.contact_email,
        contact_name: input.contact_name ?? contact?.contact_name ?? null,
        their_reply: input.their_reply,
        draft_subject: input.draft_subject,
        draft_body: input.draft_body,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

      // Telegram alert with the draft
      const telegramMsg = `💬 *Reply received from ${input.organisation}*\n\n` +
        `*From:* ${input.contact_name ?? input.contact_email}\n` +
        `*They said:* ${input.their_reply.slice(0, 300)}\n\n` +
        `*Draft response ready:*\n*Subject:* ${input.draft_subject}\n\n${input.draft_body.slice(0, 600)}\n\n` +
        `_Review on dashboard → Reply Drafts to approve and send_`
      await sendTelegramMessage(telegramMsg)

      return `✅ Reply logged for ${input.organisation}. Follow-up sequence cancelled. Draft response saved and Telegram alert sent. Review on dashboard to approve and send.`
    }

    default:
      return `Unknown tool: ${name}`
  }
}
