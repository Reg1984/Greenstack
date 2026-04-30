"use client"
// GreenStack AI Auto-Bidding Platform v2.0
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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

type PageId = "dashboard" | "tenders" | "bids" | "supply" | "audits" | "settings" | "universe" | "verdant" | "playbook" | "financials" | "browser" | "replies"

type BrowserSession = {
  id: string
  status: "pending_review" | "approved" | "submitted" | "failed" | "rejected"
  url: string
  purpose: string
  form_data: Record<string, string> | null
  screenshot_base64: string | null
  result_screenshot_base64: string | null
  notes: string | null
  needs_human: string[] | null
  error_message: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
}

type VerdantLog = {
  id: string
  description: string
  metadata: { output: string; cycle_start: string }
  created_at: string
}

const NAV_ITEMS = [
  { id: "dashboard" as PageId, icon: "⬡", label: "Dashboard" },
  { id: "tenders" as PageId, icon: "◈", label: "Tenders" },
  { id: "bids" as PageId, icon: "◎", label: "Bid Builder" },
  { id: "settings" as PageId, icon: "⚙", label: "Settings" },
  { id: "verdant" as PageId, icon: "🌿", label: "VERDANT", accent: true },
  { id: "browser" as PageId, icon: "🖥️", label: "Browser Sessions", accent: true },
  { id: "replies" as PageId, icon: "💬", label: "Reply Drafts", accent: true },
  { id: "playbook" as PageId, icon: "📋", label: "Playbook", accent: true },
  { id: "financials" as PageId, icon: "£", label: "Financials", accent: true },
]

const CHART_COLORS = ["#00ff87", "#60efff", "#ffd166", "#c084fc", "#ff6b6b", "#4ecdc4"]

const dashboardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
  .gs-glass {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: none;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.07);
    position: relative;
    overflow: hidden;
  }
  .gs-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.06) 30%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.08) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 1;
  }
  .gs-nav-item {
    transition: all 0.2s ease;
  }
  .gs-nav-item:hover {
    background: rgba(0,255,135,0.06);
  }
