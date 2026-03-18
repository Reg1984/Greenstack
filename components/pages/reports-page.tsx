'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { GsCard, PulseDot } from '@/components/greenstack-ui'
import { getReports, createReport, getDashboardStats } from '@/app/actions/database'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const reportTypes = ['Q1 2026 Performance Report', 'AI Bid Optimisation Analysis', 'Supply Chain Health Check', 'Carbon Impact Summary', 'Win Rate Deep Dive', 'Revenue Forecast Q2 2026']
const timeSeriesData = [
  { month: 'Jan', bids: 45, won: 14, revenue: 95 },
  { month: 'Feb', bids: 58, won: 18, revenue: 142 },
  { month: 'Mar', bids: 80, won: 30, revenue: 183 },
]
const sectorData = [
  { name: 'Aviation', value: 45, fill: '#00ff87' },
  { name: 'Local Authority', value: 30, fill: '#60efff' },
  { name: 'Healthcare', value: 15, fill: '#a78bfa' },
  { name: 'Utilities', value: 10, fill: '#ffd166' },
]
const bidPerformanceData = [
  { name: 'AI Bids', 'Win Rate': 41 },
  { name: 'Manual Bids', 'Win Rate': 24 },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState('Q1 2026 Performance Report')
  const [period, setPeriod] = useState('Q1 2026')
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState('')
  const [mounted, setMounted] = useState(false)

  const { data: stats } = useSWR('dashboard-stats', () => getDashboardStats(), { revalidateOnFocus: false })

  const kpiItems = [
    { label: 'Total Bids', value: stats?.totalBids?.toString() || '0', color: '#00ff87' },
    { label: 'Won', value: stats?.wonBids?.toString() || '0', color: '#60efff' },
    { label: 'Win Rate', value: `${stats?.winRate || 0}%`, color: '#ffd166' },
    { label: 'Revenue', value: `£${Math.round((stats?.pipelineValue || 0) * 0.34 / 1000)}K`, color: '#c084fc' },
    { label: 'Pipeline', value: `£${((stats?.pipelineValue || 0) / 1000000).toFixed(1)}M`, color: '#00ff87' },
    { label: 'Avg Bid', value: `£${stats?.totalBids ? Math.round((stats?.pipelineValue || 0) / stats.totalBids / 1000) : 0}K`, color: '#60efff' },
  ]

  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
  }, [])

  const generate = async () => {
    setGenerating(true)
    setReport('')
    await new Promise((r) => setTimeout(r, 2200))
    setReport(`## ${reportType}\n\n### Executive Summary\nGreenStack platform performance continues to exceed targets across all key metrics in Q1 2026.\n\n### Key Metrics\n• Total Bids Submitted: 183 (+23% QoQ)\n• Bids Won: 62 (34% win rate)\n• Revenue Generated: £420K (+18% QoQ)\n• Active Pipeline: £2.4M across 47 tenders`)
    try {
      await createReport({
        title: reportType,
        report_type: 'Performance',
        period: period,
        win_rate: `${stats?.winRate || 34}%`,
        total_value: `£${((stats?.pipelineValue || 0) / 1000000).toFixed(1)}M`,
      })
    } catch (e) {
      console.error('Failed to save report:', e)
    }
    setGenerating(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time insights and performance tracking</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {kpiItems.map((item, i) => (
          <GsCard key={i} className="p-4 text-center hover:border-white/10 transition-all">
            <p className="text-xs text-slate-500 mb-2">{item.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: item.color }}>
              {item.value}
            </p>
          </GsCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Report Generation */}
          <GsCard className="p-5">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Generate AI Report</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40"
                >
                  {reportTypes.map((t) => (
                    <option key={t} value={t} className="bg-slate-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Period</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40">
                  {['Q1 2026', 'Q4 2025', 'Last 30 days', 'Last 90 days', 'YTD'].map((p) => (
                    <option key={p} className="bg-slate-900 text-white">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-all disabled:opacity-50"
            >
              {generating ? 'AI Generating...' : 'Generate Report'}
            </button>
          </GsCard>

          {/* Charts */}
          {mounted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GsCard className="p-5">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Bid Submissions</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Line type="monotone" dataKey="bids" stroke="#00ff87" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </GsCard>

            <GsCard className="p-5">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Win Rate Comparison</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bidPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Bar dataKey="Win Rate" fill="#00ff87" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GsCard>

            <GsCard className="p-5">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Pipeline by Sector</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </GsCard>

            <GsCard className="p-5">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Generated Report</p>
              <div className="max-h-48 overflow-y-auto text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                {report || 'Generate a report to see results here'}
              </div>
            </GsCard>
          </div>
          )}
        </div>

        {/* Sidebar */}
        <GsCard className="p-5 h-fit">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <PulseDot size={1.5} />
            Available Reports
          </p>
          <div className="space-y-2 text-xs">
            {reportTypes.map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 border border-white/[0.08] text-slate-400 hover:text-emerald-400 transition-colors text-xs"
              >
                {t}
              </button>
            ))}
          </div>
        </GsCard>
      </div>
    </div>
  )
}
