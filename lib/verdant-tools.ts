/**
 * VERDANT Shared Tool Definitions & Executors
 * Used by both the hourly cron cycle (route.ts) and interactive chat (chat/route.ts)
 * so both modes have identical capabilities and VERDANT behaves consistently.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkContactExists, upsertContact, markContactReplied } from '@/lib/outreach-crm'
import { saveMemory, recallMemory } from '@/lib/verdant-memory'
import { createDirective, updateDirective } from '@/lib/verdant-directives'
import { executeMemoryCommand } from '@/lib/verdant-native-memory'
import { thinkStrategically } from '@/lib/verdant-strategy'
import { navigateAndExtract } from '@/lib/browser-agent'
import { updateGoalProgress } from '@/lib/verdant-goals'
import { checkGmailInbox, markAsRead } from '@/lib/gmail'
import { consultKnowledge } from '@/lib/verdant-academy'
import { formatRadarForVerdant } from '@/lib/regulatory-radar'
import { searchFactors, latestFactorSet, createCalculationPack, factorPath } from '@/lib/emissions-engine'
import { findPartners, proposeReferral } from '@/lib/partner-network'
import { signToken, siteUrl } from '@/lib/admin-token'

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
  const signoff = `\n\nKind regards,\n\nReginald Orme\nGreenStack AI\nverdant@greenstackai.co.uk\ngreenstackai.co.uk`
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
  // Native Anthropic memory tool — persistent files under /memories, addressable
  // across every cycle and chat session. Replaces having to re-derive context
  // from the flattened verdant_memory blob every time.
  {
    type: 'memory_20250818',
    name: 'memory',
  },
  {
    name: 'think_strategically',
    description: 'Run an 8-section strategic advisory analysis before making a major bid decision. Covers competitor intelligence (with Bayesian bid probabilities), buyer psychology, game theory pricing (Nash equilibrium, minimax), go/no-go recommendation, and long-term positioning. Use BEFORE writing any bid, qualifying any opportunity worth £5k+, or making a strategic recommendation. Returns a structured report with specific numbers and a single closing recommendation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        opportunity: { type: 'string', description: 'Full description of the tender or opportunity — buyer, value, deadline, requirements, evaluation criteria' },
        question: { type: 'string', description: 'The specific strategic question to reason through' },
      },
      required: ['opportunity', 'question'],
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
          description: 'Full email body, under 200 words. For CBAM leads include https://greenstackai.co.uk/cbam. For general outreach use https://greenstackai.co.uk. Do NOT add a sign-off — Reginald Orme sign-off is added automatically.',
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
    name: 'recall_memory',
    description: 'Search VERDANT\'s persistent memory by keyword. Use this when you need to recall: what we know about a specific buyer, competitor, or sector; past bid decisions; outreach history; or any previously saved intelligence. Returns matching memory entries.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Keyword or phrase to search for in memory — e.g. "NHS", "EY competitor", "CBAM outreach", "monthly analysis"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'recall_market_analysis',
    description: 'Retrieve the most recent monthly market analysis or a specific month\'s analysis. Use when asked about market position, strategic direction, or to compare current situation against last month\'s assessment.',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', description: 'Optional. Month in YYYY-MM format, e.g. "2026-04". Omit for most recent.' },
      },
      required: [],
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
    name: 'manage_directive',
    description: 'Create, update, complete, block, or cancel a standing directive — a freeform command that gets worked every cycle until closed, unlike a one-off action. Use action="create" when Reg gives you an open-ended instruction to pursue persistently (e.g. "land a meeting with X", "get a reply from Y") — this is different from update_goal_strategy, which is for numeric KPI targets, not freeform tasks. Use action="update" every cycle you take any action toward an existing directive, even if nothing changed. Use action="complete" the moment it is genuinely done. Use action="block" ONLY when truly stuck and a human decision is required — give a specific, actionable reason.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'complete', 'block', 'cancel'] },
        instruction: { type: 'string', description: 'Required for action="create" — the standing command to pursue every cycle.' },
        directive_id: { type: 'string', description: 'Required for update/complete/block/cancel — the directive ID from the STANDING DIRECTIVES context block.' },
        note: { type: 'string', description: 'Required for update/complete/block/cancel — what you did this cycle, why it is complete, or the specific reason it is blocked.' },
      },
      required: ['action'],
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
    name: 'check_inbox',
    description: 'Check Gmail inbox for replies to GreenStack AI outreach, tender results, debrief responses, or any sustainability-related emails. Call this at the START of every cycle to catch replies before doing anything else. Returns unread emails with sender, subject, and body. Automatically marks found emails as read.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Gmail search query. Default: "is:unread (greenstack OR greenstackai OR sustainability OR tender OR carbon OR debrief OR verdant)" — override if looking for something specific.',
        },
        max_results: {
          type: 'number',
          description: 'Max emails to return. Default 10.',
        },
      },
      required: [],
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
  {
    name: 'consult_knowledge',
    description: 'Search VERDANT Academy study notes — cited notes VERDANT wrote by studying the primary sources (GHG Protocol, DESNZ factors, SECR, ESOS, IFRS S1/S2 & UK SRS, CSRD/ESRS, EU & UK CBAM, SBTi, TCFD, GRI, green claims, PCAF). Call this BEFORE stating any regulatory threshold, date, definition or method in an email, bid or client memo, and cite the source it returns. If nothing is found, verify with web_fetch from the official source — never state it from memory.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'What you need to know, e.g. "ESOS qualification threshold turnover balance sheet"' },
        module: { type: 'string', description: 'Optional module slug to restrict to, e.g. "esos", "eu-cbam", "ghg-protocol-scope-3"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_regulatory_radar',
    description: 'Get material regulatory changes the Radar detected from official sources (GOV.UK, EU, FCA, EFRAG, SBTi) — each with a plain-English summary, who is affected, deadline, actions, source URL, and which of our clients it hits. Use for timely outreach hooks and to warn clients first.',
    input_schema: {
      type: 'object' as const,
      properties: { days: { type: 'number', description: 'Look-back window in days. Default 7.' } },
      required: [],
    },
  },
  {
    name: 'search_emission_factors',
    description: 'Search the official DESNZ GHG conversion factors loaded into the database. Returns exact factor rows (id, path, unit, value). You MUST use this to pick factor_ids before create_calculation_pack — never type a factor value yourself.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'e.g. "natural gas gross", "electricity UK", "diesel average biofuel blend", "business travel air long-haul"' },
        factor_set: { type: 'string', description: 'Optional, e.g. "DESNZ 2025". Defaults to all loaded sets.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_calculation_pack',
    description: 'Create an auditor-traceable GHG calculation pack for a client. The engine (not you) does the arithmetic from the cited DESNZ factor rows, checks units, and lists anything unresolved rather than estimating. Returns totals plus a signed review link. It is a DRAFT until a qualified human signs it off.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client: { type: 'string' },
        reporting_period: { type: 'string', description: 'e.g. "1 Jan 2025 – 31 Dec 2025"' },
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor_id: { type: 'string', description: 'Exact id from search_emission_factors' },
              quantity: { type: 'number' },
              unit: { type: 'string', description: 'Unit of the activity data — must match the factor unit' },
              description: { type: 'string' },
              evidence: { type: 'string', description: 'Where the activity data came from' },
            },
            required: ['factor_id', 'quantity', 'unit', 'description'],
          },
        },
      },
      required: ['client', 'reporting_period', 'activities'],
    },
  },
  {
    name: 'find_partners',
    description: 'Find vetted partner consultants in the GreenStack Partner Network whose specialisms and region fit an opportunity. Use when an opportunity is real but we cannot deliver it alone — it needs an accredited signatory (ESOS Lead Assessor, ISO 14064 verifier), on-site work, a framework we are not on, or capacity we lack.',
    input_schema: {
      type: 'object' as const,
      properties: {
        needs: { type: 'string', description: 'Specialisms needed, e.g. "ESOS lead assessor manufacturing"' },
        region: { type: 'string', description: 'Optional region/country' },
      },
      required: ['needs'],
    },
  },
  {
    name: 'propose_partner_referral',
    description: 'Propose referring an opportunity to a vetted partner (id from find_partners). Reg is emailed an approve/reject link — nothing reaches the partner until Reg approves. Include enough detail in opportunity for the partner to act.',
    input_schema: {
      type: 'object' as const,
      properties: {
        partner_id: { type: 'string' },
        opportunity: { type: 'string', description: 'Buyer, need, value, deadline, source link, and what research VERDANT already has' },
        client_org: { type: 'string' },
        estimated_value: { type: 'number', description: 'GBP' },
        why_this_partner: { type: 'string' },
      },
      required: ['partner_id', 'opportunity', 'why_this_partner'],
    },
  },
]

// ─── Tool Executor ────────────────────────────────────────────────────────────

/**
 * Strip unpaired UTF-16 surrogates from tool output before it reaches the
 * Anthropic API. Scraped page text (browse_portal) and email bodies
 * (check_inbox) sometimes get truncated or mis-decoded mid-character,
 * leaving a lone surrogate half. JSON.stringify happily encodes those as
 * \uD8xx/\uDCxx escapes, but the resulting request body isn't valid UTF-8 —
 * Anthropic's API then rejects the whole request with a JSON parse error
 * ("no low surrogate in string"), killing the entire VERDANT cycle over one
 * bad tool result.
 */
