import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { getInsights } from '@/lib/insights'
import { InsightsList } from '@/components/InsightsList'

// Built from the repo at deploy time, so every VERDANT publish (which triggers a deploy) appears here
export const dynamic = 'force-static'

export const metadata = {
  title: 'Insights | GreenStack AI',
  description: 'Research and practical guidance from GreenStack AI across climate, education and impact — net zero and carbon reporting, curriculum and school improvement, evaluation and evidence.',
  openGraph: {
    title: 'Insights | GreenStack AI',
    description: 'Research and practical guidance across climate, education and impact.',
    type: 'website',
  },
}

export default function InsightsPage() {
  const insights = getInsights()

  return (
    <div style={{ background: '#000', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui, sans-serif', color: '#fff' }}>

      {/* Nav */}
      <nav style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Leaf size={18} color="rgba(134,239,172,0.8)" />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>GreenStack</span>
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Insights</span>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px 120px' }}>

        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <p style={{ color: 'rgba(134,239,172,0.8)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Insights
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
            Research and guidance,<br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>across climate, education and impact.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '600px' }}>
            Practical analysis for public services and the organisations that serve them — from net zero and carbon reporting to curriculum, school improvement, evaluation and evidence. Researched and written with VERDANT, GreenStack AI&apos;s research agent.
          </p>
        </div>

        <InsightsList insights={insights} />

        {/* Footer strip */}
        <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.825rem' }}>
            Researched and written with VERDANT — GreenStack AI&apos;s research agent.
          </p>
          <a href="mailto:info@greenstackai.co.uk" style={{ color: 'rgba(134,239,172,0.7)', fontSize: '0.825rem', textDecoration: 'none' }}>
            Commission research →
          </a>
        </div>

      </div>

      <style>{`
        .insights-featured-card:hover { border-color: rgba(134,239,172,0.25) !important; background: rgba(134,239,172,0.03) !important; }
        .insights-card:hover { border-color: rgba(255,255,255,0.15) !important; background: rgba(255,255,255,0.03) !important; }
      `}</style>
    </div>
  )
}
