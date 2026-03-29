import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { loadVerdantMemory } from '@/lib/verdant-memory'
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

// Search the web via Jina AI search (free)
async function searchWeb(query: string): Promise<string> {
  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: {
        Accept: 'text/plain',
        'X-Return-Format': 'markdown',
      },
    })
    if (!res.ok) return `Search failed for "${query}" — status ${res.status}`
    const text = await res.text()
    return text.slice(0, 6000)
  } catch (err) {
    return `Search error: ${String(err)}`
  }
}

// Tools VERDANT can call autonomously
const VERDANT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'browse_url',
    description: 'Fetch and read the full content of any public webpage. Use this to read tender specifications, research organisations, read GIZ / World Bank / UNGM notices, check company websites, or read any document available online.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to fetch (must start with https://)',
        },
        reason: {
          type: 'string',
          description: 'Brief note on why you are browsing this URL',
        },
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
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
]

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const supabase = await createClient()
    const verdantMemory = await loadVerdantMemory()

    const [{ data: tenders }, { data: bids }, { data: recentCycles }] = await Promise.all([
      supabase.from('tenders').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('activity_log').select('metadata').eq('type', 'verdant_cycle').order('created_at', { ascending: false }).limit(3),
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
