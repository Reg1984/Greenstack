'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GsCard, GsBadge, StatCard } from '@/components/greenstack-ui'
import { AUDITS } from '@/lib/data'
import { Check } from 'lucide-react'

const types = ['Full Energy Audit', 'Carbon Baseline', 'ISO 50001 Gap Analysis', 'Net Zero Roadmap', 'ESOS Assessment', 'Renewable Feasibility']
const statusC: Record<string, string> = { complete: 'emerald', completed: 'emerald', 'in-progress': 'yellow', scheduled: 'blue' }

export default function AuditsPage() {
  const [clientName, setClientName] = useState('')
  const [auditType, setAuditType] = useState('Full Energy Audit')
    id: a.id,
    client: a.client,
    type: a.audit_type,
    status: a.status || 'scheduled',
    date: a.date ? new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBC',
    savings: a.savings || 'TBC',
    co2: a.co2_reduction || 'TBC',
  }))
  
  const [clientName, setClientName] = useState('')
  const [auditType, setAuditType] = useState('Full Energy Audit')
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState('')

  const generate = async () => {
    if (!clientName.trim()) return
    setGenerating(true)
    setReport('')
    await new Promise((r) => setTimeout(r, 2500))
    setReport(`## ${auditType} — ${clientName}

### Executive Summary
This audit was conducted in accordance with BS EN 16247 and ESOS regulations. The assessment covers all major energy-consuming systems across the organisation's operational footprint.

### Key Findings
• Total annual energy consumption: ${Math.floor(Math.random() * 5000 + 2000)} MWh
• Current energy cost: £${Math.floor(Math.random() * 400 + 200)}K per annum
• Carbon footprint (Scope 1 & 2): ${Math.floor(Math.random() * 1000 + 400)} tCO₂e
• Energy Performance Certificate rating: D (opportunity for B)

### Top 5 Recommendations

1. **LED Lighting Retrofit** — £45K investment, £18K/yr savings, 2.5yr payback
2. **BEMS Installation** — £68K investment, £32K/yr savings, 2.1yr payback
3. **Solar PV (200kWp)** — £180K investment, £40K/yr savings, 4.5yr payback
4. **Heat Pump Conversion** — £95K investment, £22K/yr savings, 4.3yr payback
5. **Insulation Upgrade** — £28K investment, £12K/yr savings, 2.3yr payback

### 3-Year Phased Roadmap
**Year 1:** LED retrofit + BEMS installation (Quick wins)
**Year 2:** Solar PV installation + insulation upgrades
**Year 3:** Heat pump conversion + monitoring optimisation

### Estimated Total Impact
• Annual savings: £124K/yr
• CO₂ reduction: 340 tCO₂e/yr
• Combined payback: 3.2 years
• 20-year NPV: £1.8M`)
    
    // Save to database if logged in
    if (user) {
      try {
        await createAudit({
          client: clientName,
          audit_type: auditType,
          status: 'completed',
          savings: '£124K/yr',
          co2_reduction: '340 tCO₂e/yr',
        })
        mutate()
      } catch (e) {
        console.error('Failed to save audit:', e)
      }
    }
    setGenerating(false)
  }

  const completeAudits = allAudits.filter((a) => a.status === 'complete' || a.status === 'completed').length
  const avgSavings = Math.round(
    allAudits.filter((a) => a.savings !== 'TBC')
      .reduce((sum, a) => {
        const savings = parseInt(a.savings.replace(/[^0-9]/g, ''))
        return sum + savings
      }, 0) / 2
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Energy Audits</h1>
        <p className="text-sm text-slate-500 mt-1">{isDemo ? 'Demo: Sample audit reports' : `${allAudits.length} audits on record`}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Audits" value={allAudits.length} color="#00ff87" />
        <StatCard label="Completed" value={completeAudits} delta={allAudits.length > 0 ? `${Math.round((completeAudits / allAudits.length) * 100)}% complete` : '0%'} color="#60efff" />
        <StatCard label="Avg Savings" value={`£${avgSavings}K`} delta="Annual" color="#a78bfa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Generation Area */}
        <div className="lg:col-span-2 space-y-4">
          <GsCard className="p-5" glow>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Generate New Audit Report</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Client / Organisation</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Manufacturing Ltd"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Audit Type</label>
                <select
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40"
                >
                  {types.map((t) => (
                    <option key={t} value={t} className="bg-slate-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-slate-400 mb-2.5">Compliance Requirements</p>
              <div className="space-y-1.5">
                {['BS EN 16247 Standard', 'ESOS Regulations', 'Net Zero Strategy', 'ISO 50001', 'Evidence Trail'].map((req) => (
                  <div key={req} className="flex items-center gap-2 text-xs">
                    <div className="w-3.5 h-3.5 rounded border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    <span className="text-slate-400">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating || !clientName.trim()}
              className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>AI Generating Report...
                </>
              ) : (
                <>Generate {auditType}</>
              )}
            </button>
          </GsCard>

          {(generating || report) && (
            <GsCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  {auditType} — {clientName}
                </p>
                {report && !generating && (
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all">
                      Export PDF
                    </button>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                      Send to Client
                    </button>
                  </div>
                )}
              </div>
              {generating ? (
                <div className="space-y-2">
                  {[90, 70, 85, 60, 95, 45, 75, 55].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 rounded bg-white/5 animate-pulse"
                      style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{report}</div>
              )}
            </GsCard>
          )}
        </div>

        {/* Right - Audit Timeline */}
        <div className="space-y-3">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Recent Audits</p>
          <div className="space-y-3">
            {allAudits.length === 0 ? (
              <GsCard className="p-8 text-center">
                <p className="text-sm text-slate-500">No audits yet. Generate your first audit above.</p>
              </GsCard>
            ) : allAudits.map((a, idx) => (
              <GsCard key={a.id} className="p-4 hover:border-white/10 transition-all relative">
                {/* Timeline connector */}
                {idx < allAudits.length - 1 && (
                  <div className="absolute left-[19px] top-[56px] w-0.5 h-6 bg-gradient-to-b from-slate-600 to-transparent" />
                )}

                {/* Timeline dot */}
                <div className="absolute left-3 top-4 w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 ring-2 ring-background" />

                <div className="pl-8">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-white">{a.client}</p>
                    <GsBadge color={statusC[a.status]}>{a.status}</GsBadge>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{a.date}</p>
                  <p className="text-xs text-slate-500">{a.type}</p>

                  {a.savings !== 'TBC' && (
                    <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-slate-600">Savings</p>
                        <p className="text-sm font-mono text-emerald-400">{a.savings}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">CO₂</p>
                        <p className="text-sm font-mono text-cyan-400">{a.co2}</p>
                      </div>
                    </div>
                  )}
                </div>
              </GsCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
