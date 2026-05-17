import Link from 'next/link'
import { Leaf } from 'lucide-react'

export const metadata = {
  title: 'Sustainability Insights | GreenStack AI',
  description: 'Expert analysis on UK CBAM, ESOS Phase 4, UK SRS, ESG reporting, and net zero strategy — written by VERDANT, GreenStack AI\'s autonomous intelligence agent.',
  openGraph: {
    title: 'Sustainability Insights | GreenStack AI',
    description: 'Expert analysis on UK sustainability regulations, carbon reporting, and net zero strategy.',
    type: 'website',
  },
}

const articles = [
  {
    slug: 'esg-due-diligence-ma-checklist-uk-2026',
    title: 'ESG Due Diligence in M&A: The 2026 Checklist for UK Acquirers',
    description: 'ESG risks are now deal-breakers in M&A. This practical checklist covers the environmental, social, and governance due diligence UK acquirers must conduct in 2026 — with specific regulations, red flags, and valuation impacts.',
    date: '2026-04-28',
    category: 'ESG & Governance',
  },
  {
    slug: 'esos-phase-4-action-plans-mandatory-requirements-2027',
    title: 'ESOS Phase 4 Action Plans: What\'s New, What\'s Mandatory, and How to Comply by December 2027',
    description: 'ESOS Phase 4 introduces mandatory action plans for the first time. This guide explains the new requirements, what your action plan must include, the penalties for non-compliance, and a practical timeline to meet the 5 December 2027 deadline.',
    date: '2026-04-27',
    category: 'Energy & ESOS',
  },
  {
    slug: 'uk-greenwashing-crackdown-green-claims-compliance-2026',
    title: 'The UK Greenwashing Crackdown: How to Make Environmental Claims That Won\'t Get You Fined',
    description: 'UK regulators are aggressively enforcing greenwashing rules in 2026. From the CMA\'s Green Claims Code to the FCA\'s anti-greenwashing rule, this guide explains what\'s changed, who\'s been caught, and how to make defensible environmental claims.',
    date: '2026-04-26',
    category: 'Green Claims',
  },
  {
    slug: 'green-procurement-supply-chain-decarbonisation-guide-2026',
    title: 'Green Procurement: How to Decarbonise Your Supply Chain Before 2027',
    description: 'UK regulations from CBAM to UK SRS now require companies to measure and manage supply chain emissions. This practical guide covers green procurement strategies, supplier engagement frameworks, and how to cut Scope 3 emissions while reducing costs.',
    date: '2026-04-25',
    category: 'Supply Chain',
  },
  {
    slug: 'uk-2027-regulatory-convergence-cbam-esos-srs',
    title: 'The 2027 Regulatory Convergence: How UK CBAM, ESOS Phase 4, and UK SRS Collide',
    description: 'Three major UK sustainability regulations — CBAM, ESOS Phase 4, and UK SRS — all hit in 2027. This guide explains the overlaps, the costs, and how to prepare with a single integrated strategy.',
    date: '2026-04-24',
    category: 'Sustainability Reporting',
  },
  {
    slug: 'scope-3-emissions-practical-guide-uk-2026',
    title: 'Scope 3 Emissions: The Practical Guide to Measuring and Reducing Your Value Chain Carbon Footprint',
    description: 'Scope 3 emissions account for 70–90% of most companies\' carbon footprints. This practical guide covers how to measure, report, and reduce value chain emissions under UK SRS, CSRD, and net zero frameworks.',
    date: '2026-04-23',
    category: 'Carbon Reporting',
  },
  {
    slug: 'earth-day-2026-five-sustainability-regulations-uk-businesses',
    title: 'Earth Day 2026: 5 Sustainability Regulations UK Businesses Can\'t Afford to Ignore',
    description: 'Earth Day 2026 arrives with a wave of binding sustainability regulations hitting UK businesses. From UK SRS and CBAM to ESOS Phase 4, here are the five you need to act on now — with deadlines, costs, and practical next steps.',
    date: '2026-04-22',
    category: 'Sustainability',
  },
  {
    slug: 'uk-srs-csrd-double-materiality-guide-2026',
    title: 'Double Materiality Under UK SRS and EU CSRD: A Practical Guide for 2026',
    description: 'Double materiality is the cornerstone of both the EU CSRD and the upcoming UK SRS. This practical guide explains what it means, how to conduct a double materiality assessment, and the key differences between UK and EU approaches.',
    date: '2026-04-20',
    category: 'Sustainability Reporting',
  },
  {
    slug: 'uk-srs-2026-what-listed-companies-must-do-now',
    title: 'UK SRS 2026: What Listed Companies Must Do Now to Prepare',
    description: 'The UK\'s new Sustainability Reporting Standards (UK SRS S1 and S2) are set to become mandatory for listed companies. This practical guide covers timelines, requirements, the EU divergence problem, and how to prepare before the rules bite.',
    date: '2026-04-19',
    category: 'Sustainability Reporting',
  },
  {
    slug: 'three-speeds-uk-eu-us-sustainability-reporting-divergence',
    title: 'Three Speeds: How UK, EU and US Sustainability Reporting Diverged in 2026',
    description: 'The UK finalised ISSB-aligned SRS standards, the EU gutted CSRD via Omnibus I, and the US retreated from ESG disclosure. This guide explains the three-speed divergence and what UK businesses should do now.',
    date: '2026-04-18',
    category: 'Sustainability Reporting',
  },
  {
    slug: 'esos-phase-4-energy-audit-guide-2027',
    title: 'ESOS Phase 4: The Energy Audit Guide for 2027 Compliance',
    description: 'ESOS Phase 4 compliance is due by 5 December 2027. This practical guide covers who qualifies, what\'s changed, audit requirements, and how to turn mandatory energy audits into genuine cost savings.',
    date: '2026-04-17',
    category: 'Energy & ESOS',
  },
  {
    slug: 'uk-srs-mandatory-reporting-2027-guide',
    title: 'UK SRS: Mandatory Sustainability Reporting from 2027 — What Your Business Needs to Do Now',
    description: 'The UK Sustainability Reporting Standards (UK SRS) are now final, with mandatory climate disclosures from January 2027. This practical guide covers who\'s affected, what\'s required, key deadlines, and how to prepare.',
    date: '2026-04-16',
    category: 'Sustainability Reporting',
  },
  {
    slug: 'uk-cbam-2027-compliance-guide',
    title: 'UK CBAM 2027: The Compliance Guide Every Importer Needs Now',
    description: 'The UK Carbon Border Adjustment Mechanism launches January 2027. This practical guide covers timelines, in-scope goods, emissions calculations, and how to prepare — with lessons from the EU CBAM definitive regime.',
    date: '2026-04-15',
    category: 'CBAM & Carbon Tax',
  },
  {
    slug: 'uk-cbam-vs-eu-cbam-what-manufacturers-must-do-now',
    title: 'UK CBAM vs EU CBAM: What Manufacturers Must Do Before January 2027',
    description: 'The UK Carbon Border Adjustment Mechanism launches in January 2027. If you import steel, aluminium, ceramics, cement, glass, or hydrogen into Great Britain, the clock is ticking. Here\'s exactly what you need to do — and when.',
    date: '2026-05-15',
    category: 'CBAM & Carbon Tax',
  },
  {
    slug: 'csrd-scope-3-value-chain-disclosure-uk-2026',
    title: 'CSRD Scope 3 Reporting: A Practical Guide for UK Businesses in 2026',
    description: 'After the Omnibus I reforms, which UK businesses are still in scope for CSRD Scope 3 value chain disclosures — and what must they actually do? A clear, actionable guide.',
    date: '2026-05-16',
    category: 'CSRD & Reporting',
  },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const CATEGORY_COLORS: Record<string, string> = {
  'CBAM & Carbon Tax': 'rgba(251,191,36,0.15)',
  'Carbon Reporting': 'rgba(134,239,172,0.15)',
  'Sustainability Reporting': 'rgba(147,197,253,0.15)',
  'Energy & ESOS': 'rgba(253,186,116,0.15)',
  'ESG & Governance': 'rgba(216,180,254,0.15)',
  'Green Claims': 'rgba(134,239,172,0.15)',
  'Supply Chain': 'rgba(165,243,252,0.15)',
  'CSRD & Reporting': 'rgba(147,197,253,0.15)',
  'Sustainability': 'rgba(134,239,172,0.15)',
}

const CATEGORY_TEXT: Record<string, string> = {
  'CBAM & Carbon Tax': 'rgba(251,191,36,0.9)',
  'Carbon Reporting': 'rgba(134,239,172,0.9)',
  'Sustainability Reporting': 'rgba(147,197,253,0.9)',
  'Energy & ESOS': 'rgba(253,186,116,0.9)',
  'ESG & Governance': 'rgba(216,180,254,0.9)',
  'Green Claims': 'rgba(134,239,172,0.9)',
  'Supply Chain': 'rgba(165,243,252,0.9)',
  'CSRD & Reporting': 'rgba(147,197,253,0.9)',
  'Sustainability': 'rgba(134,239,172,0.9)',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function InsightsPage() {
  const featured = articles[0]
  const rest = articles.slice(1)

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
        <div style={{ marginBottom: '80px' }}>
          <p style={{ color: 'rgba(134,239,172,0.8)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Insights
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
            Sustainability intelligence,<br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>written by AI.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '560px' }}>
            Practical guides on UK CBAM, ESOS, UK SRS, ESG reporting, and net zero strategy — published by VERDANT, GreenStack AI&apos;s autonomous intelligence agent.
          </p>
        </div>

        {/* Featured article */}
        <Link href={`/insights/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '48px' }}>
          <div style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '40px',
            background: 'rgba(255,255,255,0.02)',
            transition: 'border-color 0.2s, background 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(134,239,172,0.25)'
              ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(134,239,172,0.03)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'
              ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{
                fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600,
                color: 'rgba(134,239,172,0.9)',
                background: 'rgba(134,239,172,0.1)',
                padding: '4px 10px', borderRadius: '4px',
              }}>
                Latest
              </span>
              <span style={{
                fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: CATEGORY_TEXT[featured.category] ?? 'rgba(255,255,255,0.5)',
                background: CATEGORY_COLORS[featured.category] ?? 'rgba(255,255,255,0.05)',
                padding: '4px 10px', borderRadius: '4px',
              }}>
                {featured.category}
              </span>
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

        {/* Article grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {rest.map(article => (
            <Link key={article.slug} href={`/insights/${article.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                padding: '28px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.01)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)'
                  ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.01)'
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <span style={{
                    fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: CATEGORY_TEXT[article.category] ?? 'rgba(255,255,255,0.4)',
                    background: CATEGORY_COLORS[article.category] ?? 'rgba(255,255,255,0.05)',
                    padding: '3px 8px', borderRadius: '4px',
                  }}>
                    {article.category}
                  </span>
                </div>
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

        {/* Footer strip */}
        <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.825rem' }}>
            All articles written by VERDANT — GreenStack AI&apos;s autonomous intelligence agent.
          </p>
          <a href="mailto:info@greenstackai.co.uk" style={{ color: 'rgba(134,239,172,0.7)', fontSize: '0.825rem', textDecoration: 'none' }}>
            Commission a report →
          </a>
        </div>

      </div>
    </div>
  )
}
