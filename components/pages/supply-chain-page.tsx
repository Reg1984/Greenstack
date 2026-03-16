'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GsCard, GsBadge, ScoreRing, AIChatWidget, StatCard, FilterBar } from '@/components/greenstack-ui'
import { CONTRACTORS } from '@/lib/data'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

const statusC: Record<string, string> = { preferred: 'emerald', active: 'cyan', flagged: 'red' }

export default function SupplyChainPage() {
  const [selected, setSelected] = useState<(typeof CONTRACTORS)[number] | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
    id: c.id,
    name: c.name,
    specialty: c.specialty || 'General',
    region: c.region || 'UK',
    score: c.score || 75,
    rating: c.rating || 4.0,
    jobs: c.jobs || 0,
    onTime: c.on_time || 95,
    status: c.status || 'active',
    accreditations: c.accreditations || [],
    insurance: c.insurance || 'Valid',
  }))

  const [selected, setSelected] = useState<(typeof allContractors)[number] | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newContractor, setNewContractor] = useState({ name: '', specialty: '', region: '', score: '' })
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
  }, [])
  
  const handleAddContractor = async () => {
    if (!newContractor.name.trim()) return
    try {
      await createContractor({
        name: newContractor.name,
        specialty: newContractor.specialty || undefined,
        region: newContractor.region || undefined,
        score: newContractor.score ? parseInt(newContractor.score) : 75,
      })
      mutate()
      setShowAddModal(false)
      setNewContractor({ name: '', specialty: '', region: '', score: '' })
    } catch (e) {
      console.error('Failed to add contractor:', e)
    }
  }

  const filtered = allContractors.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.specialty.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      activeFilter === 'all' || activeFilter === c.status || (activeFilter === 'high-score' && c.score >= 80)
    return matchesSearch && matchesFilter
  })

  const radarData = selected
    ? [
        { name: 'Quality', value: selected.score },
        { name: 'Delivery', value: selected.onTime },
        { name: 'Rating', value: selected.rating * 20 },
        { name: 'Experience', value: Math.min(selected.jobs, 100) },
        { name: 'Compliance', value: selected.accreditations.length * 15 },
      ]
    : []

  const aiSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults('')
    await new Promise((r) => setTimeout(r, 1800))
    setResults(`## Contractor Sourcing Results: "${query}"

**Recommended Contractor Types:**
• MCS-certified installers with commercial experience
• TrustMark-registered for quality assurance
• CIBSE-accredited for building services

**Key Accreditations Required:**
• MCS (Microgeneration Certification Scheme)
• TrustMark Government-endorsed standards
• NICEIC for electrical installations
• Gas Safe Register (if applicable)

**Typical UK Pricing (2026):**
• Day rate: £450–£750 per engineer
• Project management: 8–12% of contract value
• Materials markup: 15–20%

**Vetting Checklist:**
✓ Valid insurance (public liability £5M minimum)
✓ References from 3+ similar projects
✓ Financial health check (Dun & Bradstreet)
✓ H&S policy and RAMS documentation
✓ Environmental management policy

**Red Flags:**
⚠ Insurance expiring within 30 days
⚠ No TrustMark registration
⚠ On-time delivery below 85%
⚠ Fewer than 5 completed projects`)
    setSearching(false)
  }

  const preferredCount = filtered.filter((c) => c.status === 'preferred').length
  const avgScore = Math.round(filtered.reduce((sum, c) => sum + c.score, 0) / filtered.length)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Supply Chain</h1>
          <p className="text-sm text-slate-500 mt-1">{isDemo ? 'Demo: Sample contractors' : `Tracking ${allContractors.length} contractors`}</p>
        </div>
        {!isDemo && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all"
          >
            + Add Contractor
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Contractors" value={filtered.length} color="#00ff87" />
        <StatCard label="Avg Score" value={`${avgScore}/100`} color="#60efff" />
        <StatCard label="Preferred" value={preferredCount} delta={`${Math.round((preferredCount / filtered.length) * 100)}% of total`} color="#a78bfa" />
      </div>

      {/* AI Search */}
      <GsCard className="p-5" glow>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">AI Contractor Sourcing</p>
        <div className="flex gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aiSearch()}
            placeholder="e.g. 'Solar PV installer Yorkshire' or 'BEMS contractor National'..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
          />
          <button
            onClick={aiSearch}
            disabled={searching || !query.trim()}
            className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-40"
          >
            {searching ? 'Searching...' : 'AI Search'}
          </button>
        </div>
        {(searching || results) && (
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            {searching ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 animate-pulse">Scanning contractor databases, reviews, accreditations...</p>
                {[80, 65, 90, 50].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded bg-white/5 animate-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{results}</div>
            )}
          </div>
        )}
      </GsCard>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filters={['all', 'preferred', 'active', 'flagged', 'high-score']}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        placeholder="Search contractors by name or specialty..."
      />

      {/* Main Table + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contractors Table */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((c) => {
            const isOpen = selected?.id === c.id
            return (
              <GsCard
                key={c.id}
                className={cn('p-4 cursor-pointer hover:border-white/10 transition-all', isOpen ? 'border-emerald-500/25' : '')}
                glow={isOpen}
                onClick={() => setSelected(isOpen ? null : c)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-background">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500">
                          {c.specialty} • {c.region}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-white">{c.score}%</p>
                      <p className="text-xs text-slate-500">{c.onTime}% on-time</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <ScoreRing score={c.score} size={40} />
                      <GsBadge color={statusC[c.status]}>{c.status}</GsBadge>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <p className="text-xs text-slate-500">Rating</p>
                        <p className="text-sm font-mono font-semibold text-white mt-1">{c.rating}/5 ⭐</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <p className="text-xs text-slate-500">Completed</p>
                        <p className="text-sm font-mono font-semibold text-white mt-1">{c.jobs}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <p className="text-xs text-slate-500">Insurance</p>
                        <p className={cn('text-sm font-mono font-semibold mt-1', c.insurance === 'Valid' ? 'text-emerald-400' : 'text-red-400')}>
                          {c.insurance === 'Valid' ? '✓' : '✗'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <p className="text-xs text-slate-500">Accreds</p>
                        <p className="text-sm font-mono font-semibold text-white mt-1">{c.accreditations.length}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.accreditations.map((a) => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                          {a}
                        </span>
                      ))}
                    </div>
                    <AIChatWidget placeholder="Ask about this contractor..." systemPrompt={`Contractor: ${c.name}, Specialty: ${c.specialty}, Score: ${c.score}/100`} />
                  </div>
                )}
              </GsCard>
            )
          })}
        </div>

        {/* Right - Radar Chart / Details */}
        <div className="space-y-4">
          {selected ? (
            <>
              <GsCard className="p-5">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Performance Profile</p>
                {mounted && (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar name="Performance" dataKey="value" stroke="#00ff87" fill="#00ff8730" />
                  </RadarChart>
                </ResponsiveContainer>
                )}
              </GsCard>

              <GsCard className="p-5">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quality Score</span>
                    <span className="font-mono text-white">{selected.score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">On-Time Rate</span>
                    <span className="font-mono text-emerald-400">{selected.onTime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Completed Jobs</span>
                    <span className="font-mono text-white">{selected.jobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Insurance Status</span>
                    <span className={cn('font-mono', selected.insurance === 'Valid' ? 'text-emerald-400' : 'text-red-400')}>
                      {selected.insurance}
                    </span>
                  </div>
                </div>
              </GsCard>
            </>
          ) : (
            <GsCard className="p-5 text-center">
              <p className="text-xs text-slate-500">Select a contractor to view detailed performance profile and radar chart</p>
            </GsCard>
          )}
        </div>
      </div>
      
      {/* Add Contractor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <GsCard className="w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Add New Contractor</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Company Name *</label>
                <input
                  value={newContractor.name}
                  onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                  placeholder="e.g. SolarTech Solutions Ltd"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Specialty</label>
                  <input
                    value={newContractor.specialty}
                    onChange={(e) => setNewContractor({ ...newContractor, specialty: e.target.value })}
                    placeholder="e.g. Solar PV, BEMS"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Region</label>
                  <input
                    value={newContractor.region}
                    onChange={(e) => setNewContractor({ ...newContractor, region: e.target.value })}
                    placeholder="e.g. North West"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Initial Score (0-100)</label>
                <input
                  type="number"
                  value={newContractor.score}
                  onChange={(e) => setNewContractor({ ...newContractor, score: e.target.value })}
                  placeholder="75"
                  min="0"
                  max="100"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContractor}
                disabled={!newContractor.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-50"
              >
                Add Contractor
              </button>
            </div>
          </GsCard>
        </div>
      )}
    </div>
  )
}
