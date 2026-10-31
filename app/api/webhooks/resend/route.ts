/**
 * Resend inbound email webhook
 * When a reply lands in verdant@greenstackai.co.uk, Resend POSTs here.
 *
 * To activate:
 * 1. In Resend dashboard → Domains → greenstackai.co.uk → Inbound
 * 2. Add MX record: inbound.resend.com (priority 10) for the domain
 * 3. Set webhook URL to: https://greenstackai.co.uk/api/webhooks/resend
 * 4. Resend will forward all inbound emails as JSON to this endpoint
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { markContactReplied, checkContactExists } from '@/lib/outreach-crm'
import { sendPrivateTelegram } from '@/lib/alerts'
import { EMAIL_STYLE } from '@/lib/email-style'
import { NextResponse } from 'next/server'
import { createAnthropic } from '@/lib/anthropic'

const client = createAnthropic('webhook-resend')

/**
 * This route is public and spends Anthropic credit, so only accept requests
 * signed by Resend (Svix scheme, secret RESEND_WEBHOOK_SECRET "whsec_…" from the
 * Resend webhook settings). No secret configured → closed.
 */
function verifyResendSignature(request: Request, rawBody: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signatures = request.headers.get('svix-signature')
  if (!secret || !id || !timestamp || !signatures) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false // replay guard

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest()
  return signatures.split(' ').some(entry => {
    const [, sig] = entry.split(',')
    if (!sig) return false
    const given = Buffer.from(sig, 'base64')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifyResendSignature(request, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)

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
    const draftPrompt = `A prospect replied to our outreach email. Draft Reg's reply for him to review.

FROM: ${fromName || fromEmail} at ${orgName}
SUBJECT: ${subject}
THEIR MESSAGE:
${textBody.slice(0, 1500)}

Answer what they actually said or asked, and reference something specific from their reply. If they're interested, say clearly what GreenStack could do for them next (e.g. a short written outline of how we'd approach it). If they asked not to be contacted, write a brief, gracious acknowledgement. Never invent facts, prices or past work — put [CHECK WITH REG] where something needs Reg's input. Under 200 words. Output the email body only.`

    const draftResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: EMAIL_STYLE,
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

    // Private alert — a prospect's reply must never go to the public channel
    const telegramMsg =
      `💬 Inbound reply from ${orgName}\n\n` +
      `From: ${fromName || fromEmail}\n` +
      `Subject: ${subject}\n\n` +
      `They said: ${textBody.slice(0, 300)}${textBody.length > 300 ? '...' : ''}\n\n` +
      `Draft response ready — review on dashboard → Reply Drafts`

    await sendPrivateTelegram(telegramMsg)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend inbound webhook error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