`

const SI = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>{children}</span>
)

const AGENTS = [
  { id: "scout", name: "Tender Scout", status: "active", queue: 12, icon: "🔍" },
  { id: "writer", name: "Bid Writer", status: "active", queue: 4, icon: "✍️" },
  { id: "supply", name: "Supply Chain", status: "idle", queue: 0, icon: "🔗" },
  { id: "audit", name: "Audit Engine", status: "active", queue: 2, icon: "📊" },
  { id: "winrate", name: "Win Rate AI", status: "learning", queue: 8, icon: "🎯" },
  { id: "risk", name: "Risk Monitor", status: "watching", queue: 3, icon: "⚠️" },
]

export default function GreenStackApp() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState("")
  const [pwError, setPwError] = useState(false)
  const [page, setPage] = useState<PageId>("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const [tenders, setTenders] = useState<Tender[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [autoBidRunning, setAutoBidRunning] = useState(false)
  const [autoBidResult, setAutoBidResult] = useState<any>(null)
  const [verdantLogs, setVerdantLogs] = useState<VerdantLog[]>([])
  const [verdantRunning, setVerdantRunning] = useState(false)
  const [verdantExpanded, setVerdantExpanded] = useState<string | null>(null)
  const [verdantChat, setVerdantChat] = useState<{role: string, content: string}[]>([])
  const [verdantInput, setVerdantInput] = useState('')
  const [verdantChatLoading, setVerdantChatLoading] = useState(false)
  const [verdantBrowsing, setVerdantBrowsing] = useState<string | null>(null)
  const [verdantBuildMode, setVerdantBuildMode] = useState(false)
  const [pendingBrowserSession, setPendingBrowserSession] = useState<any>(null)
  const [browserSubmitting, setBrowserSubmitting] = useState(false)
  const [browserFormUrl, setBrowserFormUrl] = useState('')
  const [browserFormPurpose, setBrowserFormPurpose] = useState('')
  const [browserFilling, setBrowserFilling] = useState(false)
  const [pendingBuildPlan, setPendingBuildPlan] = useState<any>(null)
  const [buildApplying, setBuildApplying] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [financialSummary, setFinancialSummary] = useState<any>({})
  const [outreachEmails, setOutreachEmails] = useState<any[]>([])
  const [invoicePrompt, setInvoicePrompt] = useState('')
  const [invoiceCreating, setInvoiceCreating] = useState(false)
  const [outreachForm, setOutreachForm] = useState({ org: '', email: '', name: '', context: '' })
  const [outreachSending, setOutreachSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [scoutRunning, setScoutRunning] = useState(false)
  const [scoutResult, setScoutResult] = useState<any>(null)
  const [browserSessions, setBrowserSessions] = useState<BrowserSession[]>([])
  const [browserApproving, setBrowserApproving] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<any[]>([])
  const [replySending, setReplySending] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const stored = sessionStorage.getItem("gs_auth")
    if (stored === "true") setAuthed(true)
  }, [])

  const handlePwSubmit = () => {
    if (pw === "greenstack2026") {
      sessionStorage.setItem("gs_auth", "true")
      setAuthed(true)
    } else {
      setPwError(true)
      setPw("")
      setTimeout(() => setPwError(false), 2000)
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      const [tendersRes, bidsRes, activitiesRes, verdantRes, invoicesRes, outreachRes, browserRes] = await Promise.all([
        supabase.from("tenders").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("bids").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("activity_log").select("*").eq("type", "verdant_cycle").order("created_at", { ascending: false }).limit(20),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("outreach_emails").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("browser_sessions").select("id,status,url,purpose,form_data,screenshot_base64,result_screenshot_base64,notes,needs_human,error_message,submitted_at,reviewed_at,created_at").order("created_at", { ascending: false }).limit(30),
      ])
      if (tendersRes.data) setTenders(tendersRes.data)
      if (bidsRes.data) setBids(bidsRes.data)
      if (activitiesRes.data) setActivities(activitiesRes.data)
      if (verdantRes.data) setVerdantLogs(verdantRes.data as VerdantLog[])
      if (invoicesRes.data) {
        setInvoices(invoicesRes.data)
        const paid = invoicesRes.data.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || 0), 0)
        const outstanding = invoicesRes.data.filter((i: any) => ['sent','overdue'].includes(i.status)).reduce((s: number, i: any) => s + (i.total || 0), 0)
        setFinancialSummary({ totalRevenue: paid, outstanding, invoiceCount: invoicesRes.data.length })
      }
      if (outreachRes.data) setOutreachEmails(outreachRes.data)
      if (browserRes.data) setBrowserSessions(browserRes.data as BrowserSession[])
      // reply_drafts loaded separately — table may not exist yet
      void supabase.from("reply_drafts").select("*").order("created_at", { ascending: false }).limit(50)
        .then(({ data }) => { if (data) setReplyDrafts(data) })
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

      case "verdant":
        return (
          <div className="space-y-4 pb-24 md:pb-6">
            {/* Header */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 26, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                  <span>🌿</span> VERDANT
                </h2>
                <p style={{ color: "rgba(0,255,135,0.45)", fontSize: 12, marginTop: 4, letterSpacing: "0.05em" }}>Sovereign Tender Intelligence — running 7am & 7pm daily, chat available 24/7</p>
              </div>
              <button
                onClick={async () => {
                  setVerdantRunning(true)
                  try {
                    const res = await fetch('/api/verdant', { method: 'POST' })
                    const data = await res.json()
                    if (data.success) {
                      setVerdantLogs(prev => [{
                        id: Date.now().toString(),
                        description: `VERDANT cycle completed — ${data.cycle}`,
                        metadata: { output: data.output, cycle_start: data.cycle },
                        created_at: new Date().toISOString(),
                      }, ...prev])
                    } else {
                      setVerdantLogs(prev => [{
                        id: Date.now().toString(),
                        description: `⚠️ Cycle error — ${data.error ?? 'unknown error'}`,
                        metadata: { output: data.error ?? 'Cycle failed — check Vercel logs', cycle_start: new Date().toISOString() },
                        created_at: new Date().toISOString(),
                      }, ...prev])
                    }
                  } catch (err) {
                    setVerdantLogs(prev => [{
                      id: Date.now().toString(),
                      description: `⚠️ Cycle failed — ${String(err)}`,
                      metadata: { output: String(err), cycle_start: new Date().toISOString() },
                      created_at: new Date().toISOString(),
                    }, ...prev])
                  } finally {
                    setVerdantRunning(false)
                  }
                }}
                disabled={verdantRunning}
                className="gs-glass"
                style={{ borderRadius: 10, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, color: verdantRunning ? "rgba(0,255,135,0.5)" : "rgba(0,255,135,0.9)", background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.2)", cursor: verdantRunning ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, letterSpacing: "0.04em" }}
              >
                <span className={verdantRunning ? "animate-spin" : ""}>🌿</span>
                {verdantRunning ? "Running cycle..." : "Run Now"}
              </button>
            </div>

            {/* Status cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { value: verdantLogs.length, label: "Cycles Run" },
                { value: "24/7", label: "Operating Mode" },
                { value: "2x daily", label: "Cron Interval" },
                { value: verdantLogs.length > 0 ? "ACTIVE" : "PENDING", label: "Status", green: verdantLogs.length > 0 },
              ].map((stat, i) => (
                <div key={i} className="gs-glass" style={{ borderRadius: 14, padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 24, color: stat.green === false ? "rgba(255,200,50,0.9)" : "rgba(0,255,135,0.9)", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Chat with VERDANT */}
            <div className="gs-glass" style={{ borderRadius: 16, padding: 20, border: "1px solid rgba(0,255,135,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "rgba(0,255,135,0.85)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(0,255,135,0.8)", display: "inline-block", boxShadow: "0 0 6px rgba(0,255,135,0.5)", animation: "pulse 2s infinite" }} />
                  Chat with VERDANT
                </h3>
                <button
                  onClick={() => { setVerdantBuildMode(!verdantBuildMode); setPendingBuildPlan(null) }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "6px 12px", borderRadius: 20,
                    background: verdantBuildMode ? "rgba(167,139,250,0.15)" : "rgba(0,255,135,0.06)",
                    border: `1px solid ${verdantBuildMode ? "rgba(167,139,250,0.35)" : "rgba(0,255,135,0.15)"}`,
                    color: verdantBuildMode ? "rgba(196,181,253,0.9)" : "rgba(0,255,135,0.55)",
                    cursor: "pointer", fontWeight: 500,
                  }}
                >
                  <span>🔧</span>
                  {verdantBuildMode ? 'Build Mode ON' : 'Build Mode'}
                </button>
              </div>
              {verdantBuildMode && (
                <div className="mb-3 text-xs text-violet-400/80 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                  Build Mode active — VERDANT can propose and apply changes to the GreenStack platform. Review all proposals before applying.
                </div>
              )}
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {verdantChat.length === 0 && (
                  <div className="text-emerald-500/40 text-sm text-center py-6">
                    Ask VERDANT anything — qualify a tender, write a bid, research a market, plan strategy.
                  </div>
                )}
                {verdantChat.map((msg, i) => (
                  <div key={i} className={cn("rounded-lg p-3 text-sm", msg.role === 'user' ? "bg-emerald-500/10 text-white ml-8" : "bg-[#061208] text-emerald-300 mr-8")}>
                    <div className="text-xs mb-1 opacity-60">{msg.role === 'user' ? 'You' : verdantBuildMode ? '🔧 VERDANT (Build)' : '🌿 VERDANT'}</div>
                    <pre className="whitespace-pre-wrap font-sans">{msg.content.replace(/```buildplan[\s\S]*?```/g, '[Build plan attached below]')}</pre>
                  </div>
                ))}
                {pendingBuildPlan && (
                  <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-3 text-sm mr-8">
                    <div className="text-xs mb-2 text-violet-400 font-semibold">🔧 VERDANT Build Proposal — {pendingBuildPlan.description}</div>
                    <div className="space-y-1 mb-3">
                      {pendingBuildPlan.changes?.map((c: any, i: number) => (
                        <div key={i} className="text-xs bg-[#0d0820] rounded px-2 py-1 text-violet-300 font-mono">
                          {c.operation === 'create' ? '+ CREATE' : '~ EDIT'} {c.file}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setBuildApplying(true)
                          try {
                            const res = await fetch('/api/verdant/build', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ plan: pendingBuildPlan }),
                            })
                            const data = await res.json()
                            setPendingBuildPlan(null)
                            const resultMsg = data.success
                              ? `✅ Build applied successfully! ${pendingBuildPlan.changes.length} file(s) updated. Redeploy to see changes.`
                              : `⚠️ Some changes failed: ${data.results?.filter((r: any) => !r.success).map((r: any) => `${r.file}: ${r.error}`).join(', ')}`
                            setVerdantChat(prev => [...prev, { role: 'assistant', content: resultMsg }])
                          } finally {
                            setBuildApplying(false)
                          }
                        }}
                        disabled={buildApplying}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition"
                      >
                        {buildApplying ? 'Applying...' : '✓ Apply Changes'}
                      </button>
                      <button
                        onClick={() => setPendingBuildPlan(null)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded transition"
                      >
                        ✗ Discard
                      </button>
                    </div>
                  </div>
                )}
                {verdantChatLoading && (
                  <div className="bg-[#061208] rounded-lg p-3 mr-8">
                    <div className="text-xs mb-1 opacity-60">🌿 VERDANT</div>
                    {verdantBrowsing ? (
                      <div className="text-xs text-cyan-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shrink-0" />
                        <span className="truncate">Browsing: {verdantBrowsing}</span>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 fixed bottom-0 left-0 right-0 md:static p-3 md:p-0 z-40" style={{ background: "rgba(3,10,8,0.97)", borderTop: "1px solid rgba(0,255,135,0.07)" }}>
                <input
                  type="text"
                  value={verdantInput}
                  onChange={e => setVerdantInput(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (!verdantInput.trim() || verdantChatLoading) return
                      const userMsg = verdantInput.trim()
                      setVerdantInput('')
                      const newMessages = [...verdantChat, { role: 'user', content: userMsg }]
                      setVerdantChat(newMessages)
                      setVerdantChatLoading(true)
                      setPendingBuildPlan(null)
                      setVerdantBrowsing(null)
                      try {
                        const endpoint = verdantBuildMode ? '/api/verdant/build' : '/api/verdant/chat'
                        const res = await fetch(endpoint, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messages: newMessages }),
                        })
                        let data: any = {}
                        try { data = await res.json() } catch { /* non-JSON response */ }
                        if (!res.ok || !data.reply) {
                          const errMsg = data.error || `Server error ${res.status} — try a shorter message or refresh the page.`
                          setVerdantChat([...newMessages, { role: 'assistant', content: `⚠️ ${errMsg}` }])
                        } else {
                          const toolNote = data.toolsUsed?.length
                            ? `\n\n🌐 *Browsed ${data.toolsUsed.length} source${data.toolsUsed.length > 1 ? 's' : ''}: ${data.toolsUsed.map((t: any) => t.input).join(', ')}*`
                            : ''
                          setVerdantChat([...newMessages, { role: 'assistant', content: data.reply + toolNote }])
                          if (data.buildPlan) setPendingBuildPlan(data.buildPlan)
                        }
                      } catch (err: any) {
                        setVerdantChat([...newMessages, { role: 'assistant', content: `⚠️ Request failed: ${err?.message ?? 'Unknown error'}. Try a shorter message or refresh the page.` }])
                      } finally {
                        setVerdantChatLoading(false)
                        setVerdantBrowsing(null)
                      }
                    }
                  }}
                  placeholder="Ask VERDANT... (press Enter to send)"
                  style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,135,0.12)", borderRadius: 10, padding: "11px 16px", color: "#fff", fontSize: 13, outline: "none" }}
                />
                <button
                  onClick={async () => {
                    if (!verdantInput.trim() || verdantChatLoading) return
                    const userMsg = verdantInput.trim()
                    setVerdantInput('')
                    const newMessages = [...verdantChat, { role: 'user', content: userMsg }]
                    setVerdantChat(newMessages)
                    setVerdantChatLoading(true)
                    setPendingBuildPlan(null)
                    try {
                      const endpoint = verdantBuildMode ? '/api/verdant/build' : '/api/verdant/chat'
                      const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages: newMessages }),
                      })
                      let data: any = {}
                      try { data = await res.json() } catch { /* non-JSON response */ }
                      if (!res.ok || !data.reply) {
                        const errMsg = data.error || `Server error ${res.status} — try a shorter message or refresh the page.`
                        setVerdantChat([...newMessages, { role: 'assistant', content: `⚠️ ${errMsg}` }])
                      } else {
                        const toolNote = data.toolsUsed?.length
                          ? `\n\n🌐 *Browsed ${data.toolsUsed.length} source${data.toolsUsed.length > 1 ? 's' : ''}: ${data.toolsUsed.map((t: any) => t.input).join(', ')}*`
                          : ''
                        setVerdantChat([...newMessages, { role: 'assistant', content: data.reply + toolNote }])
                        if (data.buildPlan) setPendingBuildPlan(data.buildPlan)
                      }
                    } catch (err: any) {
                      setVerdantChat([...newMessages, { role: 'assistant', content: `⚠️ Request failed: ${err?.message ?? 'Unknown error'}. Try a shorter message or refresh the page.` }])
                    } finally {
                      setVerdantChatLoading(false)
                    }
                  }}
                  disabled={verdantChatLoading || !verdantInput.trim()}
                  style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.22)", borderRadius: 10, padding: "11px 18px", color: "rgba(0,255,135,0.9)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", cursor: "pointer", opacity: (verdantChatLoading || !verdantInput.trim()) ? 0.4 : 1, whiteSpace: "nowrap" }}
                >
                  Send →
                </button>
              </div>
            </div>

            {/* Browser Agent — form filling */}
            <div className="gs-glass" style={{ borderRadius: 16, padding: 20, border: "1px solid rgba(96,239,255,0.12)" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "rgba(96,239,255,0.85)", marginBottom: 6 }}>
                <span>🤖</span> Browser Agent
                <span style={{ fontSize: 11, color: "rgba(96,239,255,0.4)", fontWeight: 400 }}>— VERDANT fills forms, you approve before submit</span>
              </h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>Paste a registration or application form URL. VERDANT fills it using GreenStack AI's profile, shows you a screenshot, and waits for your approval.</p>

              {!pendingBrowserSession ? (
                <div className="space-y-2">
                  <input
                    value={browserFormUrl}
                    onChange={e => setBrowserFormUrl(e.target.value)}
                    placeholder="https://www.giz.de/... or any form URL"
                    className="w-full bg-[#061208] border border-emerald-900/50 rounded-lg px-3 py-2 text-white text-sm placeholder-emerald-500/30 focus:outline-none focus:border-cyan-500/50"
                  />
                  <input
                    value={browserFormPurpose}
                    onChange={e => setBrowserFormPurpose(e.target.value)}
                    placeholder="What is this form? e.g. DACON supplier registration, G-Cloud application"
                    className="w-full bg-[#061208] border border-emerald-900/50 rounded-lg px-3 py-2 text-white text-sm placeholder-emerald-500/30 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={async () => {
                      if (!browserFormUrl.trim() || browserFilling) return
                      setBrowserFilling(true)
                      try {
                        const res = await fetch('/api/verdant/browser', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: browserFormUrl.trim(), purpose: browserFormPurpose.trim() }),
                        })
                        const data = await res.json()
                        if (data.error) {
                          alert('Browser agent error: ' + data.error)
                        } else {
                          setPendingBrowserSession(data)
                        }
                      } finally {
                        setBrowserFilling(false)
                      }
                    }}
                    disabled={browserFilling || !browserFormUrl.trim()}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                  >
                    {browserFilling ? '🤖 VERDANT is filling the form...' : '🤖 Fill Form with VERDANT'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-white font-medium">{pendingBrowserSession.purpose}</div>

                  {/* What was filled */}
                  <div className="bg-[#061208] rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                    <div className="text-xs text-cyan-400 font-semibold mb-2">Fields filled:</div>
                    {Object.entries(pendingBrowserSession.form_data ?? {}).map(([k, v]: any) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="text-emerald-500/60 shrink-0 w-40 truncate">{k}:</span>
                        <span className="text-white truncate">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes / warnings */}
                  {pendingBrowserSession.notes && (
                    <div className="text-xs text-yellow-400 bg-yellow-500/10 rounded p-2">{pendingBrowserSession.notes}</div>
                  )}
                  {pendingBrowserSession.needs_human?.length > 0 && (
                    <div className="text-xs text-red-400 bg-red-500/10 rounded p-2">
                      <strong>Needs your input before submitting:</strong> {pendingBrowserSession.needs_human.join(', ')}
                    </div>
                  )}

                  {/* Screenshot */}
                  {pendingBrowserSession.screenshot_base64 && (
                    <div>
                      <div className="text-xs text-emerald-500/60 mb-1">Form as filled — review before approving:</div>
                      <img
                        src={`data:image/png;base64,${pendingBrowserSession.screenshot_base64}`}
                        alt="Form screenshot"
                        className="w-full rounded-lg border border-emerald-900/30 max-h-96 object-top object-cover"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setBrowserSubmitting(true)
                        try {
                          const res = await fetch('/api/verdant/browser', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ session_id: pendingBrowserSession.session_id }),
                          })
                          const data = await res.json()
                          if (data.success) {
                            setPendingBrowserSession(null)
                            setBrowserFormUrl('')
                            setBrowserFormPurpose('')
                            setVerdantChat(prev => [...prev, {
                              role: 'assistant',
                              content: `✅ Form submitted successfully. Screenshot confirmation saved to Browserbase session log.`,
                            }])
                          } else {
                            alert('Submission failed: ' + data.message)
                          }
                        } finally {
                          setBrowserSubmitting(false)
                        }
                      }}
                      disabled={browserSubmitting || (pendingBrowserSession.needs_human?.length > 0)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                    >
                      {browserSubmitting ? 'Submitting...' : '✓ Approve & Submit'}
                    </button>
                    <button
                      onClick={async () => {
                        if (pendingBrowserSession.session_id) {
                          await fetch('/api/verdant/browser', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ session_id: pendingBrowserSession.session_id }),
                          })
                        }
                        setPendingBrowserSession(null)
                      }}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cycle logs */}
            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-4">Cycle History</h3>
              {verdantLogs.length === 0 ? (
                <div className="text-center py-12 text-emerald-500/40">
                  <div className="text-4xl mb-3">🌿</div>
                  <div>No cycles run yet. Click "Run Now" to trigger VERDANT manually, or wait for the next hourly cron.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {verdantLogs.map((log) => (
                    <div key={log.id} className="border border-emerald-900/30 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setVerdantExpanded(verdantExpanded === log.id ? null : log.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-emerald-500/5 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-white text-sm font-medium">
                            {new Date(log.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <span className="text-emerald-500/60 text-xs">{verdantExpanded === log.id ? "▲ hide" : "▼ expand"}</span>
                      </button>
                      {verdantExpanded === log.id && (
                        <div className="p-4 bg-[#061208] border-t border-emerald-900/30">
                          <pre className="text-emerald-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                            {log.metadata?.output ?? "No output recorded."}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case "playbook":
        const foundations = [
          { item: "Company Statement", status: "done", note: "AI-native, fast, cheap, brilliant" },
          { item: "Value Proposition", status: "done", note: "60-80% cheaper, days not months" },
          { item: "Methodology Document", status: "todo", note: "How GreenStack AI delivers work" },
          { item: "AI Capability Showcase", status: "todo", note: "Replaces traditional team profiles" },
          { item: "Demonstration Intelligence Reports", status: "urgent", note: "Pick 2-3 public companies, build full reports as proof" },
          { item: "Pricing Framework", status: "todo", note: "Day rates, project rates, tiered pricing" },
          { item: "Health & Safety Policy", status: "urgent", note: "Required in almost every bid" },
          { item: "Equality & Diversity Policy", status: "urgent", note: "Required in almost every bid" },
          { item: "Environmental Policy", status: "urgent", note: "Required in almost every bid" },
          { item: "Data Protection Policy", status: "urgent", note: "Required in almost every bid" },
          { item: "Professional Indemnity Insurance", status: "urgent", note: "Hard requirement in most tenders" },
          { item: "Public Liability Insurance", status: "urgent", note: "Hard requirement in most tenders" },
          { item: "G-Cloud Registration", status: "todo", note: "Fastest route to public sector revenue — no competitive tender needed" },
        ]
        const gaps = [
          { gap: "No Case Studies", severity: "high", fix: "Build 2-3 demonstration GreenStack Intelligence Reports on public companies. Use as proof of capability. Offer free pilot to first clients." },
          { gap: "No Accreditations", severity: "medium", fix: "Target tenders that don't mandate them. Be upfront and reframe. Consider a named accredited partner for high-value tenders." },
          { gap: "New Company", severity: "medium", fix: "Filter out tenders with minimum turnover thresholds. Offer milestone payments and satisfaction guarantees. Target SME-friendly buyers." },
        ]
        const priorities = [
          { rank: 1, action: "Build 2-3 demonstration Intelligence Reports", why: "Solves case study gap immediately — biggest single risk", color: "text-red-400", urgent: true },
          { rank: 2, action: "Write core policy documents (H&S, Equality, Environmental, Data)", why: "Required in almost every bid — without these you can't submit", color: "text-red-400", urgent: true },
          { rank: 3, action: "Confirm PI & Public Liability insurance", why: "Hard requirement — non-negotiable", color: "text-red-400", urgent: true },
          { rank: 4, action: "Register on G-Cloud (Crown Commercial Service)", why: "Huge shortcut — public sector can award directly without tender", color: "text-yellow-400", urgent: false },
          { rank: 5, action: "Set up Contracts Finder & FTS keyword alerts", why: "Pipeline visibility — never miss an opportunity", color: "text-yellow-400", urgent: false },
          { rank: 6, action: "Identify 3 live tenders to qualify and bid NOW", why: "Start building pipeline and track record", color: "text-green-400", urgent: false },
        ]
        return (
          <div className="space-y-6 pb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">📋 Tender Winning Playbook</h2>
              <p className="text-emerald-500/60 text-sm mt-1">Built by VERDANT — your end-to-end system for winning tenders</p>
            </div>

            {/* Priority Actions */}
            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-4">🔴 Immediate Priority List</h3>
              <div className="space-y-3">
                {priorities.map(p => (
                  <div key={p.rank} className="flex items-start gap-3 p-3 bg-[#061208] rounded-lg">
                    <div className={cn("text-lg font-bold w-6 shrink-0", p.color)}>#{p.rank}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">{p.action}</div>
                      <div className="text-emerald-500/60 text-xs mt-1">{p.why}</div>
                    </div>
                    {p.urgent && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded shrink-0">URGENT</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* G-Cloud callout */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">⭐ The Shortcut — G-Cloud Framework</h3>
              <p className="text-white text-sm">If GreenStack AI gets listed on G-Cloud (Crown Commercial Service), public sector buyers can <strong>directly award contracts without a competitive tender</strong>. No case studies required in the same way. This could be your fastest route to first revenue.</p>
              <a href="https://www.crowncommercial.gov.uk/suppliers/g-cloud" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-emerald-400 text-sm underline">Apply for G-Cloud →</a>
            </div>

            {/* Foundation Assets */}
            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-4">🏗️ Foundation Assets</h3>
              <div className="space-y-2">
                {foundations.map(f => (
                  <div key={f.item} className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-500/5 transition">
                    <span className="text-lg shrink-0">
                      {f.status === 'done' ? '✅' : f.status === 'urgent' ? '🔴' : '⬜'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{f.item}</div>
                      <div className="text-emerald-500/60 text-xs">{f.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-4">⚠️ Current Gaps & Fixes</h3>
              <div className="space-y-3">
                {gaps.map(g => (
                  <div key={g.gap} className="p-3 bg-[#061208] rounded-lg border-l-2 border-yellow-500/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-400 font-semibold text-sm">{g.gap}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded", g.severity === 'high' ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400")}>{g.severity}</span>
                    </div>
                    <p className="text-emerald-500/70 text-xs">{g.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask VERDANT */}
            <div className="bg-[#0a1a0f] border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-emerald-400 font-semibold mb-2">Ready to act on any of this?</p>
              <p className="text-emerald-500/60 text-sm mb-3">Go to the VERDANT tab and ask it to build a demonstration report, write your policy documents, or find live tenders to bid on right now.</p>
              <button onClick={() => setPage('verdant')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition">
                Open VERDANT →
              </button>
            </div>
          </div>
        )

      case "financials":
        const statusColor = (s: string) => ({
          paid: 'text-green-400 bg-green-500/10',
          sent: 'text-yellow-400 bg-yellow-500/10',
          overdue: 'text-red-400 bg-red-500/10',
          draft: 'text-emerald-500/60 bg-emerald-500/5',
          cancelled: 'text-gray-500 bg-gray-500/10',
        }[s] ?? 'text-gray-400 bg-gray-500/10')

        return (
          <div className="space-y-6 pb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">£ Financials</h2>
              <p className="text-emerald-500/60 text-sm mt-1">Invoices, outreach and revenue — managed by VERDANT</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">£{((financialSummary.totalRevenue ?? 0) / 1000).toFixed(1)}k</div>
                <div className="text-emerald-500/60 text-xs mt-1">Revenue Received</div>
              </div>
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">£{((financialSummary.outstanding ?? 0) / 1000).toFixed(1)}k</div>
                <div className="text-emerald-500/60 text-xs mt-1">Outstanding</div>
              </div>
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{invoices.length}</div>
                <div className="text-emerald-500/60 text-xs mt-1">Total Invoices</div>
              </div>
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-violet-400">{outreachEmails.filter(e => e.status === 'sent').length}</div>
                <div className="text-emerald-500/60 text-xs mt-1">Emails Sent</div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-3">🏦 Bank Details — Monzo Business</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-[#061208] rounded-lg p-3">
                  <div className="text-emerald-500/60 text-xs mb-1">Account Name</div>
                  <div className="text-white font-medium">SATSSTRATEGY EDUCATION LTD</div>
                </div>
                <div className="bg-[#061208] rounded-lg p-3">
                  <div className="text-emerald-500/60 text-xs mb-1">Sort Code</div>
                  <div className="text-white font-mono font-medium">04-00-05</div>
                </div>
                <div className="bg-[#061208] rounded-lg p-3">
                  <div className="text-emerald-500/60 text-xs mb-1">Account Number</div>
                  <div className="text-white font-mono font-medium">60913409</div>
                </div>
              </div>
            </div>

            {/* Create Invoice */}
            <div className="bg-[#0a1a0f] border border-emerald-500/20 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-3">📄 Create Invoice</h3>
              <p className="text-emerald-500/60 text-xs mb-3">Describe the work in plain English — VERDANT will structure the invoice automatically.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoicePrompt}
                  onChange={e => setInvoicePrompt(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && invoicePrompt.trim() && !invoiceCreating) {
                      setInvoiceCreating(true)
                      try {
                        const res = await fetch('/api/verdant/invoice', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ description: invoicePrompt }),
                        })
                        const data = await res.json()
                        if (data.invoice) { setInvoices(prev => [data.invoice, ...prev]); setInvoicePrompt('') }
                      } finally { setInvoiceCreating(false) }
                    }
                  }}
                  placeholder="e.g. Sustainability Intelligence Report for Barclays Bank, net zero roadmap, £35,000"
                  className="flex-1 bg-[#061208] border border-emerald-900/50 rounded-lg px-3 py-2 text-white text-sm placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={async () => {
                    if (!invoicePrompt.trim() || invoiceCreating) return
                    setInvoiceCreating(true)
                    try {
                      const res = await fetch('/api/verdant/invoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description: invoicePrompt }),
                      })
                      const data = await res.json()
                      if (data.invoice) { setInvoices(prev => [data.invoice, ...prev]); setInvoicePrompt('') }
                    } finally { setInvoiceCreating(false) }
                  }}
                  disabled={invoiceCreating || !invoicePrompt.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shrink-0"
                >
                  {invoiceCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>

            {/* Invoices list */}
            <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-4">Invoices</h3>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-emerald-500/40 text-sm">No invoices yet. Create your first invoice above.</div>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 p-3 bg-[#061208] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{inv.client_name}</div>
                        <div className="text-emerald-500/60 text-xs">{inv.invoice_number} · Due {inv.due_date}</div>
                      </div>
                      <div className="text-white font-semibold text-sm shrink-0">£{inv.total?.toLocaleString()}</div>
                      <span className={cn("text-xs px-2 py-0.5 rounded shrink-0 font-medium", statusColor(inv.status))}>{inv.status}</span>
                      {inv.status === 'draft' && inv.client_email && (
                        <button
                          onClick={async () => {
                            await fetch('/api/verdant/invoice', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: inv.id, status: 'sent' }),
                            })
                            setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'sent' } : i))
                          }}
                          className="text-xs px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded transition shrink-0"
                        >
                          Send
                        </button>
                      )}
                      {inv.status === 'sent' && (
                        <button
                          onClick={async () => {
                            await fetch('/api/verdant/invoice', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: inv.id, status: 'paid' }),
                            })
                            setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i))
                          }}
                          className="text-xs px-2 py-0.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded transition shrink-0"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send Outreach */}
            <div className="bg-[#0a1a0f] border border-violet-500/20 rounded-xl p-4">
              <h3 className="text-violet-400 font-semibold mb-3">📧 Send Outreach Email</h3>
              <p className="text-emerald-500/60 text-xs mb-3">VERDANT writes a personalised cold email and sends it instantly via Resend.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input value={outreachForm.org} onChange={e => setOutreachForm(f => ({...f, org: e.target.value}))} placeholder="Organisation name" className="bg-[#061208] border border-emerald-900/50 rounded-lg px-3 py-2 text-white text-sm placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50" />
                <input value={outreachForm.email} onChange={e => setOutreachForm(f => ({...f, email: e.target.value}))} placeholder="Contact email" type="email" className="bg-[#061208] border border-emerald-900/50 rounded-lg px-3 py-2 text-white text-sm placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50" />
                <input value={outreachForm.name} onChange={e => setOutreachForm(f => ({...f, name: e.target.value}))} placeholder="Contact name (optional)" className="bg-[#061208] border border-emerald-900/50 rounded-lg px-3 py-2 text-white text-sm placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50" />
                <input value={outreachForm.context} onChange={e => setOutreachForm(f => ({...f, context: e.target.value}))} placeholder="Context / why them (optional)" className="bg-[#061208] border border-emerald-900/50 rounded-lg px-3 py-2 text-white text-sm placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50" />
              </div>
              <button
                onClick={async () => {
                  if (!outreachForm.org || !outreachForm.email || outreachSending) return
                  setOutreachSending(true)
                  try {
                    const res = await fetch('/api/verdant/outreach', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ organisation: outreachForm.org, contact_email: outreachForm.email, contact_name: outreachForm.name, context: outreachForm.context }),
                    })
                    const data = await res.json()
                    if (data.email) { setOutreachEmails(prev => [data.email, ...prev]); setOutreachForm({ org: '', email: '', name: '', context: '' }) }
                  } finally { setOutreachSending(false) }
                }}
                disabled={outreachSending || !outreachForm.org || !outreachForm.email}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {outreachSending ? 'Drafting & Sending...' : '🌿 VERDANT: Write & Send Email'}
              </button>
            </div>

            {/* Outreach log */}
            {outreachEmails.length > 0 && (
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-4">Outreach Log</h3>
                <div className="space-y-2">
                  {outreachEmails.map(email => (
                    <div key={email.id} className="flex items-center gap-3 p-3 bg-[#061208] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{email.organisation || email.to_email}</div>
                        <div className="text-emerald-500/60 text-xs truncate">{email.subject}</div>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded shrink-0 font-medium", statusColor(email.status))}>{email.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "browser": {
        const pending = browserSessions.filter(s => s.status === "pending_review")
        const history = browserSessions.filter(s => s.status !== "pending_review")

        const approveSession = async (sessionId: string) => {
          setBrowserApproving(sessionId)
          try {
            const res = await fetch('/api/verdant/browser', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sessionId }),
            })
            const data = await res.json()
            setBrowserSessions(prev => prev.map(s =>
              s.id === sessionId
                ? { ...s, status: data.success ? "submitted" : "failed", error_message: data.success ? null : data.message, submitted_at: data.success ? new Date().toISOString() : null }
                : s
            ))
          } finally { setBrowserApproving(null) }
        }

        const rejectSession = async (sessionId: string) => {
          setBrowserApproving(sessionId)
          try {
            await fetch('/api/verdant/browser', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sessionId }),
            })
            setBrowserSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: "rejected" } : s))
          } finally { setBrowserApproving(null) }
        }

        const statusBadge = (s: BrowserSession["status"]) => ({
          pending_review: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
          approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
          submitted: "bg-green-500/20 text-green-400 border border-green-500/30",
          failed: "bg-red-500/20 text-red-400 border border-red-500/30",
          rejected: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
        }[s] ?? "bg-gray-500/20 text-gray-400")

        return (
          <div className="space-y-6 pb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">🖥️ Browser Sessions</h2>
              <p className="text-emerald-500/60 text-sm mt-1">
                VERDANT-filled portal forms waiting for your approval before submission.
                {pending.length > 0 && <span className="ml-2 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-semibold">{pending.length} pending</span>}
              </p>
            </div>

            {/* Pending — needs review */}
            {pending.length === 0 && (
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-10 text-center">
                <div className="text-3xl mb-3">🖥️</div>
                <div className="text-emerald-500/50 text-sm">No sessions pending review.</div>
                <div className="text-emerald-500/30 text-xs mt-2">When VERDANT fills a portal registration form, it will appear here for your approval.</div>
              </div>
            )}

            {pending.map(session => (
              <div key={session.id} className="bg-[#0a1a0f] border border-yellow-500/30 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-yellow-500/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded font-medium", statusBadge(session.status))}>PENDING REVIEW</span>
                    </div>
                    <h3 className="text-white font-semibold">{session.purpose}</h3>
                    <a href={session.url} target="_blank" rel="noopener noreferrer" className="text-emerald-500/60 text-xs hover:text-emerald-400 transition truncate block mt-0.5">{session.url}</a>
                  </div>
                  <div className="text-emerald-500/40 text-xs ml-4 shrink-0">{new Date(session.created_at).toLocaleString("en-GB")}</div>
                </div>

                {/* Warnings */}
                {session.needs_human && session.needs_human.length > 0 && (
                  <div className="mx-4 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-yellow-400 text-xs font-semibold mb-1">⚠️ Needs your input before submitting</div>
                    <div className="text-yellow-300/70 text-xs">{session.needs_human.join(" · ")}</div>
                  </div>
                )}
                {session.notes && (
                  <div className="mx-4 mt-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <div className="text-emerald-400/70 text-xs">{session.notes}</div>
                  </div>
                )}

                {/* Form data filled */}
                {session.form_data && Object.keys(session.form_data).length > 0 && (
                  <div className="p-4">
                    <div className="text-emerald-500/60 text-xs uppercase tracking-wider mb-2">Fields filled by VERDANT</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(session.form_data).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-2 bg-[#061208] rounded-lg p-2">
                          <span className="text-emerald-500/50 text-xs shrink-0 mt-0.5 min-w-[120px]">{k}</span>
                          <span className="text-white text-xs break-all">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screenshot */}
                {session.screenshot_base64 && (
                  <div className="px-4 pb-2">
                    <div className="text-emerald-500/60 text-xs uppercase tracking-wider mb-2">Screenshot — review before approving</div>
                    <div className="rounded-lg overflow-hidden border border-emerald-900/50">
                      <img
                        src={`data:image/png;base64,${session.screenshot_base64}`}
                        alt="Form screenshot"
                        className="w-full object-top"
                        style={{ maxHeight: 400, objectFit: "cover" }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 p-4 border-t border-emerald-900/30">
                  <button
                    onClick={() => approveSession(session.id)}
                    disabled={browserApproving === session.id || (session.needs_human?.length ?? 0) > 0}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
                  >
                    {browserApproving === session.id ? "Submitting..." : "✓ Approve & Submit"}
                  </button>
                  <button
                    onClick={() => rejectSession(session.id)}
                    disabled={browserApproving === session.id}
                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {/* History */}
            {history.length > 0 && (
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-emerald-900/30">
                  <h3 className="text-emerald-400 font-semibold text-sm">Session History</h3>
                </div>
                <div className="divide-y divide-emerald-900/20">
                  {history.map(session => (
                    <div key={session.id} className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{session.purpose}</div>
                        <div className="text-emerald-500/50 text-xs truncate mt-0.5">{session.url}</div>
                        {session.error_message && (
                          <div className="text-red-400/70 text-xs mt-1">{session.error_message}</div>
                        )}
                        {session.submitted_at && (
                          <div className="text-green-400/60 text-xs mt-1">Submitted {new Date(session.submitted_at).toLocaleString("en-GB")}</div>
                        )}
                      </div>
                      <span className={cn("text-xs px-2 py-1 rounded font-medium shrink-0", statusBadge(session.status))}>{session.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      case "replies": {
        const pendingReplies = replyDrafts.filter(r => r.status === "pending")
        const sentReplies = replyDrafts.filter(r => r.status !== "pending")

        const sendReply = async (draft: any) => {
          setReplySending(draft.id)
          try {
            const signoff = `\n\nKind regards,\n\nReginald Orme\nGreenStack AI\nverdant@greenstackai.co.uk\nwww.greenstackai.co.uk`
            const res = await fetch('/api/verdant/outreach', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to_email: draft.contact_email,
                to_name: draft.contact_name,
                organisation: draft.organisation,
                subject: draft.draft_subject,
                body: draft.draft_body + signoff,
              }),
            })
            if (res.ok) {
              await supabase.from("reply_drafts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", draft.id)
              setReplyDrafts(prev => prev.map(r => r.id === draft.id ? { ...r, status: "sent", sent_at: new Date().toISOString() } : r))
            }
          } finally { setReplySending(null) }
        }

        const dismissReply = async (id: string) => {
          await supabase.from("reply_drafts").update({ status: "dismissed" }).eq("id", id)
          setReplyDrafts(prev => prev.map(r => r.id === id ? { ...r, status: "dismissed" } : r))
        }

        return (
          <div className="space-y-6 pb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">💬 Reply Drafts</h2>
              <p className="text-emerald-500/60 text-sm mt-1">
                VERDANT-drafted responses to inbound replies — review and send with one click.
                {pendingReplies.length > 0 && <span className="ml-2 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-semibold">{pendingReplies.length} pending</span>}
              </p>
            </div>

            {pendingReplies.length === 0 && (
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-10 text-center">
                <div className="text-3xl mb-3">💬</div>
                <div className="text-emerald-500/50 text-sm">No pending reply drafts.</div>
                <div className="text-emerald-500/30 text-xs mt-2">When a contact replies to your outreach, VERDANT drafts a response here for your review.</div>
                <div className="text-emerald-500/30 text-xs mt-1">You can also tell VERDANT in chat: "Company X replied saying they're interested" — it will log it and draft a response instantly.</div>
              </div>
            )}

            {pendingReplies.map(draft => (
              <div key={draft.id} className="bg-[#0a1a0f] border border-emerald-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-semibold">{draft.organisation}</div>
                    <div className="text-emerald-500/60 text-xs mt-0.5">{draft.contact_name ? `${draft.contact_name} · ` : ''}{draft.contact_email}</div>
                    <div className="text-emerald-500/40 text-xs mt-0.5">{new Date(draft.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">pending</span>
                </div>

                {draft.their_reply && (
                  <div className="bg-[#061208] border border-emerald-900/30 rounded-lg p-3">
                    <div className="text-emerald-500/50 text-xs font-medium mb-1">THEIR REPLY</div>
                    <div className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{draft.their_reply.slice(0, 400)}{draft.their_reply.length > 400 ? '...' : ''}</div>
                  </div>
                )}

                <div className="bg-[#061208] border border-emerald-500/20 rounded-lg p-3">
                  <div className="text-emerald-400 text-xs font-medium mb-1">DRAFT RESPONSE · {draft.draft_subject}</div>
                  <div className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">{draft.draft_body}</div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => sendReply(draft)}
                    disabled={replySending === draft.id}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    {replySending === draft.id ? 'Sending...' : '✓ Approve & Send'}
                  </button>
                  <button
                    onClick={() => dismissReply(draft.id)}
                    className="px-4 py-2 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}

            {sentReplies.length > 0 && (
              <div className="bg-[#0a1a0f] border border-emerald-900/50 rounded-xl p-4">
                <h3 className="text-emerald-400 font-semibold mb-3 text-sm">Sent / Dismissed</h3>
                <div className="space-y-2">
                  {sentReplies.map(draft => (
                    <div key={draft.id} className="flex items-center gap-3 p-3 bg-[#061208] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{draft.organisation}</div>
                        <div className="text-emerald-500/50 text-xs truncate">{draft.draft_subject}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded shrink-0 font-medium ${draft.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{draft.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      default:
        return null
    }
  }

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#030808", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{dashboardStyles}</style>
      {/* ambient glow blobs */}
      <div style={{ position: "absolute", top: "20%", left: "30%", width: 400, height: 400, background: "radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "25%", width: 300, height: 300, background: "radial-gradient(circle, rgba(96,239,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div className="gs-glass" style={{ borderRadius: 20, padding: "48px 40px", width: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, textAlign: "center" }}>
        {/* logo mark */}
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>⬡</div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 28, color: "#fff", lineHeight: 1.1, marginBottom: 6 }}>GreenStack AI</div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 32 }}>Secure Dashboard</div>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handlePwSubmit()}
          placeholder="Access key"
          autoFocus
          style={{
            width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${pwError ? "rgba(255,80,80,0.4)" : "rgba(0,255,135,0.15)"}`,
            borderRadius: 10, color: "#fff", padding: "13px 18px", fontSize: 14, outline: "none",
            textAlign: "center", letterSpacing: "0.3em", marginBottom: pwError ? 10 : 16,
            fontFamily: "monospace",
          }}
        />
        {pwError && <div style={{ color: "rgba(255,80,80,0.75)", fontSize: 12, marginBottom: 16, letterSpacing: "0.05em" }}>Incorrect access key</div>}
        <button onClick={handlePwSubmit} style={{
          width: "100%", background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.25)",
          borderRadius: 10, color: "#00ff87", padding: "13px 0", cursor: "pointer",
          fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600,
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,255,135,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,255,135,0.08)")}
        >Enter →</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-white flex" style={{ background: "#030808" }}>
      <style>{dashboardStyles}</style>
      {menuOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300", menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")} style={{ background: "rgba(3,10,8,0.97)", borderRight: "1px solid rgba(0,255,135,0.08)" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(0,255,135,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="gs-glass" style={{ width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "rgba(0,255,135,0.9)", flexShrink: 0 }}>⬡</div>
            <div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 16, color: "#fff", lineHeight: 1.2 }}>GreenStack</div>
              <div style={{ fontSize: 10, color: "rgba(0,255,135,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>AI Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setMenuOpen(false); }}
                className="gs-nav-item"
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10, textAlign: "left",
                  background: active ? "rgba(0,255,135,0.09)" : "transparent",
                  border: active ? "1px solid rgba(0,255,135,0.18)" : "1px solid transparent",
                  color: active ? "rgba(0,255,135,0.95)" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 15, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, letterSpacing: "0.01em" }}>{item.label}</span>
                {item.id === "browser" && browserSessions.filter(s => s.status === "pending_review").length > 0 && (
                  <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: "rgba(234,179,8,0.9)", color: "#000", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {browserSessions.filter(s => s.status === "pending_review").length}
                  </span>
                )}
                {item.id === "replies" && replyDrafts.filter(r => r.status === "pending").length > 0 && (
                  <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: "rgba(52,211,153,0.9)", color: "#000", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {replyDrafts.filter(r => r.status === "pending").length}
                  </span>
                )}
                {active && item.id !== "browser" && item.id !== "replies" && <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "rgba(0,255,135,0.8)" }} />}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,255,135,0.07)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>GreenStack AI v1.0</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen" style={{ minWidth: 0 }}>
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(3,8,8,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,255,135,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="md:hidden" style={{ padding: 8, color: "rgba(0,255,135,0.7)", background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 16, color: "rgba(255,255,255,0.85)", textTransform: "capitalize" }}>{page}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff87", boxShadow: "0 0 8px rgba(0,255,135,0.6)", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: "rgba(0,255,135,0.6)", letterSpacing: "0.05em" }}>AI Active</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div> : renderPage()}
        </div>
      </main>
    </div>
  )
}
