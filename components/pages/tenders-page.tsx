"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { GsCard, GsBadge, StatCard, DetailPanel, FilterBar, ProgressBar, PulseDot, ScoreRing, AIChatWidget } from "@/components/greenstack-ui"
import { TENDERS, STATUS_MAP, fmt } from "@/lib/data"

type SortKey = "title" | "value" | "match" | "deadline"
type SortDir = "asc" | "desc"

export default function TendersPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [filter, setFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("match")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const sectors = ["all", "Aviation", "Local Authority", "Healthcare", "Education", "Utilities", "Transport"]
  const statuses = ["all", "found", "reviewing", "sourcing", "bidding", "submitted"]

  const filtered = useMemo(() => {
    let data = TENDERS.filter(
      (t) =>
        (filter === "all" || t.sector === filter) &&
        (statusFilter === "all" || t.status === statusFilter) &&
        (search === "" || t.title.toLowerCase().includes(search.toLowerCase()))
    )
    data.sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else if (sortKey === "value") cmp = a.value - b.value
      else if (sortKey === "match") cmp = a.match - b.match
      else if (sortKey === "deadline") cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      return sortDir === "desc" ? -cmp : cmp
    })
    return data
  }, [filter, statusFilter, search, sortKey, sortDir])

  const selected = useMemo(() => TENDERS.find((t) => t.id === selectedId) || null, [selectedId])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const totalPipeline = TENDERS.reduce((s, t) => s + t.value, 0)
  const avgMatch = Math.round(TENDERS.reduce((s, t) => s + t.match, 0) / TENDERS.length)
  const closingThisWeek = TENDERS.filter((t) => {
    const d = new Date(t.deadline)
    const now = new Date()
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7 && diff >= 0
  }).length

  const SortHeader = ({ label, sortId }: { label: string; sortId: SortKey }) => (
    <button
      onClick={() => toggleSort(sortId)}
      className={cn(
        "flex items-center gap-1 text-xs font-mono uppercase tracking-widest transition-colors",
        sortKey === sortId ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {label}
      {sortKey === sortId && (
        <span className="text-emerald-400">{sortDir === "desc" ? "\u2193" : "\u2191"}</span>
      )}
    </button>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tender Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">AI monitoring {TENDERS.length} live opportunities</p>
        </div>
        <div className="flex items-center gap-2">
          <PulseDot size={1.5} />
          <span className="text-xs font-mono text-emerald-400">LIVE SCANNING</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pipeline Value" value={fmt(totalPipeline)} delta="+18% this quarter" color="#00ff87" />
        <StatCard label="Active Tenders" value={TENDERS.length.toString()} delta={`${TENDERS.filter(t => t.status === "found").length} newly found`} color="#60efff" />
        <StatCard label="Avg Match Score" value={`${avgMatch}%`} delta="+4% vs last month" color="#ffd166" />
        <StatCard label="Closing This Week" value={closingThisWeek.toString()} delta="Requires immediate action" color="#c084fc" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filters={sectors}
          activeFilter={filter}
          onFilterChange={setFilter}
          placeholder="Search tenders..."
        />
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-600 font-mono mr-1 self-center">STATUS:</span>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                statusFilter === s
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                  : "bg-white/[0.03] text-slate-500 border border-white/5 hover:bg-white/5"
              )}
            >
              {s === "all" ? "All" : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <GsCard>
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_100px_100px_100px_80px] gap-4 px-6 py-3 border-b border-white/5">
          <SortHeader label="Tender" sortId="title" />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Sector</span>
          <SortHeader label="Value" sortId="value" />
          <SortHeader label="Match" sortId="match" />
          <SortHeader label="Deadline" sortId="deadline" />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Status</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500">No tenders match your filters</p>
          </div>
        )}
        {filtered.map((t) => {
          const sm = STATUS_MAP[t.status]
          const isSelected = selectedId === t.id
          return (
            <div
              key={t.id}
              onClick={() => setSelectedId(isSelected ? null : t.id)}
              className={cn(
                "grid grid-cols-[1fr_120px_100px_100px_100px_80px] gap-4 px-6 py-4 border-b border-white/5 last:border-0 cursor-pointer transition-all duration-200",
                isSelected
                  ? "bg-emerald-500/[0.06] border-l-2 border-l-emerald-500"
                  : "hover:bg-white/[0.02]"
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{t.location}</p>
              </div>
              <div className="flex items-center">
                <GsBadge color={
                  t.sector === "Aviation" ? "emerald"
                    : t.sector === "Healthcare" ? "purple"
                    : t.sector === "Education" ? "yellow"
                    : t.sector === "Utilities" ? "yellow"
                    : t.sector === "Transport" ? "red"
                    : "cyan"
                }>
                  {t.sector}
                </GsBadge>
              </div>
              <p className="text-sm font-mono text-slate-300 self-center">{fmt(t.value)}</p>
              <div className="flex items-center gap-2">
                <div className="w-10">
                  <ProgressBar value={t.match} color={t.match >= 90 ? "#00ff87" : "#ffd166"} />
                </div>
                <span className="text-xs font-mono" style={{ color: t.match >= 90 ? "#00ff87" : "#ffd166" }}>{t.match}%</span>
              </div>
              <p className="text-xs text-slate-400 self-center font-mono">{t.deadline}</p>
              <div className="flex items-center">
                <GsBadge color={sm?.color || "slate"}>{sm?.label || t.status}</GsBadge>
              </div>
            </div>
          )
        })}
      </GsCard>

      {/* Detail Panel */}
      <DetailPanel
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.title}
        subtitle={selected ? `${selected.sector} | ${selected.location}` : undefined}
      >
        {selected && (
          <div className="space-y-5">
            {/* Score ring */}
            <div className="flex items-center gap-4">
              <ScoreRing score={selected.match} size={64} />
              <div>
                <p className="text-sm font-medium text-white">AI Match Score</p>
                <p className="text-xs text-slate-500 mt-0.5">Based on capability, experience, and pricing analysis</p>
              </div>
            </div>

            {/* Key info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 bg-white/[0.03] border border-white/5">
                <p className="text-xs text-slate-500 mb-1">Contract Value</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{fmt(selected.value)}</p>
              </div>
              <div className="rounded-xl p-3 bg-white/[0.03] border border-white/5">
                <p className="text-xs text-slate-500 mb-1">Deadline</p>
                <p className="text-lg font-bold font-mono text-cyan-400">{selected.deadline}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
            </div>

            {/* Requirements */}
            {selected.requirements && (
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Requirements</p>
                <div className="space-y-1.5">
                  {selected.requirements.map((r) => (
                    <div key={r} className="flex items-center gap-2">
                      <span className="text-emerald-400 text-xs">{">"}</span>
                      <span className="text-xs text-slate-400">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {selected.timeline && (
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Timeline</p>
                <p className="text-sm text-slate-300">{selected.timeline}</p>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {selected.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/5">{tag}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <button className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all">
                Start Bid {"\u2192"}
              </button>
              {["Source Contractors", "Run Feasibility Check", "Export Brief"].map((a) => (
                <button
                  key={a}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/5 border border-white/5 text-xs text-slate-400 hover:text-slate-200 transition-all"
                >
                  {a}
                </button>
              ))}
            </div>

            {/* AI Chat */}
            <div className="pt-3 border-t border-white/5">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <PulseDot size={1.5} />
                AI Analysis
              </p>
              <AIChatWidget
                placeholder={`Ask about ${selected.title}...`}
                systemPrompt={`You are GreenStack AI analysing the tender: "${selected.title}" worth ${fmt(selected.value)} in ${selected.location}. Sector: ${selected.sector}. Match score: ${selected.match}%.`}
              />
            </div>
          </div>
        )}
      </DetailPanel>
    </div>
  )
}
