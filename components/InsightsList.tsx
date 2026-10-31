'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Insight, InsightDivision } from '@/lib/insights'

const DIVISIONS: { id: InsightDivision; name: string }[] = [
  { id: 'climate', name: 'Climate' },
  { id: 'education', name: 'Education' },
  { id: 'impact', name: 'Impact' },
]

const DIVISION_STYLE: Record<InsightDivision, { color: string; background: string }> = {
  climate: { color: 'rgba(134,239,172,0.9)', background: 'rgba(134,239,172,0.12)' },
  education: { color: 'rgba(147,197,253,0.9)', background: 'rgba(147,197,253,0.12)' },
  impact: { color: 'rgba(216,180,254,0.9)', background: 'rgba(216,180,254,0.12)' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Badge({ division }: { division: InsightDivision }) {
  return (
    <span style={{
      fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px',
      ...DIVISION_STYLE[division],
    }}>
      {DIVISIONS.find(d => d.id === division)?.name}
    </span>
  )
}

/** Insights with Climate / Education / Impact filters. #education etc. in the URL preselects one. */
export function InsightsList({ insights }: { insights: Insight[] }) {
  const [filter, setFilter] = useState<InsightDivision | 'all'>('all')

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (DIVISIONS.some(d => d.id === hash)) setFilter(hash as InsightDivision)
  }, [])

  const choose = (f: InsightDivision | 'all') => {
    setFilter(f)
    history.replaceState(null, '', f === 'all' ? window.location.pathname : `#${f}`)
  }

  const shown = filter === 'all' ? insights : insights.filter(i => i.division === filter)
  const counts = Object.fromEntries(DIVISIONS.map(d => [d.id, insights.filter(i => i.division === d.id).length]))
  const [featured, ...rest] = shown

  return (
    <>
      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
        {[{ id: 'all' as const, name: 'All', count: insights.length }, ...DIVISIONS.map(d => ({ ...d, count: counts[d.id] }))].map(f => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => choose(f.id)}
            style={{
              cursor: 'pointer', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '999px',
              border: `1px solid ${filter === f.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'}`,
              background: filter === f.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filter === f.id ? '#fff' : 'rgba(255,255,255,0.55)',
            }}>
            {f.name} <span style={{ color: 'rgba(255,255,255,0.35)' }}>{f.count}</span>
          </button>
        ))}
      </div>

      {!featured && (
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', padding: '40px 0' }}>
          The first {DIVISIONS.find(d => d.id === filter)?.name} publications are on their way.
        </p>
      )}

      {featured && (
        <Link href={`/insights/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '48px' }}>
          <div className="insights-featured-card" style={{
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: 'clamp(24px, 5vw, 40px)',
            background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s, background 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{
                fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600,
                color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '4px',
              }}>
                Latest
              </span>
              <Badge division={featured.division} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#fff', marginBottom: '16px' }}>
              {featured.title}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '24px', maxWidth: '680px' }}>
              {featured.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.825rem' }}>{formatDate(featured.date)}</span>
              <span style={{ color: 'rgba(134,239,172,0.7)', fontSize: '0.825rem', fontWeight: 500 }}>Read article →</span>
            </div>
          </div>
        </Link>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
        {rest.map(article => (
          <Link key={article.slug} href={`/insights/${article.slug}`} style={{ textDecoration: 'none' }}>
            <div className="insights-card" style={{
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px', height: '100%',
              display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', transition: 'border-color 0.2s, background 0.2s',
            }}>
              <div style={{ marginBottom: '14px' }}><Badge division={article.division} /></div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4, color: '#fff', marginBottom: '12px', flex: 1 }}>
                {article.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '20px' }}>
                {article.description.length > 120 ? article.description.slice(0, 120) + '…' : article.description}
              </p>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.775rem' }}>{formatDate(article.date)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
