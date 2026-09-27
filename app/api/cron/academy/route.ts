/**
 * VERDANT Academy — daily study session (Vercel Cron, 03:00 UTC).
 * Studies one curriculum module from primary sources, sits a closed-book
 * self-test, and records the score. GET ?module=<slug> to study a specific one.
 */

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { studyNextModule } from '@/lib/verdant-academy'
import { saveMemory } from '@/lib/verdant-memory'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const slug = request.nextUrl.searchParams.get('module') ?? undefined
    const result = await studyNextModule(slug)
    if (!result) return NextResponse.json({ success: true, message: 'Curriculum complete and fresh — nothing to study today.' })
    if (!result.error) {
      await saveMemory(
        'intelligence',
        `Academy: ${result.title}`,
        `Studied ${new Date().toISOString().slice(0, 10)}. Self-test ${result.score ?? 'n/a'}% → ${result.status}. ${result.weakAreas ? `Weak areas: ${result.weakAreas}` : ''} Notes at /memories/knowledge/${result.slug}.md`,
        6,
      )
    }
    return NextResponse.json({ success: !result.error, ...result })
  } catch (error) {
    console.error('Academy cron error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
