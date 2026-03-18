"use client"
// GreenStack AI Auto-Bidding Platform v2.0
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { runAutoBidding, extractTenderFromURL } from "@/app/actions/ai"
import { scoutForTenders, runFullAutoPipeline } from "@/app/actions/tender-scout"
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts"

type Tender = {
  id: string
  title: string
  client: string
  sector: string
  region: string
  value: number
  deadline: string
  ai_score: number
  status: string
  description: string
}

type Bid = {
  id: string
  tender_id: string
  tender_title: string
  value: number
  status: string
  progress: number
  ai_score: number
}

type Activity = {
  id: string
  action: string
  entity_type: string
  created_at: string
}

type PageId = "dashboard" | "tenders" | "bids" | "supply" | "audits" | "settings" | "universe"

const NAV_ITEMS = [
  { id: "dashboard" as PageId, icon: "⬡", label: "Dashboard" },
  { id: "tenders" as PageId, icon: "◈", label: "Tenders" },
  { id: "bids" as PageId, icon: "◎", label: "Bid Builder" },
  { id: "supply" as PageId, icon: "⬢", label: "Supply Chain" },
  { id: "audits" as PageId, icon: "◇", label: "Audits" },
  { id: "settings" as PageId, icon: "⚙", label: "Settings" },
  { id: "universe" as PageId, icon: "✦", label: "Universe", accent: true },
]

const CHART_COLORS = ["#00ff87", "#60efff", "#ffd166", "#c084fc", "#ff6b6b", "#4ecdc4"]

const AGENTS = [
  { id: "scout", name: "Tender Scout", status: "active", queue: 12, icon: "🔍" },
  { id: "writer", name: "Bid Writer", status: "active", queue: 4, icon: "✍️" },
  { id: "supply", name: "Supply Chain", status: "idle", queue: 0, icon: "🔗" },
  { id: "audit", name: "Audit Engine", status: "active", queue: 2, icon: "📊" },
  { id: "winrate", name: "Win Rate AI", status: "learning", queue: 8, icon: "🎯" },
  { id: "risk", name: "Risk Monitor", status: "watching", queue: 3, icon: "⚠️" },
]

