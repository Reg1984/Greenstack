"use client"

// Fresh rebuild - v2
import { useState } from "react"
import { cn } from "@/lib/utils"
import { PulseDot } from "@/components/greenstack-ui"

// Page imports - NO ReportsPage
import DashboardPage from "@/components/pages/dashboard-page"
import TendersPage from "@/components/pages/tenders-page"
import BidBuilderPage from "@/components/pages/bid-builder-page"
import SupplyChainPage from "@/components/pages/supply-chain-page"
import AuditsPage from "@/components/pages/audits-page"
import UniversePage from "@/components/pages/universe-page"
import SettingsPage from "@/components/pages/settings-page"

// Page type - NO reports
type PageId = "dashboard" | "tenders" | "bids" | "supply" | "audits" | "settings" | "universe"

// Navigation items - NO reports
const NAV_ITEMS: Array<{ id: PageId; icon: string; label: string; badge?: number; accent?: boolean }> = [
  { id: "dashboard", icon: "\u2B21", label: "Dashboard" },
  { id: "tenders", icon: "\u25C8", label: "Tenders", badge: 8 },
  { id: "bids", icon: "\u25CE", label: "Bid Builder", badge: 4 },
  { id: "supply", icon: "\u2B22", label: "Supply Chain" },
  { id: "audits", icon: "\u25C7", label: "Audits" },
  { id: "settings", icon: "\u2699", label: "Settings" },
  { id: "universe", icon: "\u2726", label: "Universe", accent: true },
]

// Page renderer component
function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case "dashboard": return <DashboardPage />
    case "tenders": return <TendersPage />
    case "bids": return <BidBuilderPage />
    case "supply": return <SupplyChainPage />
    case "audits": return <AuditsPage />
    case "settings": return <SettingsPage />
    default: return null
  }
}

export default function MainShell() {
  const [page, setPage] = useState<PageId>("dashboard")
  const isUniverse = page === "universe"

  return (
    <div
      className="flex h-screen overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg,#020c18 0%,#041220 50%,#020e1a 100%)" }}
    >
      {!isUniverse && (
        <>
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,255,135,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.022) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div
            className="fixed top-0 left-1/3 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(0,255,135,0.05) 0%,transparent 70%)" }}
          />
        </>
      )}

      <aside
        className="relative z-20 flex flex-col w-60 shrink-0 border-r border-white/5"
        style={{ background: "rgba(2,10,20,0.92)", backdropFilter: "blur(20px)" }}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#00ff87,#00b360)" }}
            >
              <span className="text-black font-black text-base">G</span>
            </div>
            <div>
              <p className="font-black text-white tracking-tight leading-none">GreenStack</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">AI PLATFORM</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((n) => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                page === n.id
                  ? n.accent
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/25"
                    : "bg-emerald-500/[0.12] text-emerald-400 border border-emerald-500/15"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <span className="text-base w-5 text-center">{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md font-mono",
                  page === n.id ? "bg-emerald-500/30 text-emerald-300" : "bg-white/[0.08] text-slate-500"
                )}>
                  {n.badge}
                </span>
              )}
              {n.accent && <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-emerald-500/15 text-emerald-400">NEW</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="rounded-xl p-3" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.1)" }}>
            <div className="flex items-center gap-2 mb-1">
              <PulseDot size={1.5} />
              <span className="text-xs font-mono text-emerald-400">AI ONLINE</span>
            </div>
            <p className="text-xs text-slate-500">4 agents active</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {!isUniverse && (
          <header
            className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 shrink-0"
            style={{ background: "rgba(2,10,20,0.7)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="text-slate-600">GREENSTACK</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-400 capitalize">{page}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/[0.08]">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-black font-bold text-xs"
                  style={{ background: "linear-gradient(135deg,#00ff87,#60efff)" }}
                >
                  R
                </div>
                <span className="text-sm text-slate-300">Reg</span>
              </div>
            </div>
          </header>
        )}

        {isUniverse ? (
          <UniversePage />
        ) : (
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 scroll-smooth">
            <PageContent page={page} />
          </main>
        )}
      </div>
    </div>
  )
}
