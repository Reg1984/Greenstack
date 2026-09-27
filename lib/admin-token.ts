/**
 * Signed one-purpose tokens for links Reg clicks from email (approve a referral,
 * download a calculation pack). HMAC over "<purpose>:<id>" with a server secret,
 * so a link can't be forged or reused for a different record.
 */

import { createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  const s = process.env.ADMIN_LINK_SECRET ?? process.env.CRON_SECRET
  if (!s) throw new Error('Set ADMIN_LINK_SECRET (or CRON_SECRET) to enable signed admin links')
  return s
}

export function signToken(purpose: string, id: string): string {
  return createHmac('sha256', secret()).update(`${purpose}:${id}`).digest('base64url')
}

export function verifyToken(purpose: string, id: string, token: string | null): boolean {
  if (!token) return false
  try {
    const expected = Buffer.from(signToken(purpose, id))
    const given = Buffer.from(token)
    return expected.length === given.length && timingSafeEqual(expected, given)
  } catch {
    return false
  }
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://greenstackai.co.uk'
}
