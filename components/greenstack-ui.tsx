"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export function PulseDot({ color = "#00ff87", size = 2 }: { color?: string; size?: number }) {
  return (
    <span className="relative flex shrink-0" style={{ width: size * 6, height: size * 6 }}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-full w-full" style={{ backgroundColor: color }} />
    </span>
  )
}

const badgeMap: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  red: "bg-red-500/15 text-red-400 border-red-500/20",
  slate: "bg-slate-500/15 text-slate-400 border-slate-500/20",
}

export function GsBadge({ children, color = "emerald" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border", badgeMap[color] || badgeMap.emerald)}>
      {children}
    </span>
  )
}

export function GsCard({
  children,
  className,
  glow,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-2xl border border-white/5 transition-all duration-300", className)}
      style={{
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(12px)",
        ...(glow ? { boxShadow: "0 0 40px rgba(0,255,135,0.07)" } : {}),
      }}
    >
      {children}
    </div>
  )
}

export function ProgressBar({ value, color = "#00ff87" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: `linear-gradient(90deg,${color},${color}88)` }}
      />
    </div>
  )
}

export function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 90 ? "#00ff87" : score >= 75 ? "#ffd166" : score >= 60 ? "#60efff" : "#ff6b6b"
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-label={`Score: ${score}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fill: color,
          fontSize: size * 0.28,
          fontWeight: 700,
          transform: "rotate(90deg)",
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      >
        {score}
      </text>
    </svg>
  )
}

export function AnimNum({ value }: { value: number }) {
  const [d, setD] = useState(0)
  useEffect(() => {
    let start: number | undefined
    const dur = 1000
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setD(Math.round(value * e))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <span>{d.toLocaleString()}</span>
}

export function StatCard({
  label,
  value,
  delta,
  color = "#00ff87",
  icon,
}: {
  label: string
  value: string | number
  delta?: string
  color?: string
  icon?: React.ReactNode
}) {
  return (
    <GsCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{label}</p>
        {icon && <span className="text-base" style={{ color }}>{icon}</span>}
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color }}>
        {value}
      </p>
      {delta && <p className="text-xs text-slate-500">{delta}</p>}
      <div className="mt-3 h-px" style={{ background: `linear-gradient(90deg,${color}50,transparent)` }} />
    </GsCard>
  )
}

export function DetailPanel({
  open,
  onClose,
  children,
  title,
  subtitle,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-[420px] z-50 border-l border-white/5 flex flex-col transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "translate-x-full"
      )}
      style={{ background: "rgba(2,10,20,0.97)", backdropFilter: "blur(24px)" }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div>
          {title && <h3 className="font-semibold text-white text-sm">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          {"\u2715"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}

export function FilterBar({
  search,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  placeholder,
}: {
  search: string
  onSearchChange: (v: string) => void
  filters: string[]
  activeFilter: string
  onFilterChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
      />
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onFilterChange(f)}
          className={cn(
            "px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all",
            activeFilter === f
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10"
          )}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

export function AIChatWidget({
  systemPrompt,
  placeholder,
}: {
  systemPrompt?: string
  placeholder?: string
}) {
  const [msgs, setMsgs] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    const next = [...msgs, { role: "user", content: userMsg }]
    setMsgs(next)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          systemPrompt,
        }),
      })
      
      if (!res.ok) {
        throw new Error(`Chat error: ${res.status}`)
      }
      
      const data = await res.json()
      setMsgs([...next, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error('Chat error:', error)
      setMsgs([...next, { role: "assistant", content: "Error connecting to AI. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
        {msgs.length === 0 && <p className="text-xs text-slate-600 italic">Ask the AI anything...</p>}
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <span
              className={cn(
                "text-xs px-3 py-2 rounded-xl max-w-[85%] leading-relaxed",
                m.role === "user"
                  ? "bg-emerald-500/20 text-emerald-100 rounded-tr-sm"
                  : "bg-white/5 text-slate-300 rounded-tl-sm border border-white/5"
              )}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <span className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 animate-pulse">
              Thinking...
            </span>
          </div>
        )}
        <div ref={ref} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={placeholder || "Ask AI..."}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs transition-all disabled:opacity-30"
          aria-label="Send message"
        >
          {"\u2192"}
        </button>
      </div>
    </div>
  )
}
