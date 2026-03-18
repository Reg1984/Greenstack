"use client"

import { useState } from "react"
import { GsCard, StatCard, GsBadge, ProgressBar } from "@/components/greenstack-ui"

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false)
  const [reportContent, setReportContent] = useState("")

  const kpis = [
    { label: "Total Bids", value: "47", color: "#00ff87" },
    { label: "Won", value: "16", color: "#60efff" },
    { label: "Win Rate", value: "34%", color: "#ffd166" },
    { label: "Pipeline", value: "£2.4M", color: "#c084fc" },
  ]

  const recentReports = [
    { id: 1, title: "Q1 2026 Performance Report", date: "15 Mar 2026", type: "Quarterly" },
    { id: 2, title: "February Bid Analysis", date: "01 Mar 2026", type: "Monthly" },
    { id: 3, title: "Carbon Reduction Summary", date: "20 Feb 2026", type: "ESG" },
  ]

  const generateReport = async () => {
    setGenerating(true)
    setReportContent("")
    
    await new Promise(r => setTimeout(r, 2000))
    
    setReportContent(`# Q1 2026 Performance Report

## Executive Summary
GreenStack AI has processed 47 tenders in Q1 2026, submitting 32 competitive bids with a 34% win rate.

## Key Metrics
- **Total Pipeline Value:** £2.4M
- **Bids Won:** 16
- **Average Bid Value:** £150K
- **AI Match Accuracy:** 89%

## Sector Performance
- Aviation: 94% match rate, £890K pipeline
- Local Authority: 78% match rate, £650K pipeline
- Healthcare: 62% match rate, £420K pipeline

## Recommendations
1. Expand into Transport sector
2. Increase AI bid automation to 80%
3. Add 4 new preferred suppliers`)
    
    setGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">AI-generated performance analytics</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Report"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <StatCard key={i} label={kpi.label} value={kpi.value} delta="" color={kpi.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GsCard className="lg:col-span-2 p-6">
          <h2 className="font-semibold text-white mb-4">Report Output</h2>
          {reportContent ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-white/5 p-4 rounded-lg">
                {reportContent}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Click "Generate Report" to create an AI-powered performance analysis</p>
            </div>
          )}
        </GsCard>

        <GsCard className="p-6">
          <h2 className="font-semibold text-white mb-4">Recent Reports</h2>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <p className="text-sm text-white font-medium">{report.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{report.date}</span>
                  <GsBadge color="cyan">{report.type}</GsBadge>
                </div>
              </div>
            ))}
          </div>
        </GsCard>
      </div>
    </div>
  )
}
