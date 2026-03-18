"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PulseDot } from "@/components/greenstack-ui"

// Import real page components
import DashboardPage from "@/components/pages/dashboard-page"
import TendersPage from "@/components/pages/tenders-page"
import BidBuilderPage from "@/components/pages/bid-builder-page"
import SupplyChainPage from "@/components/pages/supply-chain-page"
import AuditsPage from "@/components/pages/audits-page"
import UniversePage from "@/components/pages/universe-page"
import SettingsPage from "@/components/pages/settings-page"

type PageId = "dashboard" | "tenders" | "bids" | "supply" | "audits" | "settings" | "universe"

const NAV_ITEMS: Array<{ id: PageId; icon: string; label: string; badge?: number; accent?: boolean }> = [
  { id: "dashboard", icon: "\u2B21", label: "Dashboard" },
  { id: "tenders", icon: "\u25C8", label: "Tenders", badge: 8 },
  { id: "bids", icon: "\u25CE", label: "Bid Builder", badge: 4 },
  { id: "supply", icon: "\u2B22", label: "Supply Chain" },
  { id: "audits", icon: "\u25C7", label: "Audits" },
  { id: "settings", icon: "\u2699", label: "Settings" },
  { id: "universe", icon: "\u2726", label: "Universe", accent: true },
]

function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case "dashboard": return <DashboardPage />
    case "tenders": return <TendersPage />
    case "bids": return <BidBuilderPage />
    case "supply": return <SupplyChainPage />
    case "audits": return <AuditsPage />
    case "settings": return <SettingsPage />
    case "universe": return <UniversePage />
    default: return <DashboardPage />
  }
}

export default function GreenStackShell() {
  const [page, setPage] = useState<PageId>("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const isUniverse = page === "universe"

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #020a14 0%, #041c12 50%, #020a14 100%)" }}>
      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-50 h-full w-64 border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "rgba(2,10,20,0.85)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-lg font-black text-white">G</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">GreenStack</p>
            <p className="text-[10px] text-emerald-400/70 font-mono tracking-widest">AI ENGINE</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/5"
                    : item.accent
                    ? "text-purple-400 hover:bg-purple-500/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className={cn("text-lg transition-transform", active && "scale-110")}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "min-w-[20px] h-5 px-1.5 rounded-md text-xs font-bold flex items-center justify-center",
                      active ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-slate-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Status footer */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <PulseDot size={1.5} />
            <span>All systems active</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0" style={{ background: "rgba(2,10,20,0.9)" }}>
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-xs font-black text-white">G</span>
            </div>
            <span className="text-sm font-bold text-white">GreenStack</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page content */}
        {isUniverse ? (
          <main className="flex-1 overflow-hidden">
            <PageContent page={page} />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <PageContent page={page} />
          </main>
        )}
      </div>
    </div>
  )
}
