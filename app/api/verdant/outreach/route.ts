export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createAnthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { EMAIL_STYLE, OUTREACH_FROM, CONTACT_EMAIL, checkEmailBody, withSignoff } from '@/lib/email-style'
import { emailsLeftToday, DAILY_CAP_REACHED } from '@/lib/outreach-crm'
import { NextResponse } from 'next/server'

const client = createAnthropic('verdant-outreach')

const OUTREACH_SYSTEM = `You write cold outreach emails for GreenStack AI on behalf of Reginald Orme, to procurement teams and leads in climate, education and impact/evaluation.

${COMPANY_PROFILE}

${EMAIL_STYLE}
- You may mention one relevant page: https://greenstackai.co.uk/cbam, /climate, /education or /impact.`

// POST — draft and send outreach for a specific opportunity
export async function POST(request: Request) {
  try {
    const { organisation, contact_name, contact_email, context, tender_id, tender_title } = await request.json()

    if (!contact_email) {
      return NextResponse.json({ error: 'contact_email required' }, { status: 400 })
    }
    if ((await emailsLeftToday()) <= 0) {
      return NextResponse.json({ error: DAILY_CAP_REACHED }, { status: 429 })
    }

    // Draft the email with VERDANT
    const prompt = `Write a cold outreach email to ${contact_name ? contact_name + ' at ' : ''}${organisation}.
Context: ${context || `We have identified ${organisation} as a strong prospect for GreenStack AI's services.`}
${tender_title ? `Related tender/opportunity: ${tender_title}` : ''}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: OUTREACH_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['subject', 'body'],
            additionalProperties: false,
          },
        },
      },
    } as any)

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    if (!rawText) return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    const emailContent: { subject: string; body: string } = JSON.parse(rawText)
    const problem = checkEmailBody(emailContent.body)
    if (problem) return NextResponse.json({ error: `Draft rejected, not sent: ${problem}`, content: emailContent }, { status: 422 })
    emailContent.body = withSignoff(emailContent.body)

    // Send via Resend
    const sendResult = await sendEmail({
      to: contact_email,
      subject: emailContent.subject,
      body: emailContent.body,
    })

    // Save to Supabase
    const supabase = await createClient()
    const { data: saved } = await supabase.from('outreach_emails').insert({
      to_email: contact_email,
      to_name: contact_name,
      organisation,
      subject: emailContent.subject,
      body: emailContent.body,
      status: sendResult.success ? 'sent' : 'queued',
      tender_id: tender_id || null,
      tender_title: tender_title || null,
      resend_id: sendResult.id || null,
      sent_at: sendResult.success ? new Date().toISOString() : null,
    }).select().single()

    return NextResponse.json({ success: sendResult.success, email: saved, content: emailContent })
  } catch (error) {
    console.error('Outreach error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PUT — send a pre-written reply draft (no AI generation, just send)
export async function PUT(request: Request) {
  try {
    const { to_email, to_name, organisation, subject, body } = await request.json()
    if (!to_email || !subject || !body) {
      return NextResponse.json({ error: 'to_email, subject, body required' }, { status: 400 })
    }
    // Reply drafts were approved by Reg, so no call-ask check or daily cap here — just the standard
    // sign-off, without the opt-out line (they wrote to us)
    const sendResult = await sendEmail({ to: to_email, subject, body: withSignoff(body, { optOut: false }) })
    if (!sendResult.success) {
      return NextResponse.json({ error: sendResult.error ?? 'Send failed' }, { status: 500 })
    }
    const supabase = await createClient()
    await supabase.from('outreach_emails').insert({
      to_email,
      to_name: to_name ?? null,
      organisation,
      subject,
      body,
      status: 'sent',
      resend_id: sendResult.id ?? null,
      sent_at: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET — list outreach emails
export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('outreach_emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ emails: data ?? [] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: 'No RESEND_API_KEY' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: OUTREACH_FROM,
        reply_to: CONTACT_EMAIL,
        to,
        bcc: CONTACT_EMAIL,
        subject,
        text: body,
        html: `<div style="font-family:sans-serif;max-width:600px;line-height:1.7;color:#222">${body.replace(/\n/g, '<br/>')}</div>`,
      }),
    })
    const data = await res.json()
    return { success: res.ok, id: data.id, error: data.message }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
