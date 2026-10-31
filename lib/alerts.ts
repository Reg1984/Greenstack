/**
 * Private alerts to Reg — never the public GreenStack Telegram channel.
 *
 * Telegram: TELEGRAM_ALERT_CHAT_ID (Reg's own chat with the bot), using the
 * existing TELEGRAM_BOT_TOKEN. Email: ALERT_EMAIL, falling back to info@.
 * Neither path needs Anthropic credit, so a credit failure still gets through.
 */

import { createClient } from '@/lib/supabase/server'

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000
const lastAlertAt = new Map<string, number>()

/** Plain-text message to Reg's private Telegram chat. Returns false if not configured or it failed. */
export async function sendPrivateTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID
  if (!token || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true }),
    })
    return (await res.json()).ok === true
  } catch {
    return false
  }
}

async function sendAlertEmail(subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'GreenStack alerts <verdant@greenstackai.co.uk>',
        to: process.env.ALERT_EMAIL || 'info@greenstackai.co.uk',
        subject,
        text,
      }),
    })
  } catch {
    // Telegram is the other channel — nothing more to do
  }
}

/**
 * Tell Reg something needs him. Alerts with the same key are sent at most once
 * every 6 hours (per instance in memory, and across instances via activity_log),
 * so 15 failed follow-ups produce one message, not 15.
 */
export async function alertReg(key: string, subject: string, detail: string): Promise<void> {
  const now = Date.now()
  if (now - (lastAlertAt.get(key) ?? 0) < ALERT_COOLDOWN_MS) return
  lastAlertAt.set(key, now)

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('activity_log')
      .select('created_at')
      .eq('type', 'verdant_alert')
      .eq('description', key)
      .gte('created_at', new Date(now - ALERT_COOLDOWN_MS).toISOString())
      .limit(1)
    if (data?.length) return
    await supabase.from('activity_log').insert({
      type: 'verdant_alert',
      description: key,
      metadata: { subject, detail },
      created_at: new Date(now).toISOString(),
    })
  } catch {
    // Can't reach the log — better a duplicate alert than none
  }

  const text = `⚠️ ${subject}\n\n${detail}`
  await Promise.all([sendPrivateTelegram(text), sendAlertEmail(`⚠️ ${subject}`, text)])
}

/** Recognise Anthropic account problems (no credit, bad key) that stop every job until Reg fixes them. */
export function anthropicAccountProblem(err: unknown): { key: string; subject: string; detail: string } | null {
  const msg = String((err as any)?.message ?? err)
  if (/credit balance is too low/i.test(msg)) {
    return {
      key: 'anthropic-credit',
      subject: 'VERDANT has stopped: Anthropic credit has run out',
      detail: 'Every VERDANT job (cycle, follow-ups, morning session, outreach) is failing until credit is added.\n\nTop up at console.anthropic.com → Plans & Billing, and turn on auto-reload so it can\'t stop again.',
    }
  }
  if ((err as any)?.status === 401 || /invalid x-api-key|authentication_error/i.test(msg)) {
    return {
      key: 'anthropic-auth',
      subject: 'VERDANT has stopped: Anthropic API key rejected',
      detail: 'The ANTHROPIC_API_KEY in Vercel was rejected. Check it in console.anthropic.com → API keys and update it in Vercel → Settings → Environment Variables.',
    }
  }
  return null
}

/** For a cron's top-level catch: alert on a failed run, unless it was an account problem (already alerted by the client). */
export async function alertJobFailed(job: string, err: unknown): Promise<void> {
  if (anthropicAccountProblem(err)) return
  await alertReg(`job-failed:${job}`, `VERDANT ${job} failed`, String((err as any)?.message ?? err).slice(0, 800))
}
