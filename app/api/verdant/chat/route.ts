export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { loadVerdantMemory, loadTopMemories } from '@/lib/verdant-memory'
import { getCRMSummary } from '@/lib/outreach-crm'
import { VERDANT_BASE_TOOLS, executeBaseTool } from '@/lib/verdant-tools'
import { extractTenderFields, isGemmaAvailable } from '@/lib/gemma'
import { thinkStrategically } from '@/lib/verdant-strategy'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
        type: { type: 'string', enum: ['linkedin_post', 'blog_article', 'capability_statement', 'case_study'] },
        title: { type: 'string' },
        body: { type: 'string', description: 'Full content body' },
        target_audience: { type: 'string' },
      },
      required: ['type', 'title', 'body'],
    },
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
]

const VERDANT_TOOLS: Anthropic.Tool[] = [...VERDANT_BASE_TOOLS, ...CHAT_EXTRA_TOOLS]

export async function POST(request: Request) {
  const encoder = new TextEncoder()
  let streamController!: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream<Uint8Array>({
    start(c) { streamController = c },
  })

  const send = (data: object) => {
    try {
      streamController.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
    } catch { /* controller closed */ }
  }

  // Run the full agentic loop in background — stream keeps connection alive
  ;(async () => {
    try {
      const { messages: rawMessages } = await request.json()
      const messages: Anthropic.MessageParam[] = (rawMessages ?? []).slice(-20)

      send({ status: 'loading', action: 'Loading intelligence...' })

      const supabase = await createClient()

      // Run all DB queries in parallel — select only fields needed for context
      const [
        persistentMemory,
        { data: tenders },
        { data: bids },
        crmSummary,
      ] = await Promise.all([
        loadTopMemories(),
        supabase.from('tenders').select('id,title,value,status,sector,buyer,deadline,ai_score').order('created_at', { ascending: false }).limit(10),
        supabase.from('bids').select('id,title,value,status,buyer').order('created_at', { ascending: false }).limit(5),
        getCRMSummary(),
      ])

      const pipelineValue = tenders?.reduce((sum, t) => sum + (t.value || 0), 0) ?? 0

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
${persistentMemory}

## LIVE PIPELINE
- Active tenders: ${tenders?.length ?? 0} | Pipeline value: £${(pipelineValue / 1000000).toFixed(2)}M | Active bids: ${bids?.length ?? 0}
- ${crmSummary}
${tenders?.length ? `- Recent tenders: ${tenders.slice(0,5).map(t => `${t.title} (£${((t.value||0)/1000).toFixed(0)}k, ${t.status})`).join(' | ')}` : ''}

## CRM TOOLS AVAILABLE
Use check_crm before sending ANY outreach email. Use recall_memory to search past intelligence. Use draft_content to create LinkedIn posts or capability statements.

## STRATEGIC ADVISOR
Use think_strategically BEFORE writing any bid or qualifying any opportunity worth £5k+. It runs an 8-section analysis: position assessment, opponent modeling, buyer intelligence, game theory pricing, chess strategic options, decision tree outcomes, bid positioning, and long-term market positioning.

## WHAT YOU CAN DO IN CHAT
- Qualify any specific tender the human brings to you — browse the full spec, then think_strategically before recommending
- Write a full bid on demand — always think_strategically first
- Research any organisation in real time before outreach
- Find live GIZ, World Bank and UN tender opportunities
- Recommend which opportunities to prioritise
- Recall memory with recall_memory and recall_market_analysis tools
- Draft outreach emails to potential clients with real intelligence behind them
- Discuss strategy and make decisions together

You are VERDANT. Think before you act. Be brilliant.`

      send({ status: 'thinking', action: 'VERDANT is thinking...' })

      const apiMessages: Anthropic.MessageParam[] = messages
      let finalReply = ''
      const toolsUsed: { tool: string; input: any; result: string }[] = []
      let containerId: string | null = null

      for (let iteration = 0; iteration < 6; iteration++) {
        const response: Anthropic.Message = await (client.messages.create as any)({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          tools: VERDANT_TOOLS,
          messages: apiMessages,
          ...(containerId ? { container: containerId } : {}),
        })

        if ((response as any).container?.id) containerId = (response as any).container.id

        if (response.stop_reason === 'end_turn') {
          finalReply = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('\n')
          break
        }

        if (response.stop_reason === 'pause_turn') {
          apiMessages.push({ role: 'assistant', content: response.content })
          send({ status: 'searching', action: 'Browsing the web...' })
          continue
        }

        if (response.stop_reason === 'tool_use') {
          apiMessages.push({ role: 'assistant', content: response.content })
          const toolResults: Anthropic.ToolResultBlockParam[] = []

          for (const block of response.content) {
            if (block.type !== 'tool_use') continue

            const input = block.input as any
            const toolLabel = block.name === 'web_search' ? `Searching: ${input.query ?? ''}` :
              block.name === 'web_fetch' ? `Reading: ${input.url ?? ''}` :
              block.name === 'think_strategically' ? 'Running strategic advisor...' :
              block.name === 'send_outreach_email' ? `Sending email to ${input.organisation ?? ''}` :
              block.name === 'recall_memory' ? `Recalling memory: ${input.query ?? ''}` :
              block.name === 'recall_market_analysis' ? 'Loading market analysis...' :
              block.name

            send({ status: 'tool', action: toolLabel })

            let result = ''
            if (block.name === 'think_strategically') {
              result = await thinkStrategically(input.opportunity, input.question)
              toolsUsed.push({ tool: 'strategic_advisor', input: input.question, result: result.slice(0, 200) })
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
              result = await executeBaseTool(block.name, input)
              toolsUsed.push({ tool: block.name, input: JSON.stringify(input).slice(0, 80), result: result.slice(0, 200) })
            }

            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
          }

          apiMessages.push({ role: 'user', content: toolResults })
          continue
        }

        // Any other stop reason
        finalReply = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map(b => b.text)
          .join('\n')
        break
      }

      send({ reply: finalReply, toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined })
    } catch (error) {
      console.error('VERDANT chat error:', error)
      send({ error: String(error) })
    } finally {
      streamController.close()
    }
  })()

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
