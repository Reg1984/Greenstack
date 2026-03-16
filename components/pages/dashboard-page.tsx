"use client"

import { useState, useEffect } from "react"
import { GsCard, StatCard, PulseDot, AnimNum, ProgressBar, GsBadge } from "@/components/greenstack-ui"
import { TENDERS, PIPELINE_MONTHLY, fmt } from "@/lib/data"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const activity = [
  { t: "2m", text: "Bid submitted: Manchester Airport Carbon Offset", type: "success", icon: ">" },
  { t: "14m", text: "3 contractors sourced for Leeds LED Retrofit", type: "info", icon: "+" },
  { t: "1h", text: "New \u00A3890K tender found: Liverpool Port", type: "found", icon: "*" },
  { t: "2h", text: "AI bid style updated \u2014 win rate improved to 34%", type: "learn", icon: "~" },
  { t: "3h", text: "Contractor flagged: SolarEdge North \u2014 insurance expiring", type: "warn", icon: "!" },
  { t: "4h", text: "Sheffield audit report generated and delivered", type: "success", icon: ">" },
  { t: "5h", text: "NHS Trust tender match score updated to 91%", type: "info", icon: "+" },
]

const actC: Record<string, string> = { success: "#00ff87", info: "#60efff", found: "#818cf8", learn: "#c084fc", warn: "#ffd166" }

const statusBreakdown = [
  { name: "Found", value: 4, color: "#818cf8" },
  { name: "Reviewing", value: 1, color: "#ffd166" },
  { name: "Sourcing", value: 1, color: "#60efff" },
  { name: "Bidding", value: 1, color: "#00ff87" },
  { name: "Submitted", value: 1, color: "#c084fc" },
]

const chartData = PIPELINE_MONTHLY.map((d) => ({
  ...d,
  valueFmt: (d.value / 1000000).toFixed(1),
}))

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(2,10,20,0.95)", border: "1px solid rgba(0,255,135,0.2)" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-mono font-bold text-emerald-400">{"\u00A3"}{(payload[0].value / 1000000).toFixed(2)}M</p>
    </div>
  )
}

const pipeline = [
  { s: "Aviation", v: 94, a: "\u00A32.1M" },
  { s: "Local Authority", v: 78, a: "\u00A31.8M" },
  { s: "Healthcare", v: 62, a: "\u00A31.2M" },
  { s: "Utilities", v: 71, a: "\u00A31.5M" },
  { s: "Education", v: 45, a: "\u00A3840K" },
  { s: "Transport", v: 38, a: "\u00A3680K" },
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-balance">Command Centre</h1>
          <p className="text-sm text-slate-500 mt-1">All systems active | AI agents running autonomously</p>
        </div>
        <div className="flex gap-2">
          {["New Tender", "Start Audit", "View Reports"].map((a) => (
            <button
              key={a}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-xs text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all"
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Live Tenders" value={<AnimNum value={47} />} delta="+12 this week" color="#00ff87" />
        <StatCard label="Pipeline Value" value={"\u00A32.4M"} delta="+\u00A3340K this week" color="#60efff" />
        <StatCard label="Bids Submitted" value={<AnimNum value={183} />} delta="+8 today" color="#ffd166" />
        <StatCard label="Win Rate" value="34%" delta="+4% vs last month" color="#c084fc" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GsCard className="lg:col-span-2 p-6">
          <h2 className="font-semibold text-sm text-white mb-1">Pipeline Growth</h2>
          <p className="text-xs text-slate-500 mb-4">Total pipeline value over 6 months</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u00A3${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#00ff87" strokeWidth={2} fill="url(#pipelineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GsCard>

        <GsCard className="p-6">
          <h2 className="font-semibold text-sm text-white mb-1">Tender Status</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown by current stage</p>
          <div className="h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 justify-center">
            {statusBreakdown.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-400">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </GsCard>
      </div>

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GsCard className="lg:col-span-2 p-6">
          <h2 className="font-semibold text-sm text-white mb-4">Pipeline by Sector</h2>
          {pipeline.map((row, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <span className="text-xs text-slate-400 w-28">{row.s}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${row.v}%`, background: "linear-gradient(90deg,#00ff87,#00c86e)" }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400 w-14 text-right">{row.a}</span>
            </div>
          ))}
        </GsCard>

        <GsCard className="p-5">
          <h2 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <PulseDot size={1.5} />
            AI Activity Feed
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-2.5 group">
                <div
                  className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono shrink-0"
                  style={{ backgroundColor: actC[a.type] + "15", color: actC[a.type] }}
                >
                  {a.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-300 leading-relaxed">{a.text}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: actC[a.type] + "80" }}>
                    {a.t} ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GsCard>
      </div>

      {/* Recent matches */}
      <GsCard>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-semibold text-sm text-white">Recent Tender Matches</h2>
          <GsBadge color="emerald">AI Sourced</GsBadge>
        </div>
        {TENDERS.slice(0, 4).map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{t.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.location} | Due {t.deadline}
              </p>
            </div>
            <p className="text-sm font-mono text-slate-300">{fmt(t.value)}</p>
            <div className="w-20">
              <p className="text-xs font-mono text-center mb-1" style={{ color: t.match >= 90 ? "#00ff87" : "#ffd166" }}>
                {t.match}%
              </p>
              <ProgressBar value={t.match} color={t.match >= 90 ? "#00ff87" : "#ffd166"} />
            </div>
          </div>
        ))}
      </GsCard>
    </div>
  )
}
