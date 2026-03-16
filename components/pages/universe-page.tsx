"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { GsCard, GsBadge, ProgressBar, PulseDot } from "@/components/greenstack-ui"
import { TENDERS, REGION_CARBON, SECTOR_COLORS, STATUS_MAP, fmt, fmtCO2 } from "@/lib/data"

const EarthGlobe = dynamic(
  () => import("@/components/globe/earth-globe").then((m) => m.EarthGlobe),
  { ssr: false, loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Initialising Globe</p>
      </div>
    </div>
  )}
)

export default function UniversePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showTenders, setShowTenders] = useState(true)
  const [showPanel, setShowPanel] = useState(true)

  const selected = useMemo(() => TENDERS.find((t) => t.id === selectedId) || null, [selectedId])

  const totalValue = TENDERS.reduce((s, c) => s + c.value, 0)
  const totalCO2 = REGION_CARBON.reduce((s, r) => s + r.saved, 0)
  const countries = new Set(TENDERS.map((t) => t.location)).size

  const sectorBreak = useMemo(() => {
    return Object.entries(
      TENDERS.reduce<Record<string, number>>((a, c) => {
        a[c.sector] = (a[c.sector] || 0) + c.value
        return a
      }, {})
    ).sort((a, b) => b[1] - a[1])
  }, [])

  return (
    <div className="relative flex-1 h-full overflow-hidden" style={{ background: "#00020a" }}>
      {/* 3D Globe */}
      <EarthGlobe
        selectedId={selectedId}
        onSelectTender={setSelectedId}
        showHeatmap={showHeatmap}
        showTenders={showTenders}
      />

      {/* Top bar overlay */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, rgba(0,2,10,0.9) 0%, rgba(0,2,10,0.4) 70%, transparent 100%)" }}
      >
        <div>
          <h1 className="font-black text-white tracking-tight leading-none text-lg">Impact Universe</h1>
          <p className="text-xs font-mono mt-1 text-emerald-500/60">REAL-TIME SUSTAINABILITY INTELLIGENCE</p>
        </div>
        <div className="flex items-center gap-8">
          {[
            { l: "TENDERS", v: TENDERS.length.toString() },
            { l: "PIPELINE", v: fmt(totalValue) },
            { l: "CO\u2082 SAVED", v: fmtCO2(totalCO2) },
            { l: "REGIONS", v: countries.toString() },
          ].map((s) => (
            <div key={s.l} className="text-right">
              <p className="text-xs font-mono text-slate-600 tracking-widest">{s.l}</p>
              <p className="text-xl font-bold font-mono text-emerald-400">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Layer toggles */}
      <div className="absolute top-20 left-6 z-10 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setShowTenders(!showTenders)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
            showTenders
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/5 text-slate-500 border border-white/10"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", showTenders ? "bg-emerald-400" : "bg-slate-600")} />
          Tenders
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
            showHeatmap
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-white/5 text-slate-500 border border-white/10"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", showHeatmap ? "bg-cyan-400" : "bg-slate-600")} />
          Carbon Heatmap
        </button>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all"
        >
          {showPanel ? "Hide" : "Show"} Panel
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-6 left-6 z-10 pointer-events-none"
        style={{ animation: "fadein 1s ease both" }}
      >
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(0,2,10,0.85)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          <p className="text-xs font-mono text-slate-600 mb-2.5 tracking-widest">PIN STATUS</p>
          {[
            { label: "Bidding", color: "#00ff87" },
            { label: "Sourcing", color: "#60efff" },
            { label: "Reviewing", color: "#ffd166" },
            { label: "Found", color: "#818cf8" },
            { label: "Submitted", color: "#c084fc" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
          ))}
          {showHeatmap && (
            <>
              <div className="h-px bg-white/5 my-2.5" />
              <p className="text-xs font-mono text-slate-600 mb-2 tracking-widest">CARBON INTENSITY</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, #cc3333, #ffd166, #00ff87)" }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-600">Low</span>
                <span className="text-xs text-slate-600">High</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right panel */}
      {showPanel && (
        <div
          className="absolute top-20 right-5 z-10 space-y-3 pointer-events-auto"
          style={{ animation: "fadein 0.4s ease both", width: 280 }}
        >
          {/* Selected tender detail */}
          {selected && (
            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(0,2,10,0.92)",
                border: `1px solid ${SECTOR_COLORS[selected.sector]?.glow || "#fff"}30`,
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <GsBadge color={STATUS_MAP[selected.status]?.color || "emerald"}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </GsBadge>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-slate-600 hover:text-slate-400 text-sm leading-none"
                  aria-label="Close detail"
                >
                  {"\u2715"}
                </button>
              </div>
              <p className="text-sm font-semibold leading-snug mb-1 text-white">{selected.title}</p>
              <p className="text-xs mb-3" style={{ color: (SECTOR_COLORS[selected.sector]?.core || "#aaa") + "99" }}>
                {selected.sector} | {selected.location}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{selected.description}</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs text-slate-500 mb-1">Value</p>
                  <p className="text-sm font-bold font-mono text-emerald-400">{fmt(selected.value)}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs text-slate-500 mb-1">AI Match</p>
                  <p className="text-sm font-bold font-mono text-cyan-400">{selected.match}%</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {selected.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-slate-400">{tag}</span>
                ))}
              </div>
              <ProgressBar value={selected.match} color={selected.match >= 90 ? "#00ff87" : "#ffd166"} />
              <p className="text-xs text-slate-600 mt-1">Due {selected.deadline}</p>
            </div>
          )}

          {/* Sector breakdown */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(0,2,10,0.88)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs font-mono text-slate-500 mb-3 tracking-widest">PIPELINE BY SECTOR</p>
            {sectorBreak.map(([sec, val]) => {
              const c = SECTOR_COLORS[sec] || SECTOR_COLORS["Commercial"]
              const pct = Math.round((val / totalValue) * 100)
              return (
                <div key={sec} className="mb-2.5">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-400">{sec}</span>
                    <span className="text-xs font-mono" style={{ color: c.core }}>{fmt(val)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-800"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg,${c.core},${c.glow})` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total impact */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(0,2,10,0.88)",
              border: "1px solid rgba(0,255,135,0.1)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <PulseDot size={1.5} />
              <p className="text-xs font-mono text-slate-500 tracking-widest">TOTAL CARBON IMPACT</p>
            </div>
            <p className="text-2xl font-black text-emerald-400">{fmtCO2(totalCO2)}</p>
            <p className="text-xs text-slate-500 mt-0.5">across {REGION_CARBON.length} regions</p>
            <div className="mt-2.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((totalCO2 / 5000) * 100, 100)}%`,
                  background: "linear-gradient(90deg,#00ff87,#60efff)",
                  transition: "width 1s ease",
                }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">{Math.round((totalCO2 / 5000) * 100)}% to 5K tCO2e milestone</p>
          </div>
        </div>
      )}

      {/* Bottom instruction */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-700 text-center pointer-events-none z-10">
        DRAG TO ROTATE | SCROLL TO ZOOM | CLICK PINS TO EXPLORE
      </p>
    </div>
  )
}
