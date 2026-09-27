/**
 * VERDANT Regulatory Radar — daily sweep of official sources (Vercel Cron, 05:30 UTC,
 * so fresh changes are in context for the 07:00 cycle).
 */

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { runRegulatoryRadar } from '@/lib/regulatory-radar'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runRegulatoryRadar()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Radar cron error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
