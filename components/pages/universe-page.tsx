"use client"

import { useState } from "react"
import { GsCard, GsBadge, PulseDot, ProgressBar } from "@/components/greenstack-ui"

const AGENTS = [
  { id: "scout", name: "Tender Scout", status: "active", queue: 12, icon: "◈", color: "#00ff87", desc: "Scans 500+ tender portals for opportunities" },
  { id: "writer", name: "Bid Writer", status: "active", queue: 4, icon: "◉", color: "#60efff", desc: "AI-generates winning bid content" },
  { id: "supply", name: "Supply Chain", status: "idle", queue: 0, icon: "⬡", color: "#ffd166", desc: "Sources and vets contractors" },
  { id: "audit", name: "Audit Engine", status: "active", queue: 2, icon: "◇", color: "#c084fc", desc: "Compliance and quality checks" },
  { id: "winrate", name: "Win Rate AI", status: "learning", queue: 8, icon: "✦", color: "#f472b6", desc: "Optimizes bid strategy from outcomes" },
  { id: "risk", name: "Risk Monitor", status: "active", queue: 3, icon: "⬢", color: "#fb923c", desc: "Identifies and mitigates project risks" },
]

const ACTIVITY = [
  { agent: "Tender Scout", action: "Found new tender: Liverpool Port Decarbonisation", time: "2m ago", type: "found" },
  { agent: "Bid Writer", action: "Completed draft for Manchester Airport", time: "5m ago", type: "complete" },
  { agent: "Win Rate AI", action: "Updated scoring model +2.3% accuracy", time: "12m ago", type: "learn" },
  { agent: "Risk Monitor", action: "Flagged supplier insurance expiry", time: "18m ago", type: "alert" },
  { agent: "Audit Engine", action: "Verified compliance for Leeds retrofit", time: "25m ago", type: "verify" },
]

export default function UniversePage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#00ff87"
      case "idle": return "#64748b"
      case "learning": return "#c084fc"
      default: return "#64748b"
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "found": return "#818cf8"
      case "complete": return "#00ff87"
      case "learn": return "#c084fc"
      case "alert": return "#ffd166"
      case "verify": return "#60efff"
      default: return "#64748b"
    }
  }

  const selected = AGENTS.find(a => a.id === selectedAgent)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Universe</h1>
          <p className="text-sm text-slate-500 mt-1">Agent swarm command center</p>
        </div>
        <div className="flex items-center gap-2">
          <PulseDot size={1.5} />
          <span className="text-xs font-mono text-emerald-400">6 AGENTS ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <GsCard
            key={agent.id}
            className={`p-5 cursor-pointer transition-all hover:scale-[1.02] ${
              selectedAgent === agent.id ? "ring-2 ring-emerald-500/50" : ""
            }`}
            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: agent.color + "20", color: agent.color }}
                >
                  {agent.icon}
                </div>
                <div>
                  <p className="text-white font-medium">{agent.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getStatusColor(agent.status) }}
                    />
                    <span className="text-xs text-slate-500 capitalize">{agent.status}</span>
                  </div>
                </div>
              </div>
              {agent.queue > 0 && (
                <GsBadge color="emerald">{agent.queue} queued</GsBadge>
              )}
            </div>
            
            <p className="text-xs text-slate-500 mb-3">{agent.desc}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Processing</span>
                <span className="text-slate-400">{agent.status === "active" ? "87%" : agent.status === "learning" ? "42%" : "0%"}</span>
              </div>
              <ProgressBar value={agent.status === "active" ? 87 : agent.status === "learning" ? 42 : 0} color={agent.color} />
            </div>
          </GsCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GsCard className="p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <PulseDot size={1.5} />
            Live Activity Feed
          </h2>
          <div className="space-y-3">
            {ACTIVITY.map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/5">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: getActivityColor(item.type) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{item.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{item.agent}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GsCard>

        <GsCard className="p-6">
          <h2 className="font-semibold text-white mb-4">Swarm Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm text-slate-400">Total Tasks Processed</span>
              <span className="text-lg font-mono text-white">1,847</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm text-slate-400">Avg Response Time</span>
              <span className="text-lg font-mono text-emerald-400">1.2s</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm text-slate-400">AI Accuracy</span>
              <span className="text-lg font-mono text-cyan-400">94.7%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm text-slate-400">Uptime</span>
              <span className="text-lg font-mono text-purple-400">99.9%</span>
            </div>
          </div>
        </GsCard>
      </div>
    </div>
  )
}