export default function GreenStackApp() {
  const [page, setPage] = useState<PageId>("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const [tenders, setTenders] = useState<Tender[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [autoBidRunning, setAutoBidRunning] = useState(false)
  const [autoBidResult, setAutoBidResult] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [scoutRunning, setScoutRunning] = useState(false)
  const [scoutResult, setScoutResult] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      const [tendersRes, bidsRes, activitiesRes] = await Promise.all([
        supabase.from("tenders").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("bids").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
      ])
      if (tendersRes.data) setTenders(tendersRes.data)
      if (bidsRes.data) setBids(bidsRes.data)
      if (activitiesRes.data) setActivities(activitiesRes.data)
      setLoading(false)
    }
    loadData()
  }, [])

  const stats = {
    totalTenders: tenders.length,
    activeBids: bids.filter(b => b.status === "draft" || b.status === "in_progress").length,
    pipelineValue: tenders.reduce((sum, t) => sum + (t.value || 0), 0),
    avgScore: tenders.length > 0 ? Math.round(tenders.reduce((sum, t) => sum + (t.ai_score || 0), 0) / tenders.length) : 0,
    wonBids: bids.filter(b => b.status === "won").length,
    winRate: bids.length > 0 ? Math.round((bids.filter(b => b.status === "won").length / bids.length) * 100) : 0,
  }

  const sectorData = tenders.reduce((acc, t) => {
    const sector = t.sector || "Other"
    const existing = acc.find(x => x.name === sector)
    if (existing) existing.value += 1
    else acc.push({ name: sector, value: 1 })
    return acc
  }, [] as { name: string; value: number }[])

  const pipelineData = [
    { name: "New", value: tenders.filter(t => t.status === "new").length },
    { name: "Reviewing", value: tenders.filter(t => t.status === "reviewing").length },
    { name: "Bidding", value: tenders.filter(t => t.status === "bidding").length },
    { name: "Submitted", value: bids.filter(b => b.status === "submitted").length },
    { name: "Won", value: bids.filter(b => b.status === "won").length },
  ]

  const formatValue = (v: number) => v >= 1000000 ? `£${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `£${(v / 1000).toFixed(0)}K` : `£${v}`

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Tenders", value: stats.totalTenders, color: "#00ff87" },
                { label: "Active Bids", value: stats.activeBids, color: "#60efff" },
                { label: "Pipeline Value", value: formatValue(stats.pipelineValue), color: "#ffd166" },
                { label: "Avg AI Score", value: `${stats.avgScore}%`, color: "#c084fc" },
                { label: "Won Bids", value: stats.wonBids, color: "#00ff87" },
                { label: "Win Rate", value: `${stats.winRate}%`, color: "#60efff" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                  <div className="text-xs text-emerald-500/70 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-4">Pipeline Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3a2f" />
                      <XAxis dataKey="name" stroke="#6ee7b7" fontSize={12} />
                      <YAxis stroke="#6ee7b7" fontSize={12} />
                      <Tooltip contentStyle={{ background: "#0a1a0f", border: "1px solid #065f46" }} />
                      <Bar dataKey="value" fill="#00ff87" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-4">Sector Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sectorData.length ? sectorData : [{ name: "No Data", value: 1 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name }) => name}>
                        {(sectorData.length ? sectorData : [{ name: "No Data", value: 1 }]).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0a1a0f", border: "1px solid #065f46" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-4">Recent Tenders</h3>
                <div className="space-y-3">
                  {tenders.slice(0, 5).map(tender => (
                    <div key={tender.id} className="flex items-center justify-between p-3 bg-[#061208] rounded-lg border border-emerald-900/30">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{tender.title}</div>
                        <div className="text-emerald-500/60 text-sm">{tender.client} - {tender.sector}</div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <div className="text-emerald-400 font-semibold">{formatValue(tender.value || 0)}</div>
                          <div className="text-xs text-emerald-500/60">{tender.region}</div>
                        </div>
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", (tender.ai_score || 0) >= 80 ? "bg-green-500/20 text-green-400" : (tender.ai_score || 0) >= 60 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>
                          {tender.ai_score || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tenders.length === 0 && <div className="text-emerald-500/50 text-center py-8">No tenders yet. Add your first tender to get started.</div>}
                </div>
              </div>
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-4">AI Activity</h3>
                <div className="space-y-3">
                  {activities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#061208] rounded-lg border border-emerald-900/30">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 animate-pulse" />
                      <div>
                        <div className="text-white">{activity.action}</div>
                        <div className="text-emerald-500/60 text-sm">{new Date(activity.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && <div className="text-emerald-500/50 text-center py-8">AI agents are ready and waiting for tenders.</div>}
                </div>
              </div>
            </div>
          </div>
        )

      case "tenders":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Tender Pipeline</h2>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">+ Add Tender</button>
            </div>
            <div className="grid gap-4">
              {tenders.map(tender => (
                <div key={tender.id} className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 hover:border-emerald-500/50 transition cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold text-lg">{tender.title}</h3>
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", tender.status === "new" ? "bg-blue-500/20 text-blue-400" : tender.status === "reviewing" ? "bg-yellow-500/20 text-yellow-400" : tender.status === "bidding" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400")}>{tender.status}</span>
                      </div>
                      <div className="text-emerald-500/70 mt-1">{tender.client}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-emerald-500/60">
                        <span>{tender.sector}</span>
                        <span>{tender.region}</span>
                        <span>Due: {tender.deadline ? new Date(tender.deadline).toLocaleDateString() : "TBD"}</span>
                      </div>
                      {tender.description && <p className="text-emerald-500/50 mt-2 text-sm line-clamp-2">{tender.description}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-emerald-400">{formatValue(tender.value || 0)}</div>
                      <div className={cn("mt-2 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto", (tender.ai_score || 0) >= 80 ? "bg-green-500/20 text-green-400 ring-2 ring-green-500/50" : (tender.ai_score || 0) >= 60 ? "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/50" : "bg-red-500/20 text-red-400 ring-2 ring-red-500/50")}>{tender.ai_score || 0}</div>
                      <div className="text-xs text-emerald-500/60 mt-1">AI Match</div>
                    </div>
                  </div>
                </div>
              ))}
              {tenders.length === 0 && (
                <div className="text-center py-16 bg-[#0a1a0f] border border-emerald-900/50 rounded-xl">
                  <div className="text-4xl mb-4">◈</div>
                  <div className="text-emerald-500/50">No tenders in your pipeline yet</div>
                  <button className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">Add Your First Tender</button>
                </div>
              )}
            </div>
          </div>
        )

      case "bids":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Bid Builder</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-4">Your Bids</h3>
                <div className="space-y-2">
                  {bids.map(bid => (
                    <div key={bid.id} className="p-3 bg-[#061208] rounded-lg border border-emerald-900/30 hover:border-emerald-500/50 cursor-pointer transition">
                      <div className="text-white font-medium truncate">{bid.tender_title || "Untitled"}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={cn("px-2 py-0.5 rounded text-xs", bid.status === "draft" ? "bg-gray-500/20 text-gray-400" : bid.status === "in_progress" ? "bg-blue-500/20 text-blue-400" : bid.status === "submitted" ? "bg-emerald-500/20 text-emerald-400" : bid.status === "won" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>{bid.status}</span>
                        <span className="text-emerald-400 text-sm">{bid.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-emerald-900/30 rounded-full h-1.5 mt-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${bid.progress || 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {bids.length === 0 && <div className="text-emerald-500/50 text-center py-8">No bids yet</div>}
                </div>
              </div>
              <div className="md:col-span-2 bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-4">AI Bid Generator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-emerald-500/70 text-sm">Select Tender</label>
                    <select className="w-full mt-1 bg-[#061208] border border-emerald-900/50 rounded-lg p-3 text-white">
                      <option value="">Choose a tender...</option>
                      {tenders.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-emerald-500/70 text-sm">Additional Context</label>
                    <textarea className="w-full mt-1 bg-[#061208] border border-emerald-900/50 rounded-lg p-3 text-white h-32 resize-none" placeholder="Add any specific requirements or company strengths to include..." />
                  </div>
                  <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
                    <span>✦</span> Generate AI Bid
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "supply":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Supply Chain</h2>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">+ Add Contractor</button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "EcoInstall Ltd", specialty: "Heat Pumps", rating: 4.8, jobs: 47, score: 94 },
                { name: "GreenBuild Co", specialty: "Solar PV", rating: 4.6, jobs: 32, score: 89 },
                { name: "Sustainable HVAC", specialty: "BEMS", rating: 4.5, jobs: 28, score: 85 },
                { name: "Carbon Zero Electrical", specialty: "EV Charging", rating: 4.7, jobs: 41, score: 91 },
                { name: "EcoRetrofit Partners", specialty: "Insulation", rating: 4.4, jobs: 23, score: 82 },
                { name: "Net Zero Plumbing", specialty: "Heat Networks", rating: 4.3, jobs: 19, score: 78 },
              ].map((contractor, i) => (
                <div key={i} className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 hover:border-emerald-500/50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{contractor.name}</h3>
                      <div className="text-emerald-500/70 text-sm">{contractor.specialty}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">{contractor.score}</div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1 text-yellow-400"><span>★</span> {contractor.rating}</div>
                    <div className="text-emerald-500/60">{contractor.jobs} jobs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "audits":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Site Audits</h2>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">+ New Audit</button>
            </div>
            <div className="grid gap-4">
              {[
                { client: "Manchester Council", type: "Energy Assessment", date: "2024-01-15", status: "Complete", score: 87 },
                { client: "NHS Trust Birmingham", type: "Carbon Audit", date: "2024-01-12", status: "In Progress", score: null },
                { client: "Leeds University", type: "Retrofit Survey", date: "2024-01-10", status: "Complete", score: 92 },
              ].map((audit, i) => (
                <div key={i} className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{audit.client}</h3>
                    <div className="text-emerald-500/70 text-sm">{audit.type}</div>
                    <div className="text-emerald-500/50 text-xs mt-1">{audit.date}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("px-3 py-1 rounded text-sm", audit.status === "Complete" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400")}>{audit.status}</span>
                    {audit.score && <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">{audit.score}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-white">Auto-Bid Settings</h2>
            
            {/* Scout for Tenders - AI searches the web */}
            <div className="bg-gradient-to-r from-blue-900/50 to-cyan-800/30 border border-cyan-500/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Scout for Tenders</h3>
                  <p className="text-cyan-400/80 text-sm mt-1">AI searches Contracts Finder, Find a Tender, and other UK portals for matching opportunities</p>
                </div>
                <button 
                  onClick={async () => {
                    setScoutRunning(true)
                    setScoutResult(null)
                    try {
                      const result = await scoutForTenders({
                        user_id: user?.id || '',
                        sectors: ['Healthcare', 'Education', 'Local Government', 'Housing', 'Energy'],
                        capabilities: ['Energy Audits', 'Solar PV', 'Heat Pumps', 'BEMS', 'LED Retrofits', 'Decarbonisation'],
                        max_value: 5000000
                      })
                      setScoutResult(result)
                      // Refresh tenders list
                      const { data } = await supabase.from("tenders").select("*").order("created_at", { ascending: false }).limit(20)
                      if (data) setTenders(data)
                    } catch (err) {
                      console.error('Scout error:', err)
                      setScoutResult({ found: 0, added: 0, message: 'Error scouting for tenders' })
                    }
                    setScoutRunning(false)
                  }}
                  disabled={scoutRunning}
                  className={cn(
                    "px-6 py-3 rounded-lg font-bold text-white transition flex items-center gap-2",
                    scoutRunning ? "bg-cyan-700 cursor-wait" : "bg-cyan-500 hover:bg-cyan-400"
                  )}
                >
                  {scoutRunning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <span>🔍</span> Scout Now
                    </>
                  )}
                </button>
              </div>
              {scoutResult && (
                <div className="mt-4 p-4 bg-[#061208] rounded-lg">
                  <p className="text-cyan-400 font-semibold">Found {scoutResult.found} tenders, added {scoutResult.added} new to database</p>
                  {scoutResult.tenders?.slice(0, 5).map((t: any, i: number) => (
                    <div key={i} className="text-sm text-cyan-300/80 mt-2">
                      + {t.title} ({t.source_portal}) - £{t.value?.toLocaleString() || 'TBC'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Run Auto-Bidding Now */}
            <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 border border-emerald-500/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Run Auto-Bidding Now</h3>
                  <p className="text-emerald-400/80 text-sm mt-1">AI will scan your tenders, score them, and auto-generate bids for matches above threshold</p>
                </div>
                <button 
                  onClick={async () => {
                    setAutoBidRunning(true)
                    setAutoBidResult(null)
                    try {
                      const result = await runAutoBidding({
                        user_id: user?.id || '',
                        match_threshold: 65,
                        capabilities: ['Energy Audits', 'Solar PV', 'Heat Pumps', 'BEMS', 'LED Retrofits'],
                        max_bid_value: 5000000,
                        sectors: ['Healthcare', 'Education', 'Local Government', 'Housing'],
                        notify_on_bid: true
                      })
                      setAutoBidResult(result)
                    } catch (err) {
                      console.error('Auto-bidding error:', err)
                      setAutoBidResult({ results: [], message: 'Error running auto-bidding' })
                    }
                    setAutoBidRunning(false)
                  }}
                  disabled={autoBidRunning}
                  className={cn(
                    "px-6 py-3 rounded-lg font-bold text-white transition flex items-center gap-2",
                    autoBidRunning ? "bg-emerald-700 cursor-wait" : "bg-emerald-500 hover:bg-emerald-400"
                  )}
                >
                  {autoBidRunning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Run Now
                    </>
                  )}
                </button>
              </div>
              {autoBidResult && (
                <div className="mt-4 p-4 bg-[#061208] rounded-lg">
                  <p className="text-emerald-400 font-semibold">{autoBidResult.message}</p>
                  {autoBidResult.results?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {autoBidResult.results.map((r: any, i: number) => (
                        <div key={i} className="text-sm text-emerald-300/80">
                          ✓ Bid submitted for "{r.tenderTitle}" (Score: {r.matchScore}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Enable Auto-Bidding</h3>
                  <p className="text-emerald-500/60 text-sm">AI will automatically create bids for matching tenders</p>
                </div>
                <button className="w-14 h-8 bg-emerald-600 rounded-full relative"><div className="w-6 h-6 bg-white rounded-full absolute right-1 top-1" /></button>
              </div>
              <div>
                <label className="text-white font-semibold">Minimum Match Score</label>
                <p className="text-emerald-500/60 text-sm mb-2">Only bid on tenders with AI score above this threshold</p>
                <input type="range" min="0" max="100" defaultValue="65" className="w-full accent-emerald-500" />
                <div className="flex justify-between text-emerald-500/60 text-sm"><span>0%</span><span className="text-emerald-400 font-semibold">65%</span><span>100%</span></div>
              </div>
              <div>
                <label className="text-white font-semibold">Preferred Sectors</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Healthcare", "Education", "Local Government", "Housing", "Transport", "Energy"].map(sector => (
                    <button key={sector} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition">{sector}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white font-semibold">Max Bid Value</label>
                <input type="text" defaultValue="£5,000,000" className="w-full mt-2 bg-[#061208] border border-emerald-900/50 rounded-lg p-3 text-white" />
              </div>
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition">Save Settings</button>
            </div>
          </div>
        )

      case "universe":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">AI Agent Universe</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENTS.map(agent => (
                <div key={agent.id} className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 hover:border-emerald-500/50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{agent.icon}</div>
                      <div>
                        <h3 className="text-white font-semibold">{agent.name}</h3>
                        <div className={cn("text-sm flex items-center gap-2", agent.status === "active" ? "text-green-400" : agent.status === "learning" ? "text-yellow-400" : agent.status === "watching" ? "text-blue-400" : "text-gray-400")}>
                          <span className={cn("w-2 h-2 rounded-full", agent.status === "active" ? "bg-green-400 animate-pulse" : agent.status === "learning" ? "bg-yellow-400 animate-pulse" : agent.status === "watching" ? "bg-blue-400" : "bg-gray-400")} />
                          {agent.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{agent.queue}</div>
                      <div className="text-emerald-500/60 text-xs">in queue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-4">Swarm Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-[#061208] rounded-lg"><div className="text-3xl font-bold text-emerald-400">{stats.totalTenders}</div><div className="text-emerald-500/60 text-sm">Tenders Scanned</div></div>
                <div className="p-4 bg-[#061208] rounded-lg"><div className="text-3xl font-bold text-emerald-400">{stats.activeBids}</div><div className="text-emerald-500/60 text-sm">Bids Generated</div></div>
                <div className="p-4 bg-[#061208] rounded-lg"><div className="text-3xl font-bold text-emerald-400">{stats.avgScore}%</div><div className="text-emerald-500/60 text-sm">Avg Match Rate</div></div>
                <div className="p-4 bg-[#061208] rounded-lg"><div className="text-3xl font-bold text-emerald-400">{stats.winRate}%</div><div className="text-emerald-500/60 text-sm">Win Rate</div></div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#030808] text-white flex">
      {menuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={cn("fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#051210] border-r border-emerald-900/50 flex flex-col transition-transform duration-300", menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
        <div className="p-4 border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">G</div>
            <div><div className="font-bold text-white">GreenStack</div><div className="text-xs text-emerald-500/60">AI Tender Platform</div></div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setMenuOpen(false); }} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left", page === item.id ? "bg-emerald-500/20 text-emerald-400" : "text-emerald-500/70 hover:bg-emerald-500/10 hover:text-emerald-400", item.accent && "text-emerald-400")}>
              <span className="text-lg">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-emerald-900/50"><div className="text-xs text-emerald-500/50">GreenStack AI v1.0</div></div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-[#030808]/95 backdrop-blur border-b border-emerald-900/50 px-4 py-3 flex items-center justify-between">
          <button className="md:hidden p-2 text-emerald-400" onClick={() => setMenuOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-emerald-400 font-semibold capitalize">{page}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-emerald-500/70 text-sm">AI Active</span></div>
        </header>
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div> : renderPage()}
        </div>
      </main>
    </div>
  )
}
