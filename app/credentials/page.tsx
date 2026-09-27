import Link from 'next/link'
import { getAcademyProgress } from '@/lib/verdant-academy'

export const revalidate = 3600

export const metadata = {
  title: "VERDANT's Knowledge Base | GreenStack AI",
  description: 'What VERDANT has studied, from which primary sources, and how it tests itself — plus who is accountable in the real world.',
}

const serif = { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' as const }
const eyebrow = { color: 'rgba(134,239,172,0.8)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '16px' }
const card = { border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', background: 'rgba(255,255,255,0.02)' }

const STATUS: Record<string, { label: string; color: string }> = {
  mastered: { label: 'Mastered', color: 'rgb(134,239,172)' },
  studied: { label: 'Studied', color: 'rgb(253,224,71)' },
  needs_restudy: { label: 'Restudying', color: 'rgb(251,146,60)' },
  not_started: { label: 'Queued', color: 'rgba(255,255,255,0.35)' },
}

export default async function CredentialsPage() {
  let modules: Awaited<ReturnType<typeof getAcademyProgress>> = []
  try { modules = await getAcademyProgress() } catch { /* render the curriculum without progress */ }
  const mastered = modules.filter(m => m.status === 'mastered').length

  return (
    <main style={{ background: '#000', color: '#e4e4e7', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        .kb-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); }
        .kb-row { display: grid; gap: 8px 24px; grid-template-columns: 1fr auto; align-items: start; }
        .kb-link { color: rgba(134,239,172,0.8); text-decoration: none; } .kb-link:hover { text-decoration: underline; }`}</style>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '96px 24px 120px' }}>
        <Link href="/" className="kb-link" style={{ fontSize: '0.85rem' }}>← GreenStack AI</Link>

        <header style={{ margin: '40px 0 64px', maxWidth: '760px' }}>
          <p style={eyebrow}>Knowledge base</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#fff' }}>
            The <span style={serif}>brain</span>, and the person who <span style={serif}>steers</span> it.
          </h1>
          <p style={{ fontSize: '1.125rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginTop: '24px' }}>
            VERDANT studies the syllabus sustainability consultants are trained on, but it learns from the primary sources themselves,
            the standards, regulations and official guidance, then proves it with a closed-book exam it can&apos;t see the answers to.
            Reg Orme, GreenStack&apos;s founder, is accountable for every piece of client work.
          </p>
        </header>

        <section style={{ marginBottom: '72px' }}>
          <p style={eyebrow}>How VERDANT learns</p>
          <div className="kb-grid">
            {[
              ['01', 'Study', 'Reads the official source, not a summary of it, and writes notes where every rule, threshold and date carries a citation.'],
              ['02', 'Examine', 'A separate examiner reads the same source and sets ten practitioner-level questions, each backed by a verbatim quote.'],
              ['03', 'Sit', 'VERDANT answers using only its own notes, closed book. Anything missing from the notes counts as wrong.'],
              ['04', 'Restudy', 'Weak areas feed straight into the next study session. Modules are re-read every 60 days so the notes stay current.'],
            ].map(([n, t, d]) => (
              <div key={n} style={card}>
                <p style={{ ...serif, color: 'rgba(134,239,172,0.8)', fontSize: '1.4rem' }}>{n}</p>
                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, margin: '8px 0' }}>{t}</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, fontSize: '0.95rem' }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '72px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <p style={{ ...eyebrow, marginBottom: 0 }}>Curriculum</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>{mastered} of {modules.length} mastered (≥ 85% closed-book)</p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {modules.map(m => {
              const s = STATUS[m.status] ?? STATUS.not_started
              return (
                <div key={m.slug} style={card} className="kb-row">
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{m.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: '6px', lineHeight: 1.6 }}>
                      Syllabus mirrors: {m.mirrorsCourse}
                    </p>
                    {m.sources.length > 0 && (
                      <p style={{ fontSize: '0.8rem', marginTop: '8px', lineHeight: 1.7 }}>
                        {m.sources.filter(src => URL.canParse(src.url)).map(src => (
                          <a key={src.url} href={src.url} className="kb-link" target="_blank" rel="noreferrer" style={{ marginRight: '14px' }}>
                            {src.title || new URL(src.url).hostname} ↗
                          </a>
                        ))}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                    <p style={{ color: s.color, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>{s.label}</p>
                    {m.bestScore !== null && <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600, marginTop: '4px' }}>{m.bestScore}%</p>}
                    {m.lastStudiedAt && (
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                        {new Date(m.lastStudiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="kb-grid" style={{ marginBottom: '72px' }}>
          <div style={card}>
            <p style={eyebrow}>What this is not</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
              These are not certificates. VERDANT hasn&apos;t sat accredited exams, and GreenStack AI doesn&apos;t claim the
              qualifications those courses award. Where a job legally needs an accredited signatory, such as an ESOS Lead Assessor
              or an ISO 14064 verifier, the work is signed off by a qualified professional from our{' '}
              <Link href="/partners" className="kb-link">partner network</Link>.
            </p>
          </div>
          <div style={card}>
            <p style={eyebrow}>Who steers</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
              VERDANT reads, watches regulators every day, and drafts traceable calculations. <strong style={{ color: '#fff' }}>Reg Orme</strong>{' '}
              decides what goes to clients, takes the meetings, and signs off the work personally. Every number in a VERDANT calculation
              traces back to an official UK Government conversion factor and is reviewed by a person before a client sees it.
            </p>
          </div>
        </section>

        <p style={{ textAlign: 'center' }}>
          <Link href="/contact" className="kb-link" style={{ fontSize: '1rem' }}>Talk to Reg about your reporting →</Link>
        </p>
      </div>
    </main>
  )
}
