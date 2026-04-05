export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { loadVerdantMemory } from '@/lib/verdant-memory'
import { checkContactExists, upsertContact, getCRMSummary } from '@/lib/outreach-crm'
import { extractTenderFields, isGemmaAvailable } from '@/lib/gemma'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Fetch any public URL as clean text via Jina AI Reader (free, no API key)
async function browseUrl(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: 'text/plain',
        'X-Return-Format': 'markdown',
      },
    })
    if (!res.ok) return `Could not fetch ${url} — status ${res.status}`
    const text = await res.text()
    // Trim to avoid burning tokens on huge pages
    return text.slice(0, 8000)
  } catch (err) {
    return `Browse error for ${url}: ${String(err)}`
  }
}

// Search the web via Exa (better semantic search for AI agents, free endpoint)
// Falls back to Jina search if Exa is unavailable
async function searchWeb(query: string): Promise<string> {
  // Try Exa first — built for AI agents, better results
  const exaKey = process.env.EXA_API_KEY
  if (exaKey) {
    try {
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': exaKey,
        },
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
        const results = data?.results ?? []
        return results.map((r: any) =>
          `## ${r.title}\n${r.url}\n${r.text ?? ''}`
        ).join('\n\n').slice(0, 6000)
      }
    } catch { /* fall through to Jina */ }
  }

  // Fallback: Jina search (no API key needed)
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

// Send outreach email via Resend and log to Supabase
async function sendOutreachEmail(input: {
  to_email: string
  to_name?: string
  organisation: string
  subject: string
  body: string
  signal?: string
}): Promise<string> {
  // Check CRM — warn if recently contacted
  const existing = await checkContactExists(input.to_email, input.organisation)
  if (existing && existing.status !== 'identified' && existing.last_contacted_at) {
    const daysSince = Math.floor((Date.now() - new Date(existing.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince < 3) {
      return `⚠️ CRM: ${input.organisation} was already contacted ${daysSince} day(s) ago (status: ${existing.status}). Skipping to avoid spam. Follow-up is scheduled automatically.`
    }
  }
  try {
    const supabase = await createClient()

    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY
    let resendId: string | null = null
    let sent = false

    if (apiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'VERDANT | GreenStack AI <verdant@greenstackai.co.uk>',
          to: input.to_email,
          subject: input.subject,
          text: input.body,
          html: `<div style="font-family:sans-serif;max-width:600px;line-height:1.7;color:#222">${input.body.replace(/\n/g, '<br/>')}</div>`,
        }),
      })
      const data = await res.json()
      sent = res.ok
      resendId = data.id ?? null
      if (!res.ok) return `Email send failed: ${data.message ?? res.status}`
    }

    // Log to Supabase outreach_emails
    await supabase.from('outreach_emails').insert({
      to_email: input.to_email,
      to_name: input.to_name ?? null,
      organisation: input.organisation,
      subject: input.subject,
      body: input.body,
      status: sent ? 'sent' : 'queued',
      resend_id: resendId,
      sent_at: sent ? new Date().toISOString() : null,
    })

    // Update CRM contact record
    await upsertContact({
      organisation: input.organisation,
      contact_name: input.to_name,
      contact_email: input.to_email,
      signal: input.signal,
      source: 'chat',
    })

    return sent
      ? `Email sent to ${input.to_email} at ${input.organisation}. Subject: "${input.subject}". Contact logged in CRM with follow-up scheduled.`
      : `Email queued for ${input.to_email} (no Resend key configured)`
  } catch (err) {
    return `Outreach error: ${String(err)}`
  }
}