function stripLoneSurrogates(text: string): string {
  return text.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    ''
  )
}

export async function executeBaseTool(name: string, input: any): Promise<string> {
  const result = await executeBaseToolInner(name, input)
  return stripLoneSurrogates(result)
}

async function executeBaseToolInner(name: string, input: any): Promise<string> {
  switch (name) {
    case 'memory':
      return executeMemoryCommand(input)

    case 'manage_directive': {
      if (input.action === 'create') {
        if (!input.instruction) return 'Error: instruction is required to create a directive'
        return createDirective(input.instruction)
      }
      if (!input.directive_id) return 'Error: directive_id is required for this action'
      if (!input.note && input.action !== 'update') return 'Error: note is required for complete/block/cancel'
      return updateDirective(input.directive_id, input.action, input.note ?? 'No update note provided')
    }

    case 'think_strategically':
      return thinkStrategically(input.opportunity, input.question)

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

    case 'recall_memory':
      return recallMemory(input.query)

    case 'recall_market_analysis': {
      const supabase = await createClient()
      let query = supabase
        .from('market_analyses')
        .select('period, analysis, key_findings, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      if (input.period) query = query.eq('period', input.period) as any
      const { data, error } = await query.single()
      if (error || !data) return 'No market analysis found. Run the monthly market analysis first.'
      return `## MARKET ANALYSIS — ${data.period}\n${data.analysis}`
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
        : 'https://greenstackai.co.uk'
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

    case 'check_inbox': {
      if (!process.env.GMAIL_CLIENT_ID) return 'Gmail not configured — add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN to Vercel env vars.'
      const query = input.query ?? 'is:unread (greenstack OR greenstackai OR sustainability OR tender OR carbon OR debrief OR verdant)'
      const messages = await checkGmailInbox(query, input.max_results ?? 10)
      if (!messages.length) return `No unread emails matching: ${query}`
      await Promise.all(messages.map(m => markAsRead(m.id)))
      const summary = messages.map(m =>
        `---\nFrom: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\n\n${m.body || m.snippet}`
      ).join('\n\n')
      return `Found ${messages.length} email(s) — marked as read:\n\n${summary}`
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

    case 'consult_knowledge':
      return consultKnowledge(input.query, input.module)

    case 'check_regulatory_radar':
      return (await formatRadarForVerdant(input.days ?? 7)) || 'No material regulatory changes detected in that window.'

    case 'search_emission_factors': {
      const rows = await searchFactors(input.query, input.factor_set)
      if (!rows.length) {
        const latest = await latestFactorSet()
        return latest
          ? `No factor rows matched "${input.query}" (loaded sets include ${latest}). Try broader terms, e.g. just the fuel name.`
          : 'No DESNZ factors are loaded yet. Reg must run scripts/import-desnz-factors.mjs with the official flat file. Do NOT calculate emissions until then.'
      }
      return rows.map(f => `${f.id} | ${f.scope ?? ''} | ${factorPath(f)} | ${f.factor} ${f.ghg_unit} per ${f.unit}`).join('\n')
    }

    case 'create_calculation_pack': {
      let pack: Awaited<ReturnType<typeof createCalculationPack>>
      try {
        pack = await createCalculationPack(input)
      } catch (err) {
        return `Calculation pack failed: ${String(err)}. Check the 013_super_consultant.sql migration has been run.`
      }
      let link = ''
      try { link = `\nReview/download: ${siteUrl()}/api/verdant/calc/${pack.id}?token=${signToken('calc', pack.id)}` } catch { /* no link secret configured */ }
      const unresolved = pack.unresolved.map(u => `  • ${u.description ?? 'pack'}: ${u.reason}`).join('\n')
      return `Calculation pack ${pack.id} created (DRAFT — needs qualified sign-off).
Total: ${pack.totals.tonnes_co2e_total} tCO2e | by scope: ${JSON.stringify(pack.totals.tonnes_co2e_by_scope)}
Lines calculated: ${pack.lines.length} | Unresolved: ${pack.unresolved.length}${unresolved ? `\n${unresolved}` : ''}${link}`
    }

    case 'find_partners':
      return findPartners(input.needs, input.region)

    case 'propose_partner_referral':
      return proposeReferral(input)

    default:
      return `Unknown tool: ${name}`
  }
}
