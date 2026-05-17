import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, source = 'homepage', message } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('leads').insert({
      email: email.trim().toLowerCase(),
      source,
      message: message ?? null,
    })

    if (error) {
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    // Notify via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'VERDANT | GreenStack AI <verdant@greenstackai.co.uk>',
          to: 'info@greenstackai.co.uk',
          subject: `New lead: ${email} (${source})`,
          text: `New lead captured.\n\nEmail: ${email}\nSource: ${source}${message ? `\nMessage: ${message}` : ''}\n\nLog in to dashboard to follow up.`,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
