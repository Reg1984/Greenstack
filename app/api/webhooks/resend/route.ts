/**
 * Resend inbound email webhook
 * When a reply lands in verdant@greenstackai.co.uk, Resend POSTs here.
 *
 * To activate:
 * 1. In Resend dashboard → Domains → greenstackai.co.uk → Inbound
 * 2. Add MX record: inbound.resend.com (priority 10) for the domain
 * 3. Set webhook URL to: https://www.greenstackai.co.uk/api/webhooks/resend
 * 4. Resend will forward all inbound emails as JSON to this endpoint
 */

import { createClient } from '@/lib/supabase/server'
import { markContactReplied, checkContactExists } from '@/lib/outreach-crm'
import { sendTelegramMessage } from '@/lib/verdant-tools'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    // Resend inbound email schema
    const fromEmail: string = payload.from?.email ?? payload.from ?? ''
    const fromName: string = payload.from?.name ?? ''
    const subject: string = payload.subject ?? ''
    const textBody: string = payload.text ?? payload.html_to_text ?? ''

    if (!fromEmail) {
      return NextResponse.json({ error: 'No sender email' }, { status: 400 })
    }

    // Look up the sender in CRM
    const contact = await checkContactExists(fromEmail, fromName)

    // Mark as replied if we know them
    if (contact?.id) {
      await markContactReplied(contact.id)
    }

    // Use Claude to draft a response
    const orgName = contact?.organisation ?? fromName ?? fromEmail.split('@')[1]
    const draftPrompt = `A prospect replied to our cold outreach email. Draft a warm, concise response that moves toward booking a 20-minute discovery call.

FROM: ${fromName || fromEmail} at ${orgName}
SUBJECT: ${subject}
THEIR MESSAGE:
${textBody.slice(0, 1500)}

Write a response under 250 words. Be warm and human — not salesy. Reference something specific from their reply. End with a clear call to action: suggest a 20-minute call and offer two time slots (leave as [TIME SLOT 1] and [TIME SLOT 2]). No sign-off needed.`

    const draftResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: draftPrompt }],
    })

    const draftBody = draftResponse.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('\n')

    const draftSubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`

    // Save the draft
    const supabase = await createClient()
    await supabase.from('reply_drafts').insert({
      organisation: orgName,
      contact_email: fromEmail,
      contact_name: fromName || contact?.contact_name || null,
      their_reply: textBody.slice(0, 2000),
      draft_subject: draftSubject,
      draft_body: draftBody,
      status: 'pending',
      created_at: new Date().toISOString(),
    })

    // Telegram alert
    const telegramMsg =
      `💬 *Inbound reply from ${orgName}*\n\n` +
      `*From:* ${fromName || fromEmail}\n` +
      `*Subject:* ${subject}\n\n` +
      `*They said:* ${textBody.slice(0, 300)}${textBody.length > 300 ? '...' : ''}\n\n` +
      `*Draft response ready — review on dashboard → Reply Drafts*`

    await sendTelegramMessage(telegramMsg)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend inbound webhook error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
