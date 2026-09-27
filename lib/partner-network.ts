/**
 * GreenStack Partner Network — the reason the best consultants want VERDANT.
 *
 * VERDANT finds more work than one person can deliver (tenders, buyer-intent
 * signals, radar-driven client needs). Instead of letting it go, VERDANT
 * proposes a referral to a vetted partner consultant whose specialism and region
 * fit, with the research and a draft approach already done. Reg approves each
 * referral from a signed email link before anything reaches the partner;
 * GreenStack takes a referral fee on work won.
 */

import { createClient } from '@/lib/supabase/server'
import { signToken, siteUrl } from '@/lib/admin-token'

export interface Partner {
  id: string
  name: string
  email: string
  firm: string | null
  specialisms: string[]
  regions: string[]
  credentials: string | null
  day_rate_gbp: number | null
  status: string
}

async function sendEmail(payload: { to: string; subject: string; html: string; bcc?: string; reply_to?: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'VERDANT | GreenStack AI <verdant@greenstackai.co.uk>', ...payload }),
  })
  return res.ok
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export async function recordPartnerApplication(input: {
  name: string; email: string; firm?: string; specialisms: string[]; regions: string[]; credentials?: string; day_rate_gbp?: number; notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('partner_consultants').upsert({
    name: input.name, email: input.email.toLowerCase(), firm: input.firm ?? null,
    specialisms: input.specialisms, regions: input.regions, credentials: input.credentials ?? null,
    day_rate_gbp: input.day_rate_gbp ?? null, notes: input.notes ?? null, status: 'applied',
  // The form is public: a repeat submission must never overwrite (or un-vet) an existing partner.
  }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  await sendEmail({
    to: 'info@greenstackai.co.uk',
    subject: `🤝 Partner application — ${input.name}${input.firm ? ` (${input.firm})` : ''}`,
    reply_to: input.email,
    html: `<div style="font-family:sans-serif;line-height:1.6">
      <p><strong>${escapeHtml(input.name)}</strong> ${input.firm ? `— ${escapeHtml(input.firm)}` : ''} &lt;${escapeHtml(input.email)}&gt;</p>
      <p><strong>Specialisms:</strong> ${escapeHtml(input.specialisms.join(', '))}<br><strong>Regions:</strong> ${escapeHtml(input.regions.join(', '))}<br><strong>Day rate:</strong> ${input.day_rate_gbp ? `£${input.day_rate_gbp}` : 'n/a'}</p>
      <p><strong>Credentials (self-declared — verify before vetting):</strong><br>${escapeHtml(input.credentials ?? 'none given')}</p>
      <p>${escapeHtml(input.notes ?? '')}</p>
      <p>To vet: set status = 'vetted' on partner_consultants in Supabase once credentials are checked.</p></div>`,
  })
}

/** Rank vetted partners by overlap with the opportunity's specialisms and region. */
export async function findPartners(needs: string, region?: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.from('partner_consultants').select('*').eq('status', 'vetted')
  const partners = (data ?? []) as Partner[]
  if (!partners.length) return 'No vetted partners in the network yet. Note the overflow opportunity in memory; the /partners page is recruiting.'
  const words = needs.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2)
  const scored = partners.map(p => {
    const spec = p.specialisms.join(' ').toLowerCase()
    const specScore = words.filter(w => spec.includes(w)).length
    const regionScore = region && p.regions.some(r => r.toLowerCase().includes(region.toLowerCase()) || region.toLowerCase().includes(r.toLowerCase())) ? 2 : 0
    return { p, score: specScore + regionScore }
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)
  if (!scored.length) return `No vetted partner matches "${needs}"${region ? ` in ${region}` : ''}. ${partners.length} vetted partners cover: ${[...new Set(partners.flatMap(p => p.specialisms))].join(', ')}.`
  return scored.map(({ p, score }) =>
    `• ${p.name}${p.firm ? ` (${p.firm})` : ''} — id ${p.id} | match ${score} | specialisms: ${p.specialisms.join(', ')} | regions: ${p.regions.join(', ')} | credentials: ${p.credentials ?? 'n/a'}${p.day_rate_gbp ? ` | £${p.day_rate_gbp}/day` : ''}`).join('\n')
}

/** VERDANT proposes; Reg decides from a signed link. Nothing is sent to the partner yet. */
export async function proposeReferral(input: {
  partner_id: string; opportunity: string; client_org?: string; estimated_value?: number; why_this_partner: string
}): Promise<string> {
  // Check before writing anything: without the secret Reg can't be given approve links.
  try { signToken('referral', 'check') } catch {
    return 'Referrals are disabled until ADMIN_LINK_SECRET (or CRON_SECRET) is set in Vercel — note the opportunity in memory instead.'
  }
  const supabase = await createClient()
  const { data: partner } = await supabase.from('partner_consultants').select('*').eq('id', input.partner_id).eq('status', 'vetted').maybeSingle()
  if (!partner) return `Partner ${input.partner_id} not found or not vetted — referrals only go to vetted partners.`
  const { data: ref, error } = await supabase.from('partner_referrals').insert({
    partner_id: input.partner_id, opportunity: input.opportunity, client_org: input.client_org ?? null,
    estimated_value: input.estimated_value ?? null, why_this_partner: input.why_this_partner,
  }).select('id').single()
  if (error) return `Failed to record referral: ${error.message}`

  const link = (decision: string) => `${siteUrl()}/api/partners/referrals/${ref.id}?decision=${decision}&token=${signToken('referral', ref.id)}`
  const sent = await sendEmail({
    to: 'info@greenstackai.co.uk',
    subject: `🤝 Approve referral? ${partner.name} ← ${input.client_org ?? 'opportunity'}`,
    html: `<div style="font-family:sans-serif;line-height:1.6;max-width:640px">
      <p>VERDANT wants to refer this to <strong>${escapeHtml(partner.name)}</strong>${partner.firm ? ` (${escapeHtml(partner.firm)})` : ''}.</p>
      <p style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px">${escapeHtml(input.opportunity)}</p>
      <p><strong>Why them:</strong> ${escapeHtml(input.why_this_partner)}<br><strong>Estimated value:</strong> ${input.estimated_value ? `£${input.estimated_value.toLocaleString()}` : 'n/a'}</p>
      <p><a href="${link('approve')}" style="background:#059669;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Approve &amp; send to partner</a>
      &nbsp; <a href="${link('reject')}">Reject</a></p></div>`,
  })
  return `Referral ${ref.id} proposed to ${partner.name}. ${sent ? 'Reg has been emailed to approve it' : 'RESEND_API_KEY missing — Reg must approve it manually'}; nothing has been sent to the partner.`
}

export async function decideReferral(id: string, decision: 'approve' | 'reject'): Promise<string> {
  const supabase = await createClient()
  const { data: ref } = await supabase.from('partner_referrals').select('*, partner_consultants(*)').eq('id', id).maybeSingle()
  if (!ref) return 'Referral not found.'
  if (ref.status !== 'proposed') return `Already decided (${ref.status}).`
  const now = new Date().toISOString()
  if (decision === 'reject') {
    await supabase.from('partner_referrals').update({ status: 'rejected', decided_at: now }).eq('id', id)
    return 'Referral rejected. Nothing was sent to the partner.'
  }
  const partner = ref.partner_consultants as Partner
  const ok = await sendEmail({
    to: partner.email,
    bcc: 'info@greenstackai.co.uk',
    reply_to: 'info@greenstackai.co.uk',
    subject: `GreenStack referral: ${ref.client_org ?? 'new sustainability opportunity'}`,
    html: `<div style="font-family:sans-serif;line-height:1.7;max-width:640px;color:#222">
      <p>Hi ${escapeHtml(partner.name.split(' ')[0])},</p>
      <p>VERDANT has found an opportunity that fits your practice better than ours, and I'd like to pass it to you under our partner terms (${ref.referral_fee_pct}% referral fee on work won).</p>
      <p style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px">${escapeHtml(ref.opportunity)}</p>
      <p><strong>Why you:</strong> ${escapeHtml(ref.why_this_partner ?? '')}</p>
      <p>Reply to accept or decline. If you accept, VERDANT will send its full research pack — regulatory analysis, buyer background and a draft approach.</p>
      <p>Kind regards,<br><br>Reginald Orme<br>GreenStack AI<br>greenstackai.co.uk</p></div>`,
  })
  if (!ok) return 'Email to partner failed — referral left as proposed. Check RESEND_API_KEY.'
  await supabase.from('partner_referrals').update({ status: 'approved', decided_at: now }).eq('id', id)
  return `Approved and sent to ${partner.name}.`
}
