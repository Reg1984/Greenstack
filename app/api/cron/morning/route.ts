/**
 * VERDANT Morning Autonomous Session
 * Runs every day at 6am UTC via Vercel Cron
 * Sends follow-ups, finds new prospects, publishes content, emails Reginald a briefing
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sendOutreachEmail, queryCRM } from '@/lib/outreach-crm'
import { publishFile, readRepoFile, listRepoDir } from '@/lib/github-publisher'
import { lookupCompaniesHouse } from '@/lib/companies-house'
import { saveMemory, recallMemory, loadTopMemories } from '@/lib/verdant-memory'

const client = new Anthropic()

const MORNING_TOOLS: any[] = [
  // Native server tools — executed by API automatically
  { type: 'web_search_20260209', name: 'web_search', max_uses: 8, user_location: { type: 'approximate', city: 'London', region: 'England', country: 'GB', timezone: 'Europe/London' } },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 10, max_content_tokens: 6000 },
  {
    name: 'send_email',
    description: 'Send an outreach email and log to CRM.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
        organisation: { type: 'string' },
        contact_name: { type: 'string' },
        sector: { type: 'string' },
        country: { type: 'string' },
      },
      required: ['to', 'subject', 'body', 'organisation'],
    },
  },
  {
    name: 'publish_to_website',
    description: 'Publish a blog post or page to the GreenStack website.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['path', 'content', 'message'],
    },
  },
  {
    name: 'read_website_file',
    description: 'Read a file in the GreenStack repo.',
    input_schema: {
      type: 'object' as const,
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'list_website_files',
    description: 'List files in a directory of the GreenStack repo.',
    input_schema: {
      type: 'object' as const,
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'lookup_company',
    description: 'Look up a UK company on Companies House.',
    input_schema: {
      type: 'object' as const,
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'query_crm',
    description: 'Query the CRM for contacts, follow-ups due, or pipeline status.',
    input_schema: {
      type: 'object' as const,
      properties: { filter: { type: 'string' } },
      required: [],
    },
  },
  {
    name: 'save_memory',
    description: 'Save an important fact or decision to persistent memory.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string' },
        key: { type: 'string' },
        value: { type: 'string' },
        importance: { type: 'number' },
      },
      required: ['category', 'key', 'value'],
    },
  },
]

async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case 'send_email': {
        const result = await sendOutreachEmail(input as any)
        return result.success
          ? `✅ Email sent to ${input.to}`
          : `❌ Email failed: ${result.error}`
      }
      case 'publish_to_website': {
        const result = await publishFile({ path: input.path, content: input.content, message: input.message })
        return result.success ? `✅ Published ${input.path}` : `❌ Publish failed: ${result.error}`
      }
      case 'read_website_file': {
        const content = await readRepoFile(input.path)
        return content ? `\`\`\`\n${content}\n\`\`\`` : `File not found: ${input.path}`
      }
      case 'list_website_files': {
        const files = await listRepoDir(input.path)
        return files.length ? files.join('\n') : `No files in ${input.path}`
      }
      case 'lookup_company': {
        return await lookupCompaniesHouse(input.name)
      }
      case 'query_crm': {
        return await queryCRM(input.filter ?? 'all')
      }
      case 'save_memory': {
        const ok = await saveMemory(input.category, input.key, input.value, input.importance ?? 5)
        return ok ? `✅ Remembered: [${input.category}] ${input.key}` : `❌ Memory save failed`
      }
      default:
        return `Unknown tool: ${name}`
    }
  } catch (err) {
    return `Tool error: ${String(err)}`
  }
}

async function sendMorningBriefing(report: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VERDANT <verdant@greenstackai.co.uk>',
      to: 'info@greenstackai.co.uk',
      subject: `VERDANT Morning Briefing — ${today}`,
      html: `<div style="font-family:sans-serif;max-width:700px;line-height:1.7">
        <h2 style="color:#16a34a">VERDANT Morning Briefing</h2>
        <p style="color:#6b7280">${today}</p>
        <hr style="border-color:#e5e7eb"/>
        <div style="white-space:pre-wrap">${report.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
        <hr style="border-color:#e5e7eb"/>
        <p style="color:#9ca3af;font-size:12px">VERDANT Autonomous Agent — GreenStack AI</p>
      </div>`,
    }),
  })
}

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron (skip check if CRON_SECRET not set)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  try {
    const persistentMemory = await loadTopMemories().catch(() => '')

    const systemPrompt = `You are VERDANT — the world's most advanced green energy and sustainability AI agent, running your autonomous morning session for GreenStack AI.

Today is ${today}. This is your daily autonomous run. Work through each task systematically and report what you did.

GreenStack AI is a UK sustainability consultancy offering:
- CSRD Compliance Reports — £8,000 (competitors charge £16,000)
- Net Zero Roadmaps — £11,250 (competitors charge £22,500)
- CBAM Compliance Assessments — £5,750
- ESG Due Diligence — £18,750
- ESOS Energy Audits — £3,750
- Bid Writing — £2,750

MORNING TASKS — complete all of these:

**TASK 1: News-driven outreach**
Search for 2-3 recent news stories about: UK companies announcing net zero targets, CBAM/CSRD compliance challenges, ESG reporting requirements, energy transition investments. For the most promising story, find the company involved, look them up on Companies House, check the CRM (don't email if already contacted), then send a highly personalised outreach email referencing the specific news story.

**TASK 2: Publish one blog post**
Pick a timely, SEO-valuable topic in green energy/sustainability. Write a high-quality 800-1000 word blog post. Publish it to the website at app/insights/[slug]/page.tsx. Make it genuinely useful — not generic. Include specific data, regulations, and practical advice.

**TASK 3: Save learnings**
Save 2-3 key facts or decisions from today's session to memory for future reference.

**TASK 4: Morning report**
At the end, produce a concise briefing summarising: follow-ups sent, new outreach sent, blog post published, and anything notable you found.${persistentMemory}`

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Good morning VERDANT. Run your autonomous morning session for ${today}. Complete all 4 tasks and produce your morning briefing report.`,
      },
    ]

    let currentMessages = messages
    let finalReport = ''

    for (let iteration = 0; iteration < 10; iteration++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        tools: MORNING_TOOLS,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: currentMessages,
      })

      if (response.stop_reason !== 'tool_use') {
        const text = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
        finalReport = text?.text ?? 'Morning session completed.'
        break
      }

      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => ({
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: await executeTool(toolUse.name, toolUse.input as Record<string, any>),
        }))
      )

      currentMessages = [
        ...currentMessages,
        { role: 'assistant' as const, content: response.content },
        { role: 'user' as const, content: toolResults },
      ]
    }

    await sendMorningBriefing(finalReport)

    return NextResponse.json({ success: true, report: finalReport })
  } catch (error) {
    console.error('Morning cron error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
