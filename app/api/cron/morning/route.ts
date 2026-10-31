/**
 * VERDANT Morning Autonomous Session
 * Runs every day at 6am UTC via Vercel Cron
 * Sends follow-ups, finds new prospects, publishes content, emails Reginald a briefing
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAnthropic } from '@/lib/anthropic'
import { sendOutreachEmail, queryCRM } from '@/lib/outreach-crm'
import { publishFile, readRepoFile, listRepoDir } from '@/lib/github-publisher'
import { lookupCompaniesHouse } from '@/lib/companies-house'
import { saveMemory, recallMemory, loadTopMemories } from '@/lib/verdant-memory'
import { EMAIL_STYLE } from '@/lib/email-style'
import { alertJobFailed } from '@/lib/alerts'

const MORNING_DIVISIONS = [
  { name: 'Climate', news: 'UK organisations announcing net zero targets, CBAM/CSRD compliance challenges, ESG reporting requirements, council climate plans' },
  { name: 'Education', news: 'multi-academy trusts, local authority education services and education charities announcing curriculum reviews, SEND reforms, attendance or school-improvement programmes, DfE and FCDO education funding' },
  { name: 'Impact', news: 'funders, charities, councils and government departments launching programmes that will need evaluation, new What Works / evidence initiatives, social value commitments, FCDO and international development programmes' },
]

const client = createAnthropic('cron-morning')

const MORNING_TOOLS: any[] = [
  // Native server tools — executed by API automatically
  { type: 'web_search_20260209', name: 'web_search', max_uses: 8, user_location: { type: 'approximate', city: 'London', region: 'England', country: 'GB', timezone: 'Europe/London' } },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5, max_content_tokens: 4000 },
  {
    name: 'send_email',
    description: 'Send an outreach email and log to CRM. Follow HOW TO WRITE EMAILS: human, specific, under 150 words, no sign-off (added automatically with our contact email), and never ask for a call or meeting — emails that do are rejected unsent.',
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

    const division = MORNING_DIVISIONS[new Date().getUTCDate() % MORNING_DIVISIONS.length]

    const systemPrompt = `You are VERDANT, GreenStack AI's research and business development agent, running your autonomous morning session.

Today is ${today}. This is your daily autonomous run. Work through each task systematically and report what you did.

GreenStack AI has three divisions: GreenStack Climate (carbon, net zero, energy, CBAM, sustainability reporting), GreenStack Education (curriculum, school improvement, SEND and inclusion, education policy and research, AI in education) and GreenStack Impact (evaluation, MEL, theory of change, evidence reviews, social value, policy research). The founder is an education specialist and consultant. Never quote prices in cold emails.

**TODAY'S FOCUS DIVISION: ${division.name}** (the morning session rotates divisions day by day).

${EMAIL_STYLE}

MORNING TASKS — complete all of these:

**TASK 1: News-driven outreach**
Search for 2-3 recent news stories relevant to today's focus: ${division.news}. For the most promising story, find the organisation and the right named person, check the CRM (don't email if already contacted), then send one personalised email referencing the specific story.

**TASK 2: Publish one blog post**
Pick a timely, genuinely useful topic for today's focus division (${division.name}). Write a high-quality 800-1000 word blog post. Only state facts you have sourced; never invent statistics, case studies or client work. Publish it to the website at app/insights/[slug]/page.tsx. Make it genuinely useful — not generic. Include specific data, regulations, and practical advice.

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
    let containerId: string | null = null

    for (let iteration = 0; iteration < 8; iteration++) {
      const response: Anthropic.Message = await (client.messages.create as any)({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        tools: MORNING_TOOLS,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: currentMessages,
        ...(containerId ? { container: containerId } : {}),
      })

      // Track container_id for server-side tool continuity (web_search/web_fetch)
      if ((response as any).container?.id) containerId = (response as any).container.id

      // pause_turn: server tool mid-execution — continue with container
      if (response.stop_reason === 'pause_turn') {
        currentMessages = [...currentMessages, { role: 'assistant' as const, content: response.content }]
        continue
      }

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
    await alertJobFailed('morning session', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