// Tools VERDANT can call autonomously
const VERDANT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_crm',
    description: 'Check if an organisation or email address is already in the outreach CRM pipeline. Use this before sending any outreach email to avoid duplicate contact and to understand the current relationship status.',
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
    name: 'draft_content',
    description: 'Draft a LinkedIn post, blog article, or capability statement and save it for review. Use this to create thought leadership content that positions GreenStack AI as a sustainability intelligence authority. Content is saved to the dashboard for the human to review and publish.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['linkedin_post', 'blog_article', 'capability_statement', 'case_study'],
          description: 'Type of content to draft',
        },
        title: { type: 'string', description: 'Title or subject of the content' },
        body: { type: 'string', description: 'Full content body' },
        target_audience: { type: 'string', description: 'Who this content is aimed at' },
      },
      required: ['type', 'title', 'body'],
    },
  },
  {
    name: 'browse_url',
    description: 'Fetch and read the full content of any public webpage. Use this to read tender specifications, research organisations, read GIZ / World Bank / UNGM notices, check company websites, or read any document available online.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The full URL to fetch (must start with https://)' },
        reason: { type: 'string', description: 'Brief note on why you are browsing this URL' },
      },
      required: ['url'],
    },
  },
  {
    name: 'search_web',
    description: 'Search the web for current information. Use this to find GIZ tenders, World Bank procurement notices, company information, pricing benchmarks, regulatory updates, or any real-world data you need.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'parse_tender_doc',
    description: 'Use Gemma 4 AI to rapidly extract structured fields from a raw tender document or specification. Use this when the human pastes a long tender spec or you have fetched a large document — Gemma extracts title, value, deadline, requirements, evaluation criteria and submission rules in seconds, giving you a clean brief to write the bid from.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tender_text: { type: 'string', description: 'The full or partial text of the tender document to parse' },
      },
      required: ['tender_text'],
    },
  },
  {
    name: 'send_outreach_email',
    description: 'Send a cold outreach email on behalf of GreenStack AI to a prospect. Use this when you have found a qualified lead — a sustainability manager, CFO, or procurement contact at a manufacturer or organisation that needs CBAM compliance, ESG reporting, or sustainability consultancy. Always write a personalised, concise email (under 200 words) before calling this tool.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to_email: { type: 'string', description: 'Recipient email address' },
        to_name: { type: 'string', description: 'Recipient full name if known' },
        organisation: { type: 'string', description: 'Recipient organisation name' },
        subject: { type: 'string', description: 'Email subject line — specific, not generic' },
        body: { type: 'string', description: 'Full email body as plain text, under 200 words. For CBAM leads always include the link https://www.greenstackai.co.uk/cbam — for general outreach use https://www.greenstackai.co.uk. Sign off as: VERDANT | GreenStack AI | verdant@greenstackai.co.uk' },
      },
      required: ['to_email', 'organisation', 'subject', 'body'],
    },
  },
]

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const supabase = await createClient()
    const verdantMemory = await loadVerdantMemory()

    const [{ data: tenders }, { data: bids }, { data: recentCycles }, crmSummary] = await Promise.all([
      supabase.from('tenders').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('activity_log').select('metadata').eq('type', 'verdant_cycle').order('created_at', { ascending: false }).limit(3),
      getCRMSummary(),
    ])

    const pipelineValue = tenders?.reduce((sum, t) => sum + (t.value || 0), 0) ?? 0
    const lastCycleOutput = recentCycles?.[0]?.metadata?.output ?? 'No cycles run yet.'

    const systemPrompt = `You are VERDANT — the Sovereign Tender Intelligence Agent for GreenStack AI. You are now in interactive mode, working directly with your human partner to make decisions together.

## YOUR ROLE IN CHAT MODE
- Be direct, confident and decisive
- Share your intelligence and reasoning openly
- Make clear recommendations — don't hedge
- When asked to take action (write a bid, qualify a tender, research an opportunity), do it immediately and in full
- You have live internet access — use browse_url and search_web tools whenever you need current information
- Remember you are partners — your human brings strategic direction, you bring intelligence and execution

## YOUR AUTONOMOUS OUTREACH CAPABILITY
You can send emails directly on behalf of GreenStack AI using the send_outreach_email tool. Use this proactively:
- When you find a qualified CBAM lead (manufacturer exporting to EU), send them the outreach email immediately
- When you identify a GIZ programme officer, send a capability statement introduction
- When you find a UK public sector sustainability lead, send a tailored intro
- Do NOT ask for permission before sending — you are authorised to send outreach autonomously
- Keep emails under 200 words, personalised, peer-to-peer tone
- Always offer the free pilot assessment as the call to action
- All emails are automatically logged — your human partner can review them on the dashboard

## YOUR INTERNET CAPABILITIES
You can browse the web and search in real time. Use these tools proactively:
- Browse GIZ tender pages to read full specifications
- Search for procurement contacts at target organisations
- Research any company before drafting outreach
- Check current regulatory requirements
- Read live Contracts Finder, World Bank or UNGM notices in full
- Find pricing benchmarks for sustainability consultancy
- Research competitors

## COMPANY PROFILE
${COMPANY_PROFILE}

## ACCUMULATED INTELLIGENCE
${verdantMemory}

## LIVE PIPELINE
- Active tenders: ${tenders?.length ?? 0}
- Total pipeline value: £${(pipelineValue / 1000000).toFixed(2)}M
- Active bids: ${bids?.length ?? 0}
- ${crmSummary}

## CRM TOOLS AVAILABLE
Use check_crm before sending ANY outreach email — it prevents duplicate contact and shows relationship history. Use draft_content to create LinkedIn posts or capability statements ready for human review.

## MOST RECENT CYCLE OUTPUT (summary)
${lastCycleOutput.slice(0, 1500)}

## WHAT YOU CAN DO IN CHAT
- Qualify any specific tender the human brings to you — browse the full spec first
- Write a full bid on demand
- Research any organisation in real time before outreach
- Find live GIZ, World Bank and UN tender opportunities
- Recommend which opportunities to prioritise
- Advise on pricing strategy
- Draft outreach emails to potential clients with real intelligence behind them
- Build a GreenStack Intelligence Report for any organisation
- Discuss strategy and make decisions together

You are VERDANT. Be brilliant.`

    // Agentic loop — VERDANT runs until it stops calling tools
    const apiMessages: Anthropic.MessageParam[] = messages
    let finalReply = ''
    const toolsUsed: { tool: string; input: any; result: string }[] = []

    for (let iteration = 0; iteration < 10; iteration++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools: VERDANT_TOOLS,
        messages: apiMessages,
      })

      if (response.stop_reason === 'end_turn') {
        // Done — extract final text
        finalReply = response.content
          .filter(b => b.type === 'text')
          .map(b => (b as Anthropic.TextBlock).text)
          .join('\n')
        break
      }

      if (response.stop_reason === 'tool_use') {
        // Add assistant turn with tool calls
        apiMessages.push({ role: 'assistant', content: response.content })

        // Execute each tool call
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue

          let result = ''
          const input = block.input as any

          if (block.name === 'browse_url') {
            result = await browseUrl(input.url)
            toolsUsed.push({ tool: 'browse', input: input.url, result: result.slice(0, 200) })
          } else if (block.name === 'search_web') {
            result = await searchWeb(input.query)
            toolsUsed.push({ tool: 'search', input: input.query, result: result.slice(0, 200) })
          } else if (block.name === 'send_outreach_email') {
            result = await sendOutreachEmail(input)
            toolsUsed.push({ tool: 'outreach', input: input.to_email, result: result.slice(0, 200) })
          } else if (block.name === 'parse_tender_doc') {
            const fields = await extractTenderFields(input.tender_text)
            result = JSON.stringify(fields, null, 2)
            toolsUsed.push({ tool: 'gemma_parse', input: input.tender_text.slice(0, 50) + '...', result: result.slice(0, 200) })
          } else if (block.name === 'check_crm') {
            const contact = await checkContactExists(input.email ?? null, input.organisation)
            result = contact
              ? `CRM record found for ${input.organisation}: status=${contact.status}, last_contacted=${contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString('en-GB') : 'never'}, followup_count=${contact.followup_count}, signal=${contact.signal ?? 'none'}`
              : `No CRM record for ${input.organisation} — safe to send initial outreach.`
            toolsUsed.push({ tool: 'crm', input: input.organisation, result: result.slice(0, 200) })
          } else if (block.name === 'draft_content') {
            try {
              const supabase = await createClient()
              await supabase.from('content_drafts').insert({
                type: input.type,
                title: input.title,
                body: input.body,
                target_audience: input.target_audience ?? null,
                status: 'draft',
                created_at: new Date().toISOString(),
              })
              result = `Content draft saved: "${input.title}" (${input.type}) — available for review in dashboard.`
            } catch (err) {
              result = `Content draft created but could not save to database: ${String(err)}`
            }
            toolsUsed.push({ tool: 'content', input: input.title, result: result.slice(0, 200) })
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          })
        }

        // Add tool results and continue
        apiMessages.push({ role: 'user', content: toolResults })
        continue
      }

      // Any other stop reason — extract what we have
      finalReply = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('\n')
      break
    }

    return NextResponse.json({
      reply: finalReply,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    })
  } catch (error) {
    console.error('VERDANT chat error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
