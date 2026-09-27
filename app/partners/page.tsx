import Link from 'next/link'
import { PartnerForm } from './partner-form'

export const metadata = {
  title: 'Partner Network for Sustainability Consultants | GreenStack AI',
  description: 'Independent sustainability consultants: get pre-researched, pre-qualified work from VERDANT, plus a daily regulatory radar and traceable GHG calculation drafts.',
}

const serif = { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' as const }
const eyebrow = { color: 'rgba(134,239,172,0.8)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '16px' }
const card = { border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', background: 'rgba(255,255,255,0.02)' }

const BENEFITS = [
  ['Work that finds you', 'VERDANT scans UK and international tenders, buyer-intent signals and regulatory triggers every day. When an opportunity needs your accreditation, your sector or your region, it comes to you with the research already done: buyer background, regulatory context and a draft approach.'],
  ['A regulation radar that reads for you', 'VERDANT watches GOV.UK, the EU, the FCA, EFRAG and SBTi every morning. It tells you what changed, who it hits, the deadline and the source quote. No more Monday-morning reading.'],
  ['Calculations you can defend', 'Draft Scope 1 and 2 calculation packs where every line traces to an exact DESNZ conversion factor row and a stored formula. Nothing is estimated. You review, you sign, you keep your professional judgement.'],
  ['Fair terms', 'Referrals only go to vetted partners, and Reg approves each one personally. You deliver under your own name and rates. GreenStack takes a referral fee only on work you win.'],
]

export default function PartnersPage() {
  return (
    <main style={{ background: '#000', color: '#e4e4e7', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        .pn-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); }
        .pn-link { color: rgba(134,239,172,0.8); text-decoration: none; } .pn-link:hover { text-decoration: underline; }`}</style>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '96px 24px 120px' }}>
        <Link href="/" className="pn-link" style={{ fontSize: '0.85rem' }}>← GreenStack AI</Link>

        <header style={{ margin: '40px 0 64px', maxWidth: '780px' }}>
          <p style={eyebrow}>Partner network</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#fff' }}>
            You bring the <span style={serif}>judgement</span>.<br />VERDANT brings the <span style={serif}>work</span>.
          </h1>
          <p style={{ fontSize: '1.125rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginTop: '24px' }}>
            VERDANT is GreenStack AI&apos;s sustainability intelligence agent. It finds more work than one firm can deliver.
            We&apos;re building a small network of independent consultants and assessors it can hand that work to,
            with the research already done.
          </p>
        </header>

        <section className="pn-grid" style={{ marginBottom: '72px' }}>
          {BENEFITS.map(([title, body]) => (
            <div key={title} style={card}>
              <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px' }}>{title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: '0.95rem' }}>{body}</p>
            </div>
          ))}
        </section>

        <section style={{ ...card, padding: 'clamp(24px, 5vw, 40px)', maxWidth: '760px' }}>
          <p style={eyebrow}>Apply</p>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>
            Join the <span style={serif}>network</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '28px', fontSize: '0.95rem' }}>
            We especially want ESOS Lead Assessors, ISO 14064 verifiers, CBAM and embedded-emissions specialists, and consultants on public-sector frameworks.
            Reg checks every credential before a partner is vetted. See what VERDANT knows on its{' '}
            <Link href="/credentials" className="pn-link">knowledge base</Link>.
          </p>
          <PartnerForm />
        </section>
      </div>
    </main>
  )
}
