import { NextResponse } from 'next/server'
import { z } from 'zod'
import { recordPartnerApplication } from '@/lib/partner-network'

const list = z.union([z.array(z.string()), z.string()])
  .transform(v => (Array.isArray(v) ? v : v.split(',')).map(s => s.trim()).filter(Boolean).slice(0, 20))

const Application = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  firm: z.string().trim().max(160).optional(),
  specialisms: list.refine(v => v.length > 0, 'Add at least one specialism'),
  regions: list,
  credentials: z.string().trim().max(2000).optional(),
  // The form posts "" for a blank field — treat it as not given, not as 0.
  day_rate_gbp: z.preprocess(v => (v === '' || v == null ? undefined : v), z.coerce.number().int().positive().max(20000).optional()),
  notes: z.string().trim().max(2000).optional(),
  website: z.string().optional(), // honeypot — real people leave it empty
})

export async function POST(request: Request) {
  const parsed = Application.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid application' }, { status: 400 })
  }
  if (parsed.data.website) return NextResponse.json({ success: true })

  try {
    const { website: _honeypot, ...application } = parsed.data
    await recordPartnerApplication(application)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Partner application error:', error)
    return NextResponse.json({ error: 'Could not save your application — please email info@greenstackai.co.uk' }, { status: 500 })
  }
}
