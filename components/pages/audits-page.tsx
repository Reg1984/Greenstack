"use client"

import { useState } from "react"
import { GsCard, GsBadge } from "@/components/greenstack-ui"
import { AUDITS } from "@/lib/data"

const types = ["Full Energy Audit", "Carbon Baseline", "ISO 50001 Gap Analysis", "Net Zero Roadmap", "ESOS Assessment", "Renewable Feasibility"]
const statusC: Record<string, string> = { complete: "emerald", "in-progress": "yellow", scheduled: "blue" }

export default function AuditsPage() {
  const [clientName, setClientName] = useState("")
  const [auditType, setAuditType] = useState("Full Energy Audit")
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState("")

  const generate = async () => {
    if (!clientName.trim()) return
    setGenerating(true)
    setReport("")
    await new Promise((r) => setTimeout(r, 2500))
    setReport(`## ${auditType} \u2014 ${clientName}

### Executive Summary
This audit was conducted in accordance with BS EN 16247 and ESOS regulations. The assessment covers all major energy-consuming systems across the organisation's operational footprint.

### Key Findings
\u2022 Total annual energy consumption: ${Math.floor(Math.random() * 5000 + 2000)} MWh
\u2022 Current energy cost: \u00A3${Math.floor(Math.random() * 400 + 200)}K per annum
\u2022 Carbon footprint (Scope 1 & 2): ${Math.floor(Math.random() * 1000 + 400)} tCO\u2082e
\u2022 Energy Performance Certificate rating: D (opportunity for B)

### Top 5 Recommendations

1. **LED Lighting Retrofit** \u2014 \u00A345K investment, \u00A318K/yr savings, 2.5yr payback
2. **BEMS Installation** \u2014 \u00A368K investment, \u00A332K/yr savings, 2.1yr payback
3. **Solar PV (200kWp)** \u2014 \u00A3180K investment, \u00A340K/yr savings, 4.5yr payback
4. **Heat Pump Conversion** \u2014 \u00A395K investment, \u00A322K/yr savings, 4.3yr payback
5. **Insulation Upgrade** \u2014 \u00A328K investment, \u00A312K/yr savings, 2.3yr payback

### 3-Year Phased Roadmap
**Year 1:** LED retrofit + BEMS installation (Quick wins)
**Year 2:** Solar PV installation + insulation upgrades
**Year 3:** Heat pump conversion + monitoring optimisation

### Estimated Total Impact
\u2022 Annual savings: \u00A3124K/yr
\u2022 CO\u2082 reduction: 340 tCO\u2082e/yr
\u2022 Combined payback: 3.2 years
\u2022 20-year NPV: \u00A31.8M`)
    setGenerating(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Energy Audits</h1>
        <p className="text-sm text-slate-500 mt-1">AI-generated professional audit reports in minutes</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <GsCard className="p-5" glow>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Generate New Audit</p>
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
            <button
              onClick={generate}
              disabled={generating || !clientName.trim()}
              className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block">{"\u27F3"}</span>AI Generating Report...
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
                  {auditType} \u2014 {clientName}
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
                    <div key={i} className="h-3 rounded bg-white/5 animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{report}</div>
              )}
            </GsCard>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Previous Audits</p>
          {AUDITS.map((a) => (
            <GsCard key={a.id} className="p-4 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium leading-snug text-white">{a.client}</p>
                <GsBadge color={statusC[a.status]}>{a.status}</GsBadge>
              </div>
              <p className="text-xs text-slate-500">
                {a.type} \u00B7 {a.date}
              </p>
              {a.savings !== "TBC" && (
                <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-500">Savings</p>
                    <p className="text-sm font-mono text-emerald-400">{a.savings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">CO\u2082</p>
                    <p className="text-sm font-mono text-cyan-400">{a.co2}</p>
                  </div>
                </div>
              )}
            </GsCard>
          ))}
        </div>
      </div>
    </div>
  )
}
