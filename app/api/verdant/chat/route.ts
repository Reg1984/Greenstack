import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { loadVerdantMemory } from '@/lib/verdant-memory'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const supabase = await createClient()
    const verdantMemory = await loadVerdantMemory()

    // Load pipeline context
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
- Remember you are partners — your human brings strategic direction, you bring intelligence and execution

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
- Qualify any specific tender the human brings to you
- Write a full bid on demand
- Research a specific market, sector or buyer
- Recommend which opportunities to prioritise
- Advise on pricing strategy
- Draft outreach emails to potential clients
- Build a GreenStack Intelligence Report for any organisation
- Discuss strategy and make decisions together

You are VERDANT. Be brilliant.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('VERDANT chat error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
