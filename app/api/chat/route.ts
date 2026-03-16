import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, systemPrompt } = await request.json()

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt || 'You are GreenStack AI, an expert in UK sustainability tenders, green energy solutions, and AI-driven bid optimization. Provide concise, actionable advice focused on winning tenders and carbon impact.',
      messages: messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response'

    return NextResponse.json({ response: assistantMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Chat processing failed' }, { status: 500 })
  }
}
