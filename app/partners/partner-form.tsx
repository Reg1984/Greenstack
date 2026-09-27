'use client'

import { useState } from 'react'

const input = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
  padding: '12px 14px', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit',
}
const label = { display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '6px' }

export function PartnerForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setError('')
    const body = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <p style={{ color: 'rgb(134,239,172)', fontSize: '1.05rem', lineHeight: 1.7 }}>
        Thanks. Your application is with Reg, who will check your credentials and be in touch.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '18px' }}>
      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
        <div><label style={label} htmlFor="pn-name">Name *</label><input id="pn-name" name="name" required style={input} /></div>
        <div><label style={label} htmlFor="pn-email">Email *</label><input id="pn-email" name="email" type="email" required style={input} /></div>
        <div><label style={label} htmlFor="pn-firm">Firm</label><input id="pn-firm" name="firm" style={input} /></div>
        <div><label style={label} htmlFor="pn-rate">Day rate (£)</label><input id="pn-rate" name="day_rate_gbp" type="number" min="1" style={input} /></div>
      </div>
      <div>
        <label style={label} htmlFor="pn-spec">Specialisms * <span style={{ opacity: 0.6 }}>(comma separated)</span></label>
        <input id="pn-spec" name="specialisms" required placeholder="ESOS lead assessor, CBAM embedded emissions, Scope 3" style={input} />
      </div>
      <div>
        <label style={label} htmlFor="pn-regions">Regions <span style={{ opacity: 0.6 }}>(comma separated)</span></label>
        <input id="pn-regions" name="regions" placeholder="North West England, UK-wide, EU" style={input} />
      </div>
      <div>
        <label style={label} htmlFor="pn-creds">Credentials & registrations</label>
        <textarea id="pn-creds" name="credentials" rows={3} placeholder="e.g. ESOS Lead Assessor (register + number), IEMA PIEMA, CEnv" style={{ ...input, resize: 'vertical' }} />
      </div>
      <div>
        <label style={label} htmlFor="pn-notes">Anything else</label>
        <textarea id="pn-notes" name="notes" rows={3} style={{ ...input, resize: 'vertical' }} />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
      {state === 'error' && <p role="alert" style={{ color: 'rgb(252,165,165)', fontSize: '0.9rem' }}>{error}</p>}
      <button type="submit" disabled={state === 'sending'} style={{
        justifySelf: 'start', background: 'rgb(5,150,105)', color: '#fff', border: 0, borderRadius: '9999px',
        padding: '12px 28px', fontSize: '0.95rem', fontWeight: 600, cursor: state === 'sending' ? 'wait' : 'pointer', opacity: state === 'sending' ? 0.7 : 1,
      }}>
        {state === 'sending' ? 'Sending…' : 'Apply to join'}
      </button>
    </form>
  )
}
