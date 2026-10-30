import Link from 'next/link'

const serif = { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' as const }
const eyebrow = { color: 'rgba(134,239,172,0.8)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '16px' }
const card = { border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', background: 'rgba(255,255,255,0.02)' }

export const DIVISIONS = [
  { href: '/climate', name: 'Climate' },
  { href: '/education', name: 'Education' },
  { href: '/impact', name: 'Impact' },
]

export type DivisionContent = {
  division: string
  headline: [string, string, string?]
  intro: string
  services: [string, string][]
  approachTitle: string
  approach: [string, string][]
  standards: string[]
  extraLinks?: [string, string][]
}

export function DivisionPage({ c }: { c: DivisionContent }) {
  const [before, emphasis, after] = c.headline
  return (
    <main style={{ background: '#000', color: '#e4e4e7', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        .dv-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); }
        .dv-link { color: rgba(134,239,172,0.8); text-decoration: none; } .dv-link:hover { text-decoration: underline; }
        .dv-nav { display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center; }`}</style>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '96px 24px 120px' }}>
        <nav className="dv-nav" style={{ fontSize: '0.85rem' }}>
          <Link href="/" className="dv-link">← GreenStack AI</Link>
          {DIVISIONS.map(d => (
            <Link key={d.href} href={d.href} className="dv-link"
              style={d.name === c.division ? { color: '#fff' } : { color: 'rgba(255,255,255,0.5)' }}>
              {d.name}
            </Link>
          ))}
        </nav>

        <header style={{ margin: '40px 0 64px', maxWidth: '780px' }}>
          <p style={eyebrow}>GreenStack {c.division}</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#fff' }}>
            {before} <span style={serif}>{emphasis}</span>{after ?? ''}
          </h1>
          <p style={{ fontSize: '1.125rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginTop: '24px' }}>{c.intro}</p>
        </header>

        <p style={eyebrow}>Services</p>
        <section className="dv-grid" style={{ marginBottom: '72px' }}>
          {c.services.map(([title, body]) => (
            <div key={title} style={card}>
              <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px' }}>{title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: '0.95rem' }}>{body}</p>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: '72px', maxWidth: '860px' }}>
          <p style={eyebrow}>How we work</p>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '32px' }}>
            {c.approachTitle}
          </h2>
          {c.approach.map(([title, body]) => (
            <div key={title} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 0' }}>
              <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>{title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: '0.95rem' }}>{body}</p>
            </div>
          ))}
        </section>

        <section style={{ ...card, padding: 'clamp(24px, 5vw, 40px)', maxWidth: '760px', marginBottom: '72px' }}>
          <p style={eyebrow}>Our standards</p>
          <ul style={{ listStyle: 'none', display: 'grid', gap: '12px' }}>
            {c.standards.map(s => (
              <li key={s} style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontSize: '0.95rem', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(134,239,172,0.8)' }}>—</span>{s}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ maxWidth: '760px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 600, marginBottom: '12px' }}>
            Talk to us about your <span style={serif}>brief</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
            Email <a href="mailto:info@greenstackai.co.uk" className="dv-link">info@greenstackai.co.uk</a> or use our{' '}
            <Link href="/contact" className="dv-link">contact page</Link>.
          </p>
          {c.extraLinks && (
            <div className="dv-nav" style={{ fontSize: '0.9rem' }}>
              {c.extraLinks.map(([href, label]) => (
                <Link key={href} href={href} className="dv-link">{label} →</Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
