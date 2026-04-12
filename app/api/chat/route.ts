import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { sendOutreachEmail } from '@/lib/outreach-crm'

const client = new Anthropic()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SEND_EMAIL_TOOL: Anthropic.Tool = {
  name: 'send_email',
  description: 'Send an outreach email to an external contact and log it to the CRM. Use this when the user asks you to send an email to a specific person or organisation.',
  input_schema: {
    type: 'object' as const,
    properties: {
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject line' },
      body: { type: 'string', description: 'Plain text email body' },
      organisation: { type: 'string', description: 'Organisation name for CRM logging' },
      contact_name: { type: 'string', description: 'Contact name if known' },
      sector: { type: 'string', description: 'Sector e.g. Climate, Development, Steel' },
      country: { type: 'string', description: 'Country of the recipient organisation' },
    },
    required: ['to', 'subject', 'body', 'organisation'],
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, systemPrompt } = await request.json()

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      tools: [SEND_EMAIL_TOOL],
      system: systemPrompt || 'You are VERDANT, the autonomous procurement and outreach agent for GreenStack AI. You can send emails directly using the send_email tool. When the user asks you to send an email, use the tool — do not just draft it.',
      messages: messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    // Handle tool use
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock
      if (toolUse && toolUse.name === 'send_email') {
        const input = toolUse.input as {
          to: string
          subject: string
          body: string
          organisation: string
          contact_name?: string
          sector?: string
          country?: string
        }

        const result = await sendOutreachEmail(input)

        // Feed tool result back to Claude for a natural response
        const followUp = await client.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 512,
          tools: [SEND_EMAIL_TOOL],
          system: systemPrompt || 'You are VERDANT, the autonomous procurement and outreach agent for GreenStack AI.',
          messages: [
            ...messages.map((msg: ChatMessage) => ({ role: msg.role, content: msg.content })),
            { role: 'assistant', content: response.content },
            {
              role: 'user',
              content: [{
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result.success
                  ? `Email sent successfully to ${input.to}. CRM updated.`
                  : `Email failed: ${result.error}`,
              }],
            },
          ],
        })

        const text = followUp.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
        return NextResponse.json({ response: text?.text ?? (result.success ? `Email sent to ${input.to}.` : `Failed: ${result.error}`) })
      }
    }

    const text = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
    const assistantMessage = text?.text ?? 'Unable to generate response'

    return NextResponse.json({ response: assistantMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Chat processing failed' }, { status: 500 })
  }
}
