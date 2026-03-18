"use client"

import { useState } from "react"

// All pages inline - no external imports
function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Live Tenders", value: "47", color: "#00ff87" },
          { label: "Pipeline Value", value: "£2.4M", color: "#60efff" },
          { label: "Bids Submitted", value: "183", color: "#ffd166" },
          { label: "Win Rate", value: "34%", color: "#c084fc" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="text-lg md:text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {["Bid submitted: Manchester Airport", "New tender found: Liverpool Port", "Contractor sourced: Leeds LED"].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-xs md:text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Tenders() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-white">Tender Pipeline</h1>
        <button className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm w-full sm:w-auto">
          + Add Tender
        </button>
      </div>
      <div className="space-y-3">
        {[
          { title: "Manchester Airport Carbon Offset", value: "£450K", match: 94 },
          { title: "Leeds City Council LED Retrofit", value: "£280K", match: 87 },
          { title: "Liverpool Port Solar Installation", value: "£890K", match: 82 },
        ].map((tender) => (
          <div key={tender.title} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{tender.title}</p>
                <p className="text-xs text-slate-500 mt-1">{tender.value}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 sm:w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${tender.match}%` }} />
                </div>
                <span className="text-xs text-emerald-400 shrink-0">{tender.match}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BidBuilder() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Bid Builder</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Active Bids</h2>
          <div className="space-y-2">
            {["Manchester Airport", "Leeds Council", "Liverpool Port"].map((bid) => (
              <div key={bid} className="p-3 bg-white/5 rounded-lg text-sm text-slate-300">{bid}</div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Bid Content</h2>
          <textarea 
            className="w-full h-40 md:h-48 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-emerald-500/50"
            placeholder="Select a bid to edit content..."
          />
          <button className="mt-3 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm w-full sm:w-auto">
            Generate with AI
          </button>
        </div>
      </div>
    </div>
  )
}

function SupplyChain() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Supply Chain</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "SolarEdge North", type: "Solar PV", status: "Active" },
          { name: "HeatPump Pro Ltd", type: "Heat Pumps", status: "Active" },
          { name: "LED Solutions UK", type: "Lighting", status: "Pending" },
        ].map((contractor) => (
          <div key={contractor.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-medium text-white">{contractor.name}</p>
            <p className="text-xs text-slate-500 mt-1">{contractor.type}</p>
            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${contractor.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              {contractor.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Audits() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Audits</h1>
      <div className="space-y-3">
        {[
          { site: "Manchester Airport T2", date: "15 Mar 2026", score: 92 },
          { site: "Leeds City Hall", date: "12 Mar 2026", score: 88 },
          { site: "Liverpool Docks", date: "10 Mar 2026", score: 95 },
        ].map((audit) => (
          <div key={audit.site} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{audit.site}</p>
                <p className="text-xs text-slate-500 mt-1">{audit.date}</p>
              </div>
              <div className="text-lg font-bold text-emerald-400">{audit.score}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Settings</h1>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">Auto-Bid Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Match Threshold</label>
              <input type="range" min="0" max="100" defaultValue="65" className="w-full accent-emerald-400" />
              <p className="text-xs text-slate-500 mt-1">Only bid on tenders with 65%+ match score</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">Max Bid Value</label>
              <input type="text" defaultValue="£500,000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
          </div>
        </div>
        <button className="w-full sm:w-auto px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium">
          Run Auto-Bidding Now
        </button>
      </div>
    </div>
  )
}

function Universe() {
  const agents = [
    { name: "Tender Scout", status: "Active", queue: 12, color: "#00ff87" },
    { name: "Bid Writer", status: "Active", queue: 4, color: "#60efff" },
    { name: "Supply Chain", status: "Idle", queue: 0, color: "#ffd166" },
    { name: "Audit Engine", status: "Active", queue: 2, color: "#c084fc" },
    { name: "Win Rate AI", status: "Learning", queue: 8, color: "#ff6b6b" },
    { name: "Risk Monitor", status: "Active", queue: 3, color: "#4ecdc4" },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">AI Agent Swarm</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
              <span className="text-xs text-slate-400">{agent.status}</span>
            </div>
            <p className="text-sm font-medium text-white">{agent.name}</p>
            <p className="text-xs text-slate-500 mt-1">{agent.queue} in queue</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type PageId = "dashboard" | "tenders" | "bids" | "supply" | "audits" | "settings" | "universe"

const NAV: { id: PageId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tenders", label: "Tenders" },
  { id: "bids", label: "Bids" },
  { id: "supply", label: "Supply" },
  { id: "audits", label: "Audits" },
  { id: "settings", label: "Settings" },
  { id: "universe", label: "Universe" },
]

export default function Page() {
  const [page, setPage] = useState<PageId>("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#020a14] text-white">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#020a14] z-50">
        <span className="text-lg font-bold text-emerald-400">GreenStack</span>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-400 text-xl">
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${menuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          fixed md:sticky top-0 left-0 z-40
          w-64 h-screen bg-[#020a14] border-r border-white/10
          transition-transform duration-200 ease-in-out
          pt-16 md:pt-0
        `}>
          <div className="p-4 hidden md:block border-b border-white/10">
            <span className="text-xl font-bold text-emerald-400">GreenStack</span>
            <p className="text-xs text-slate-500 mt-1">AI PLATFORM</p>
          </div>
          <nav className="p-3">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm mb-1 transition-colors ${
                  page === item.id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:bg-white/5 border border-transparent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-4 left-3 right-3">
            <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400">AI ONLINE</span>
              </div>
              <p className="text-xs text-slate-500">4 agents active</p>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {menuOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMenuOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen p-4 md:p-6 lg:p-8">
          {page === "dashboard" && <Dashboard />}
          {page === "tenders" && <Tenders />}
          {page === "bids" && <BidBuilder />}
          {page === "supply" && <SupplyChain />}
          {page === "audits" && <Audits />}
          {page === "settings" && <Settings />}
          {page === "universe" && <Universe />}
        </main>
      </div>
    </div>
  )
}
