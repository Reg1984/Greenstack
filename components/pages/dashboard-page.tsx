"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { GsCard, StatCard, PulseDot, AnimNum, ProgressBar, GsBadge } from "@/components/greenstack-ui"
import { getDashboardStats, getActivityLog, getTenders } from "@/app/actions/database"
import { fmt } from "@/lib/data"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const actC: Record<string, string> = { success: "#00ff87", info: "#60efff", found: "#818cf8", learn: "#c084fc", warn: "#ffd166", auto_bid_submitted: "#00ff87" }

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
  const { data: stats } = useSWR('dashboard-stats', () => getDashboardStats(), { revalidateOnFocus: false })
  const { data: activities = [] } = useSWR('activity-log', () => getActivityLog(10), { revalidateOnFocus: false })
  const { data: tenders = [] } = useSWR('tenders', () => getTenders(), { revalidateOnFocus: false })
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
  }, [])

  // Build status breakdown
  const statusBreakdown = [
    { name: "Found", value: tenders.filter(t => t.status === 'found').length, color: "#818cf8" },
    { name: "Reviewing", value: tenders.filter(t => t.status === 'reviewing').length, color: "#ffd166" },
    { name: "Sourcing", value: tenders.filter(t => t.status === 'sourcing').length, color: "#60efff" },
    { name: "Bidding", value: tenders.filter(t => t.status === 'bidding').length, color: "#00ff87" },
    { name: "Submitted", value: tenders.filter(t => t.status === 'submitted').length, color: "#c084fc" },
  ]

  // Calculate sector data
  const sectorData = Array.from(
    tenders.reduce((map, t) => {
      const sector = t.sector || 'General'
      if (!map.has(sector)) {
        map.set(sector, { s: sector, v: 0, a: 0 })
      }
      const data = map.get(sector)!
      data.v += t.value || 0
      return map
    }, new Map<string, any>()).values()
  ).map(item => {
    const maxVal = Math.max(...Array.from(
      tenders.reduce((map, t) => {
        const sector = t.sector || 'General'
        if (!map.has(sector)) {
          map.set(sector, 0)
        }
        map.set(sector, (map.get(sector) || 0) + (t.value || 0))
        return map
      }, new Map()).values())
    ) || 1
    return {
      ...item,
      v: Math.round((item.v / maxVal) * 100),
      a: fmt(item.v)
    }
  })

  // Mock pipeline chart data (in production, this would come from time-series analytics)
  const chartData = [
    { month: 'Jan', value: 1200000 },
    { month: 'Feb', value: 1500000 },
    { month: 'Mar', value: 1800000 },
    { month: 'Apr', value: 2100000 },
    { month: 'May', value: 2400000 },
    { month: 'Jun', value: stats?.pipelineValue || 2400000 },
  ]

  const formatActivityAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'tender_created': 'New tender found',
      'bid_submitted': 'Bid submitted',
      'auto_bid_submitted': 'AI auto-bid submitted',
      'contractor_sourced': 'Contractor sourced',
      'audit_completed': 'Audit completed',
    }
    return actionMap[action] || action
  }

  const getActivityType = (action: string) => {
    if (action.includes('bid_submitted')) return 'success'
    if (action.includes('tender')) return 'found'
    if (action.includes('contractor')) return 'info'
    if (action.includes('audit')) return 'learn'
    return 'info'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-balance">Command Centre</h1>
          <p className="text-sm text-slate-500 mt-1">All systems active | AI agents running</p>
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
        <StatCard label="Live Tenders" value={stats?.totalTenders?.toString() || "0"} delta={`${stats?.activeTenders || 0} active`} color="#00ff87" />
        <StatCard label="Pipeline Value" value={fmt(stats?.pipelineValue || 0)} delta={`${stats?.totalTenders || 0} tenders`} color="#60efff" />
        <StatCard label="Bids Submitted" value={stats?.totalBids?.toString() || "0"} delta={`${stats?.wonBids || 0} won`} color="#ffd166" />
        <StatCard label="Win Rate" value={`${stats?.winRate || 0}%`} delta={`${stats?.wonBids || 0} victories`} color="#c084fc" />
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
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={statusBreakdown.filter(s => s.value > 0)}
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
            {statusBreakdown.filter(s => s.value > 0).map((s) => (
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
          {sectorData.length > 0 ? (
            sectorData.map((row, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <span className="text-xs text-slate-400 w-28 truncate">{row.s}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${row.v}%`, background: "linear-gradient(90deg,#00ff87,#00c86e)" }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400 w-14 text-right">{row.a}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-4">No sector data available</p>
          )}
        </GsCard>

        <GsCard className="p-5">
          <h2 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <PulseDot size={1.5} />
            AI Activity Feed
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {activities.length > 0 ? (
              activities.map((a, i) => {
                const createdAt = new Date(a.created_at)
                const now = new Date()
                const diffMs = now.getTime() - createdAt.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMs / 3600000)
                const diffDays = Math.floor(diffMs / 86400000)
                
                let timeStr = ''
                if (diffMins < 1) timeStr = 'now'
                else if (diffMins < 60) timeStr = `${diffMins}m ago`
                else if (diffHours < 24) timeStr = `${diffHours}h ago`
                else timeStr = `${diffDays}d ago`

                const actionType = getActivityType(a.action)
                
                return (
                  <div key={i} className="flex gap-2.5 group">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono shrink-0"
                      style={{ backgroundColor: actC[actionType] + "15", color: actC[actionType] }}
                    >
                      {actionType === 'success' ? '>' : actionType === 'info' ? '+' : actionType === 'found' ? '*' : '~'}
                    </div>
                    <div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {formatActivityAction(a.action)}: {a.metadata?.tender_title || a.metadata?.entity_id || ''}
                      </p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: actC[actionType] + "80" }}>
                        {timeStr}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-slate-500 py-4">No activity yet</p>
            )}
          </div>
        </GsCard>
      </div>

      {/* Recent matches */}
      <GsCard>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-semibold text-sm text-white">Recent Tender Matches</h2>
          <GsBadge color="emerald">AI Matched</GsBadge>
        </div>
        {tenders.slice(0, 4).map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{t.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.region || 'UK'} | Deadline {t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBC'}
              </p>
            </div>
            <p className="text-sm font-mono text-slate-300">{fmt(t.value || 0)}</p>
            <div className="w-20">
              <p className="text-xs font-mono text-center mb-1" style={{ color: t.ai_score >= 90 ? "#00ff87" : "#ffd166" }}>
                {t.ai_score || 0}%
              </p>
              <ProgressBar value={t.ai_score || 0} color={t.ai_score >= 90 ? "#00ff87" : "#ffd166"} />
            </div>
          </div>
        ))}
        {tenders.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500">No tenders yet</p>
          </div>
        )}
      </GsCard>
    </div>
  )
}
