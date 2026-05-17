'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Leaf, Mail, MapPin, Clock, ArrowRight, CheckCircle, Globe, Shield } from 'lucide-react'

const SERVICES = [
  'Net Zero Roadmap & Strategy',
  'Carbon Reporting (Scope 1, 2 & 3)',
  'ESOS Phase 4 Compliance',
  'UK CBAM Guidance',
  'ESG Reporting (TCFD / GRI / CSRD)',
  'GreenStack Intelligence Report',
  'Green Procurement & Supply Chain',
  'Sustainability Strategy',
  'Education Sector Sustainability',
  'Tender / Bid Writing Support',
  'Other',
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    organisation: '',
    service: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.email.includes('@')) return
    setStatus('sending')
    try {
      const message = [
        form.name && `Name: ${form.name}`,
        form.organisation && `Organisation: ${form.organisation}`,
        form.service && `Service of interest: ${form.service}`,
        form.message && `Message: ${form.message}`,
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, source: 'contact', message }),
      })
      if (res.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui, sans-serif', color: '#fff' }}>

      {/* Nav */}
      <nav style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Leaf size={18} color="rgba(134,239,172,0.8)" />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>GreenStack</span>
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Contact</span>
      </nav>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '80px 24px 120px' }}>

        {/* Header */}
        <div style={{ marginBottom: '72px' }}>
          <p style={{ color: 'rgba(134,239,172,0.8)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Get in touch
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
            Let&apos;s talk<span style={{ color: 'rgba(134,239,172,0.7)' }}>.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '560px' }}>
            Whether you need a net zero roadmap, a carbon report, ESOS compliance help, or just want to understand what AI-native sustainability consultancy looks like — we&apos;re here.
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'start' }}>

          {/* Left: Contact info */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Email */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={18} color="rgba(134,239,172,0.8)" />
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Email</p>
                  <a href="mailto:info@greenstackai.co.uk" style={{ color: '#fff', fontSize: '1rem', fontWeight: 500, textDecoration: 'none' }}>
                    info@greenstackai.co.uk
                  </a>
                </div>
              </div>

              {/* Address */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={18} color="rgba(134,239,172,0.8)" />
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Registered Address</p>
                  <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 500, lineHeight: 1.6 }}>
                    29 Chillingham Street<br />
                    Liverpool, L8 9RX<br />
                    England
                  </p>
                </div>
              </div>

              {/* Response time */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={18} color="rgba(134,239,172,0.8)" />
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Response Time</p>
                  <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>Within 24 hours</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '2px' }}>Usually same day</p>
                </div>
              </div>

              {/* Global */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Globe size={18} color="rgba(134,239,172,0.8)" />
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Coverage</p>
                  <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>Worldwide</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '2px' }}>AI delivery — no geographic limits</p>
                </div>
              </div>

            </div>

            {/* What we can help with */}
            <div style={{ marginTop: '48px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <p style={{ color: 'rgba(134,239,172,0.8)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>We can help with</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Net zero roadmaps & carbon strategy',
                  'ESOS Phase 4 compliance',
                  'UK CBAM & carbon border guidance',
                  'Scope 1, 2 & 3 carbon reporting',
                  'ESG frameworks (TCFD, GRI, CSRD)',
                  'Tender & bid writing',
                  'GreenStack Intelligence Reports',
                  'Education sector sustainability',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ArrowRight size={14} color="rgba(134,239,172,0.6)" style={{ flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            {status === 'sent' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', border: '1px solid rgba(134,239,172,0.2)', borderRadius: '20px', background: 'rgba(134,239,172,0.04)', textAlign: 'center', gap: '16px' }}>
                <CheckCircle size={48} color="rgba(134,239,172,0.8)" />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Message received</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  Thanks for reaching out. We&apos;ll be in touch within 24 hours — usually the same day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Your name</label>
                    <input
                      type="text"
                      placeholder="Reginald Orme"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email address <span style={{ color: 'rgba(134,239,172,0.7)' }}>*</span></label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Organisation</label>
                  <input
                    type="text"
                    placeholder="Company or council name"
                    value={form.organisation}
                    onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Service of interest</label>
                  <select
                    value={form.service}
                    onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="">Select a service…</option>
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    placeholder="Tell us about your project, deadline, or what you need help with…"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                  />
                </div>

                {status === 'error' && (
                  <p style={{ color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem' }}>
                    Something went wrong. Please email us directly at info@greenstackai.co.uk
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    padding: '14px 28px',
                    background: status === 'sending' ? 'rgba(134,239,172,0.3)' : 'rgba(134,239,172,0.15)',
                    border: '1px solid rgba(134,239,172,0.3)',
                    borderRadius: '10px',
                    color: 'rgba(134,239,172,0.9)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, border-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: 'fit-content',
                  }}
                >
                  {status === 'sending' ? 'Sending…' : <>Send message <ArrowRight size={16} /></>}
                </button>

              </form>
            )}
          </div>

        </div>

        {/* Company Details */}
        <div style={{ marginTop: '96px', paddingTop: '48px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '32px' }}>
            Company information
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>

            <div>
              <p style={{ color: 'rgba(134,239,172,0.6)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Registered name</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                SATSSTRATEGY EDUCATION LTD<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>t/a GreenStack AI</span>
              </p>
            </div>

            <div>
              <p style={{ color: 'rgba(134,239,172,0.6)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Company number</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                16348591<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>England & Wales</span>
              </p>
            </div>

            <div>
              <p style={{ color: 'rgba(134,239,172,0.6)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>UN Global Marketplace</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Vendor No. 1203916<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>All UN agencies</span>
              </p>
            </div>

            <div>
              <p style={{ color: 'rgba(134,239,172,0.6)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Insurance</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Shield size={14} color="rgba(134,239,172,0.5)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Public Liability £1,000,000<br />
                  Professional Indemnity £50,000<br />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Policy CHBS5487956XB · Valid to Apr 2027</span>
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(134,239,172,0.35) !important; background: rgba(134,239,172,0.04) !important; }
        select option { background: #111; color: #fff; }
        button[type=submit]:hover:not(:disabled) { background: rgba(134,239,172,0.22) !important; border-color: rgba(134,239,172,0.5) !important; }
      `}</style>

    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.5)',
  fontSize: '0.8rem',
  letterSpacing: '0.05em',
  marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px 16px',
  color: '#fff',
  fontSize: '0.95rem',
  transition: 'border-color 0.2s, background 0.2s',
  boxSizing: 'border-box',
}
