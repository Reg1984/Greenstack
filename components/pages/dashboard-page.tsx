"use client"

import { useState, useEffect } from "react"
import { GsCard, StatCard, PulseDot, AnimNum, ProgressBar, GsBadge } from "@/components/greenstack-ui"
import { TENDERS, PIPELINE_MONTHLY, fmt } from "@/lib/data"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const activity = [
  { t: "2m", text: "Bid submitted: Manchester Airport Carbon Offset", type: "success", icon: ">" },
  { t: "14m", text: "3 contractors sourced for Leeds LED Retrofit", type: "info", icon: "+" },
  { t: "1h", text: "New tender found: Liverpool Port", type: "found", icon: "*" },
  { t: "2h", text: "AI bid style updated - win rate improved", type: "learn", icon: "~" },
  { t: "3h", text: "Contractor flagged: SolarEdge North - insurance expiring", type: "warn", icon: "!" },
]

const actC: Record<string, string> = { success: "#00ff87", info: "#60efff", found: "#818cf8", learn: "#c084fc", warn: "#ffd166" }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(2,10,20,0.95)", border: "1px solid rgba(0,255,135,0.2)" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-mono font-bold text-emerald-400">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const { user } = useUser()
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { tenders, isLoading: tendersLoading } = useTenders()
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
  }, [])

  // Use real data if authenticated, otherwise use demo data
  const isDemo = !user
  const displayTenders = isDemo ? TENDERS : tenders.map(t => ({
    id: t.id,
    title: t.title,
    location: t.region || 'UK',
    deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'TBC',
    value: t.value || 0,
    match: t.ai_score || Math.floor(Math.random() * 30) + 70,
    sector: t.sector || 'General',
    status: t.status,
  }))

  // Calculate status breakdown from real data
  const statusBreakdown = isDemo 
    ? [
        { name: "Found", value: 4, color: "#818cf8" },
        { name: "Reviewing", value: 1, color: "#ffd166" },
        { name: "Sourcing", value: 1, color: "#60efff" },
        { name: "Bidding", value: 1, color: "#00ff87" },
        { name: "Submitted", value: 1, color: "#c084fc" },
      ]
    : [
        { name: "Found", value: tenders.filter(t => t.status === 'found').length || 0, color: "#818cf8" },
        { name: "Reviewing", value: tenders.filter(t => t.status === 'reviewing').length || 0, color: "#ffd166" },
        { name: "Sourcing", value: tenders.filter(t => t.status === 'sourcing').length || 0, color: "#60efff" },
        { name: "Bidding", value: tenders.filter(t => t.status === 'bidding').length || 0, color: "#00ff87" },
        { name: "Submitted", value: tenders.filter(t => t.status === 'submitted').length || 0, color: "#c084fc" },
      ].filter(s => s.value > 0)

  // Pipeline by sector
  const sectorData = isDemo
    ? [
        { s: "Aviation", v: 94, a: fmt(2100000) },
        { s: "Local Authority", v: 78, a: fmt(1800000) },
        { s: "Healthcare", v: 62, a: fmt(1200000) },
        { s: "Utilities", v: 71, a: fmt(1500000) },
        { s: "Education", v: 45, a: fmt(840000) },
      ]
    : Object.entries(
        tenders.reduce((acc, t) => {
          const sector = t.sector || 'Other'
          acc[sector] = (acc[sector] || 0) + (t.value || 0)
          return acc
        }, {} as Record<string, number>)
      )
        .map(([s, value]) => ({
          s,
          v: Math.min(100, Math.round((value / (stats?.pipelineValue || 1)) * 100)),
          a: fmt(value),
        }))
        .slice(0, 6)

  const chartData = PIPELINE_MONTHLY.map((d) => ({ ...d }))

  // Stats values
  const totalTenders = stats?.totalTenders ?? 47
  const pipelineValue = stats?.pipelineValue ?? 2400000
  const totalBids = stats?.totalBids ?? 183
  const winRate = stats?.winRate ?? 34

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-balance">Command Centre</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isDemo ? "Demo Mode | Sign in to access your data" : "All systems active | AI agents running"}
          </p>
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
        <StatCard label="Live Tenders" value={<AnimNum value={totalTenders} />} delta={isDemo ? "+12 this week" : `${stats?.activeTenders || 0} active`} color="#00ff87" />
        <StatCard label="Pipeline Value" value={fmt(pipelineValue)} delta={isDemo ? "+340K this week" : "total value"} color="#60efff" />
        <StatCard label="Bids Submitted" value={<AnimNum value={totalBids} />} delta={isDemo ? "+8 today" : `${stats?.wonBids || 0} won`} color="#ffd166" />
        <StatCard label="Win Rate" value={`${winRate}%`} delta={isDemo ? "+4% vs last month" : "all time"} color="#c084fc" />
      </div>

      {/* Charts row */}
      {mounted && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GsCard className="lg:col-span-2 p-6">
          <h2 className="font-semibold text-sm text-white mb-1">Pipeline Growth</h2>
          <p className="text-xs text-slate-500 mb-4">Total pipeline value over 6 months</p>
          <div style={{ width: '100%', height: 208 }}>
            <ResponsiveContainer width="100%" height={208}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#00ff87" strokeWidth={2} fill="url(#pipelineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GsCard>

        <GsCard className="p-6">
          <h2 className="font-semibold text-sm text-white mb-1">Tender Status</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown by current stage</p>
          <div style={{ width: '100%', height: 160 }} className="flex items-center justify-center">
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
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
            ) : (
              <p className="text-xs text-slate-500">No tenders yet</p>
            )}
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
      )}

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GsCard className="lg:col-span-2 p-6">
          <h2 className="font-semibold text-sm text-white mb-4">Pipeline by Sector</h2>
          {sectorData.length > 0 ? sectorData.map((row, i) => (
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
          )) : (
            <p className="text-sm text-slate-500">Add tenders to see pipeline breakdown</p>
          )}
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
          <GsBadge color="emerald">{isDemo ? "Demo Data" : "Your Tenders"}</GsBadge>
        </div>
        {displayTenders.length > 0 ? displayTenders.slice(0, 4).map((t) => (
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
        )) : (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No tenders yet. Add your first tender to get started.</p>
          </div>
        )}
      </GsCard>
    </div>
  )
}
