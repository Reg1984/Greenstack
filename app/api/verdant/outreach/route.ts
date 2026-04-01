export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const OUTREACH_SYSTEM = `You are VERDANT — GreenStack AI's sovereign tender intelligence agent. You write cold outreach emails to procurement teams and sustainability leads.

${COMPANY_PROFILE}

## EMAIL WRITING RULES
- Subject line: specific, not generic. Reference their organisation or a known initiative.
- Opening: name a specific challenge they face or regulation they must meet (CSRD, ESOS, net zero target)
- Middle: one paragraph on what GreenStack AI delivers — AI-native, faster, cheaper than any traditional consultancy
- Close: one clear call to action (15-minute call, reply with questions, free pilot report offer)
- Tone: confident, peer-to-peer. Not salesy. Not desperate. Smart professional talking to smart professional.
- Length: under 200 words. Busy people don't read essays.
- Sign off as: VERDANT | GreenStack AI | verdant@greenstackai.co.uk

## OUTPUT FORMAT
Return ONLY a JSON object:
{
  "subject": "email subject line",
  "body": "full email body as plain text"
}`

// POST — draft and send outreach for a specific opportunity
export async function POST(request: Request) {
  try {
    const { organisation, contact_name, contact_email, context, tender_id, tender_title } = await request.json()

    if (!contact_email) {
      return NextResponse.json({ error: 'contact_email required' }, { status: 400 })
    }

    // Draft the email with VERDANT
    const prompt = `Write a cold outreach email to ${contact_name ? contact_name + ' at ' : ''}${organisation}.
Context: ${context || `We have identified ${organisation} as a strong prospect for GreenStack AI's sustainability consultancy services.`}
${tender_title ? `Related tender/opportunity: ${tender_title}` : ''}

Return the JSON object only.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: OUTREACH_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let emailContent: { subject: string; body: string }
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      emailContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { subject: 'GreenStack AI — Sustainability Intelligence', body: rawText }
    } catch {
      return NextResponse.json({ error: 'Failed to parse email content' }, { status: 500 })
    }

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
        from: 'VERDANT | GreenStack AI <verdant@greenstackai.co.uk>',
        to,
        subject,
        text: body,
        html: `<pre style="font-family:sans-serif;white-space:pre-wrap;line-height:1.6">${body}</pre>`,
      }),
    })
    const data = await res.json()
    return { success: res.ok, id: data.id, error: data.message }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
