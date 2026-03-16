"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { GsCard, GsBadge, ScoreRing, AIChatWidget } from "@/components/greenstack-ui"
import { CONTRACTORS } from "@/lib/data"

const statusC: Record<string, string> = { preferred: "emerald", active: "cyan", flagged: "red" }

export default function SupplyChainPage() {
  const [selected, setSelected] = useState<(typeof CONTRACTORS)[number] | null>(null)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState("")

  const aiSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults("")
    await new Promise((r) => setTimeout(r, 1800))
    setResults(`## Contractor Sourcing Results: "${query}"

**Recommended Contractor Types:**
\u2022 MCS-certified installers with commercial experience
\u2022 TrustMark-registered for quality assurance
\u2022 CIBSE-accredited for building services

**Key Accreditations Required:**
\u2022 MCS (Microgeneration Certification Scheme)
\u2022 TrustMark Government-endorsed standards
\u2022 NICEIC for electrical installations
\u2022 Gas Safe Register (if applicable)

**Typical UK Pricing (2026):**
\u2022 Day rate: \u00A3450\u2013\u00A3750 per engineer
\u2022 Project management: 8\u201312% of contract value
\u2022 Materials markup: 15\u201320%

**Vetting Checklist:**
\u2714 Valid insurance (public liability \u00A35M minimum)
\u2714 References from 3+ similar projects
\u2714 Financial health check (Dun & Bradstreet)
\u2714 H&S policy and RAMS documentation
\u2714 Environmental management policy

**Red Flags:**
\u26A0 Insurance expiring within 30 days
\u26A0 No TrustMark registration
\u26A0 On-time delivery below 85%
\u26A0 Fewer than 5 completed projects`)
    setSearching(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Supply Chain</h1>
          <p className="text-sm text-slate-500 mt-1">AI-sourced, scored, and monitored contractors</p>
        </div>
        <span className="text-xs text-slate-500">
          {CONTRACTORS.filter((c) => c.status === "preferred").length} preferred \u00B7{" "}
          {CONTRACTORS.filter((c) => c.status === "flagged").length} flagged
        </span>
      </div>

      <GsCard className="p-5" glow>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">AI Contractor Sourcing</p>
        <div className="flex gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && aiSearch()}
            placeholder="e.g. 'Solar PV installer Yorkshire' or 'BEMS contractor National'..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
          />
          <button
            onClick={aiSearch}
            disabled={searching || !query.trim()}
            className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-40"
          >
            {searching ? "Searching..." : "AI Search"}
          </button>
        </div>
        {(searching || results) && (
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            {searching ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 animate-pulse">
                  Scanning contractor databases, reviews, accreditations...
                </p>
                {[80, 65, 90, 50].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-white/5 animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{results}</div>
            )}
          </div>
        )}
      </GsCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONTRACTORS.map((c) => {
          const isOpen = selected?.id === c.id
          return (
            <GsCard
              key={c.id}
              className={cn("p-5 cursor-pointer hover:border-white/10", isOpen ? "border-emerald-500/25" : "")}
              glow={isOpen}
              onClick={() => setSelected(isOpen ? null : c)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.specialty} \u00B7 {c.region}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <ScoreRing score={c.score} size={44} />
                  <GsBadge color={statusC[c.status]}>{c.status}</GsBadge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { l: "Rating", v: `${c.rating}/5` },
                  { l: "Jobs", v: c.jobs },
                  { l: "On Time", v: `${c.onTime}%` },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg bg-white/[0.03] p-2 text-center">
                    <p className="text-xs text-slate-500">{s.l}</p>
                    <p className="text-sm font-mono font-semibold mt-0.5 text-white">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.accreditations.map((a) => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-slate-400">
                    {a}
                  </span>
                ))}
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-lg",
                    c.insurance === "Valid" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}
                >
                  {c.insurance === "Valid" ? "\u2713" : "\u26A0"} Insurance
                </span>
              </div>
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <AIChatWidget
                    placeholder="Ask about this contractor..."
                    systemPrompt={`You are GreenStack's supply chain AI evaluating contractor: ${c.name}. Specialty: ${c.specialty}. Score: ${c.score}/100.`}
                  />
                </div>
              )}
            </GsCard>
          )
        })}
      </div>
    </div>
  )
}
