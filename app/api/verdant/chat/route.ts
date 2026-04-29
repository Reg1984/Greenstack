export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { loadVerdantMemory, loadTopMemories } from '@/lib/verdant-memory'
import { getCRMSummary } from '@/lib/outreach-crm'
import { VERDANT_BASE_TOOLS, executeBaseTool } from '@/lib/verdant-tools'
import { extractTenderFields, isGemmaAvailable } from '@/lib/gemma'
import { thinkStrategically } from '@/lib/verdant-strategy'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// browseUrl, searchWeb, sendOutreachEmail — imported from @/lib/verdant-tools

// Chat-specific tools (in addition to VERDANT_BASE_TOOLS)
const CHAT_EXTRA_TOOLS: Anthropic.Tool[] = [
  {
    name: 'parse_tender_doc',
    description: 'Use Gemma 4 AI to rapidly extract structured fields from a raw tender document. Use when the human pastes a long tender spec — extracts title, value, deadline, requirements, evaluation criteria and submission rules.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tender_text: { type: 'string', description: 'The full or partial text of the tender document to parse' },
      },
      required: ['tender_text'],
    },
  },
  {
    name: 'draft_content',
    description: 'Draft a LinkedIn post, blog article, or capability statement and save it for human review on the dashboard.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['linkedin_post', 'blog_article', 'capability_statement', 'case_study'],
        },
        title: { type: 'string' },
        body: { type: 'string', description: 'Full content body' },
        target_audience: { type: 'string' },
      },
      required: ['type', 'title', 'body'],
    },
  },
  {
    name: 'think_strategically',
    description: 'Invoke Opus 4 extended thinking for deep strategic reasoning before making a major decision. Use this BEFORE writing any bid, qualifying a high-value opportunity, or making a strategic recommendation. This runs genuine chain-of-thought reasoning — not pattern matching. Use it whenever the stakes are high enough to warrant real thought.',
    input_schema: {
      type: 'object' as const,
      properties: {
        opportunity: {
          type: 'string',
          description: 'Full description of the tender or opportunity — buyer, value, deadline, requirements, evaluation criteria',
        },
        question: {
          type: 'string',
          description: 'The specific strategic question to reason through — e.g. "Should we bid, and if so what is our winning angle?"',
        },
      },
      required: ['opportunity', 'question'],
    },
  },
]

const VERDANT_TOOLS: Anthropic.Tool[] = [...VERDANT_BASE_TOOLS, ...CHAT_EXTRA_TOOLS]

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const supabase = await createClient()
    const [verdantMemory, persistentMemory] = await Promise.all([
      loadVerdantMemory(),
      loadTopMemories(),
    ])

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
- You have live internet access via web_search and web_fetch tools — use them proactively whenever you need current information
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
${persistentMemory}

## LIVE PIPELINE
- Active tenders: ${tenders?.length ?? 0}
- Total pipeline value: £${(pipelineValue / 1000000).toFixed(2)}M
- Active bids: ${bids?.length ?? 0}
- ${crmSummary}

## CRM TOOLS AVAILABLE
Use check_crm before sending ANY outreach email — it prevents duplicate contact and shows relationship history. Use draft_content to create LinkedIn posts or capability statements ready for human review.

## MOST RECENT CYCLE OUTPUT (summary)
${lastCycleOutput.slice(0, 1500)}

## STRATEGIC REASONING — OPUS 4 EXTENDED THINKING
You have access to a powerful strategic reasoning engine via the **think_strategically** tool. This runs claude-opus-4-5 with extended chain-of-thought reasoning — genuine strategic thought, not pattern matching.

**Use it BEFORE:**
- Writing any bid or proposal
- Qualifying a tender worth £10k+
- Making a major recommendation on market strategy
- Deciding whether to pursue a specific buyer or opportunity

**Do not use it for:** routine research, sending outreach emails, or answering factual questions.

The tool reasons through winnability, buyer psychology, competitive positioning, and risk — then returns a full strategic recommendation with a confidence score. Use that reasoning to write dramatically better bids.

## WHAT YOU CAN DO IN CHAT
- Qualify any specific tender the human brings to you — browse the full spec, then think_strategically before recommending
- Write a full bid on demand — always think_strategically first
- Research any organisation in real time before outreach
- Find live GIZ, World Bank and UN tender opportunities
- Recommend which opportunities to prioritise
- Advise on pricing strategy
- Draft outreach emails to potential clients with real intelligence behind them
- Build a GreenStack Intelligence Report for any organisation
- Discuss strategy and make decisions together

You are VERDANT. Think before you act. Be brilliant.`

    // Agentic loop — VERDANT runs until it stops calling tools
    const apiMessages: Anthropic.MessageParam[] = messages
    let finalReply = ''
    const toolsUsed: { tool: string; input: any; result: string }[] = []

    for (let iteration = 0; iteration < 10; iteration++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
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

          if (block.name === 'think_strategically') {
            result = await thinkStrategically(input.opportunity, input.question)
            toolsUsed.push({ tool: 'opus4_thinking', input: input.question, result: result.slice(0, 200) })
          } else if (block.name === 'parse_tender_doc') {
            const fields = await extractTenderFields(input.tender_text)
            result = JSON.stringify(fields, null, 2)
            toolsUsed.push({ tool: 'gemma_parse', input: input.tender_text.slice(0, 50) + '...', result: result.slice(0, 200) })
          } else if (block.name === 'draft_content') {
            try {
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
          } else {
            // All base tools handled by shared executor
            result = await executeBaseTool(block.name, input)
            toolsUsed.push({ tool: block.name, input: JSON.stringify(input).slice(0, 80), result: result.slice(0, 200) })
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
