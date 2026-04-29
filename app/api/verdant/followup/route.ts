/**
 * VERDANT Follow-up Engine
 * Cron: runs daily at 8am UTC
 * Finds contacts due a follow-up email and sends personalised sequences
 *
 * Sequence:
 *   Email 1 (day 0): Initial outreach
 *   Email 2 (day 4): Short follow-up — new angle or useful resource
 *   Email 3 (day 11): Final note — leaves door open
 */

export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { getFollowupsDue, upsertContact } from '@/lib/outreach-crm'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FOLLOWUP_SYSTEM = `You are VERDANT — GreenStack AI's outreach agent. You write short, professional follow-up emails.

${COMPANY_PROFILE}

## FOLLOW-UP EMAIL RULES
- This is a follow-up to a previous cold email — acknowledge it briefly and naturally
- Add NEW value — a relevant regulatory deadline, new statistic, or insight not in the first email
- Email 2 (followup_count=0 → sending 1st follow-up): "I wanted to follow up briefly..." + one new angle
- Email 3 (followup_count=1 → sending 2nd follow-up): "I won't keep chasing..." + leave door open, offer free pilot
- Maximum 120 words — shorter than the first email
- No hard sell — peer-to-peer professional tone
- Include https://www.greenstackai.co.uk/cbam for CBAM contacts, https://www.greenstackai.co.uk for others
- Sign off: VERDANT | GreenStack AI | verdant@greenstackai.co.uk`

async function sendFollowupEmail(contact: any): Promise<boolean> {
  try {
    const followupNumber = contact.followup_count + 1
    const isFinal = followupNumber >= 2

    const prompt = `Write follow-up email #${followupNumber} to ${contact.contact_name ?? 'the team'} at ${contact.organisation}.
Context: ${contact.signal ?? 'sustainability consultancy'}
Country: ${contact.country ?? 'UK'}
This is ${isFinal ? 'the FINAL follow-up — polite, brief, leave door open' : 'the first follow-up — add a new angle or regulatory deadline'}.
Return the JSON object only.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: FOLLOWUP_SYSTEM,
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
    if (!rawText) return false

    const emailContent: { subject: string; body: string } = JSON.parse(rawText)

    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return false

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VERDANT | GreenStack AI <verdant@greenstackai.co.uk>',
        to: contact.contact_email,
        subject: `Re: ${emailContent.subject}`,
        text: emailContent.body,
        html: `<div style="font-family:sans-serif;max-width:600px;line-height:1.7;color:#222">${emailContent.body.replace(/\n/g, '<br/>')}</div>`,
      }),
    })

    if (!res.ok) return false

    const sendData = await res.json()

    // Log to outreach_emails
    const supabase = await createClient()
    await supabase.from('outreach_emails').insert({
      to_email: contact.contact_email,
      to_name: contact.contact_name,
      organisation: contact.organisation,
      subject: `Re: ${emailContent.subject}`,
      body: emailContent.body,
      status: 'sent',
      resend_id: sendData.id ?? null,
      sent_at: new Date().toISOString(),
    })

    // Update CRM contact
    const nextFollowupDue = isFinal
      ? null
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('outreach_contacts')
      .update({
        followup_count: contact.followup_count + 1,
        status: isFinal ? 'followed_up' : 'followed_up',
        last_contacted_at: new Date().toISOString(),
        followup_due_at: nextFollowupDue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id)

    return true
  } catch (err) {
    console.error('Follow-up error:', err)
    return false
  }
}

async function runFollowupCycle() {
  const contacts = await getFollowupsDue()

  if (contacts.length === 0) {
    return NextResponse.json({ success: true, message: 'No follow-ups due', sent: 0 })
  }

  let sent = 0
  const results: Array<{ org: string; success: boolean }> = []

  for (const contact of contacts) {
    const success = await sendFollowupEmail(contact)
    if (success) sent++
    results.push({ org: contact.organisation, success })

    // Small delay between sends
    await new Promise(r => setTimeout(r, 1000))
  }

  // Log to activity log
  const supabase = await createClient()
  await supabase.from('activity_log').insert({
    type: 'verdant_followup',
    description: `VERDANT follow-up cycle — ${sent}/${contacts.length} sent`,
    metadata: { results, cycle_date: new Date().toISOString() },
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, sent, total: contacts.length, results })
}

// GET = Vercel cron trigger (requires CRON_SECRET)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runFollowupCycle()
}

// POST = Manual trigger from dashboard
export async function POST() {
  return runFollowupCycle()
}
