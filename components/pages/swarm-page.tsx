"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import { getTenders, getBids, getDashboardStats, getActivityLog } from "@/app/actions/database"
import { fmt } from "@/lib/data"

const AGENTS = [
  {
    id: "scout",
    name: "Tender Scout",
    icon: "⬡",
    role: "Scans 847 procurement portals for live tender matches",
    color: "#00ff88",
    status: "active",
    lastAction: "Found: Liverpool Port Sustainability Audit",
    queue: 3,
    model: "Bid intelligence + procurement APIs",
  },
  {
    id: "writer",
    name: "Bid Writer",
    icon: "✍",
    role: "Drafts full bid responses from tender specifications",
    color: "#00d4ff",
    status: "active",
    lastAction: "Drafting: Leeds LED Retrofit — 67% complete",
    queue: 2,
    model: "Claude Sonnet — live",
  },
  {
    id: "supply",
    name: "Supply Chain",
    icon: "⬢",
    role: "Sources & vets contractors for each active bid",
    color: "#ffaa00",
    status: "idle",
    lastAction: "Sourced 3 contractors for Manchester Airport",
    queue: 0,
    model: "Companies House + LinkedIn APIs",
  },
  {
    id: "audit",
    name: "Audit Engine",
    icon: "◈",
    role: "Runs sustainability audits on client organisations",
    color: "#aa88ff",
    status: "active",
    lastAction: "Running: Sheffield NHS Trust — carbon baseline",
    queue: 1,
    model: "Energy data + Companies House",
  },
  {
    id: "optimizer",
    name: "Win Rate AI",
    icon: "◎",
    role: "Analyses bids & outcomes to improve win rate",
    color: "#ff6688",
    status: "active",
    lastAction: "Win pattern found: NHS bids +14% with social value section",
    queue: 0,
    model: "Claude Sonnet — analysis",
  },
  {
    id: "risk",
    name: "Risk Monitor",
    icon: "⚠",
    role: "Watches pipeline for flags, deadlines & contractor issues",
    color: "#ff4444",
    status: "alert",
    lastAction: "ALERT: SolarEdge North — insurance expires in 8 days",
    queue: 2,
    model: "Continuous monitoring",
  },
];

const MOCK_TENDERS = [
  { id: 1, title: "Manchester Airport Carbon Offset Programme", value: "£1.2M", deadline: "14 Mar 2026", match: 94, sector: "Aviation", status: "draft" },
  { id: 2, title: "Leeds City Council LED Street Retrofit", value: "£280K", deadline: "18 Mar 2026", match: 88, sector: "Local Authority", status: "drafting" },
  { id: 3, title: "NHS Trust Energy Management System", value: "£560K", deadline: "22 Mar 2026", match: 91, sector: "Healthcare", status: "new" },
  { id: 4, title: "Liverpool Port Sustainability Audit", value: "£180K", deadline: "25 Mar 2026", match: 82, sector: "Maritime", status: "new" },
  { id: 5, title: "Sheffield Renewable Energy Audit", value: "£95K", deadline: "28 Mar 2026", match: 79, sector: "Utilities", status: "new" },
];

const ACTIVITY_LOG = [
  { time: "2m ago", agent: "scout", icon: "⬡", color: "#00ff88", msg: "New tender found: Liverpool Port Sustainability Audit — £180K" },
  { time: "8m ago", agent: "writer", icon: "✍", color: "#00d4ff", msg: "Bid draft 67% complete: Leeds LED Retrofit" },
  { time: "14m ago", agent: "supply", icon: "⬢", color: "#ffaa00", msg: "3 contractors sourced and vetted for Manchester Airport" },
  { time: "31m ago", agent: "risk", icon: "⚠", color: "#ff4444", msg: "ALERT: SolarEdge North insurance expiring in 8 days" },
  { time: "1h ago", agent: "optimizer", icon: "◎", color: "#ff6688", msg: "Win pattern: bids with social value sections +14% success rate" },
  { time: "2h ago", agent: "audit", icon: "◈", color: "#aa88ff", msg: "Sheffield NHS carbon baseline audit initiated" },
  { time: "3h ago", agent: "scout", icon: "⬡", color: "#00ff88", msg: "Tender matched: NHS Trust Energy Management — 91% confidence" },
];

export default function GreenStackSwarm() {
  const [activeTab, setActiveTab] = useState("universe")
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [bidTender, setBidTender] = useState(null)
  const [bidPrompt, setBidPrompt] = useState("")
  const [bidOutput, setBidOutput] = useState("")
  const [bidLoading, setBidLoading] = useState(false)
  const [activityLog, setActivityLog] = useState(ACTIVITY_LOG)
  const [agentStates, setAgentStates] = useState(AGENTS)
  const [pulseMap, setPulseMap] = useState({})
  const bidRef = useRef(null)

  // Fetch real data from Supabase
  const { data: tenders = [] } = useSWR("tenders", () => getTenders(), { revalidateOnFocus: false })
  const { data: bids = [] } = useSWR("bids", () => getBids(), { revalidateOnFocus: false })
  const { data: stats } = useSWR("dashboard-stats", () => getDashboardStats(), { revalidateOnFocus: false })
  const { data: activities = [] } = useSWR("activity-log", () => getActivityLog(10), { revalidateOnFocus: false })

  // Simulate live agent pulses
  useEffect(() => {
    const interval = setInterval(() => {
      const activeAgents = agentStates.filter(a => a.status !== "idle");
      if (activeAgents.length > 0) {
        const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
        setPulseMap(p => ({ ...p, [agent.id]: Date.now() }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [agentStates]);

  // Simulate new activity entries
  useEffect(() => {
    const messages = [
      { agent: "scout", icon: "⬡", color: "#00ff88", msg: "Scanning: Contracts Finder — 247 new tenders indexed" },
      { agent: "writer", icon: "✍", color: "#00d4ff", msg: "Methodology section generated for Leeds LED bid" },
      { agent: "risk", icon: "⚠", color: "#ff4444", msg: "Deadline alert: Manchester Airport due in 3 days" },
      { agent: "optimizer", icon: "◎", color: "#ff6688", msg: "Analysing bid language patterns across 12 submissions" },
    ];
    const interval = setInterval(() => {
      const entry = messages[Math.floor(Math.random() * messages.length)];
      setActivityLog(log => [{ ...entry, time: "just now" }, ...log.slice(0, 12)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const runBidWriter = async () => {
    if (!bidTender || !bidPrompt.trim()) return;
    setBidLoading(true);
    setBidOutput("");

    const systemPrompt = `You are GreenStack's AI Bid Writer — a specialist in writing winning sustainability and green infrastructure bids for UK public sector procurement. You write in a professional, confident, evidence-based tone. Structure your response with clear sections. Be specific, compelling, and focused on value delivery.`;

    const userPrompt = `Write a compelling bid response section for the following tender:

TENDER: ${bidTender.title}
VALUE: ${bidTender.value}
SECTOR: ${bidTender.sector}
DEADLINE: ${bidTender.deadline}

ADDITIONAL CONTEXT FROM USER:
${bidPrompt}

Write: Executive Summary, Our Approach, Social Value & Sustainability Credentials, and Why Choose GreenStack AI. Keep it professional, specific, and winning.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "No response generated.";
      setBidOutput(text);
      setActivityLog(log => [{
        time: "just now", agent: "writer", icon: "✍", color: "#00d4ff",
        msg: `Bid draft complete: ${bidTender.title}`
      }, ...log.slice(0, 12)]);
    } catch (err) {
      setBidOutput("Error connecting to Claude API. Check your ANTHROPIC_API_KEY environment variable.");
    }
    setBidLoading(false);
    setTimeout(() => bidRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const statusColor = (s) => s === "active" ? "#00ff88" : s === "alert" ? "#ff4444" : "#555";
  const statusLabel = (s) => s === "active" ? "ACTIVE" : s === "alert" ? "ALERT" : "IDLE";

  return (
    <div style={{
      background: "#080c0f",
      minHeight: "100vh",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      color: "#c8d8c0",
      fontSize: "13px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #1a2820; }
        .agent-card { transition: all 0.2s ease; cursor: pointer; }
        .agent-card:hover { transform: translateY(-2px); border-color: #00ff8855 !important; }
        .agent-card.selected { border-color: #00ff88 !important; background: #0a1a0f !important; }
        .tab { cursor: pointer; transition: all 0.2s; }
        .tab:hover { color: #00ff88; }
        .tab.active { color: #00ff88; border-bottom: 2px solid #00ff88; }
        .pulse { animation: pulse 1.5s ease-in-out; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,255,136,0); } 50% { box-shadow: 0 0 12px 4px rgba(0,255,136,0.3); } }
        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .bid-btn { transition: all 0.2s; }
        .bid-btn:hover { background: #00ff88 !important; color: #000 !important; }
        .tender-row { transition: all 0.2s; cursor: pointer; }
        .tender-row:hover { background: #0d1a10 !important; }
        .tender-row.selected { background: #0a1a0f !important; border-left: 3px solid #00ff88 !important; }
        textarea:focus { outline: none; border-color: #00ff8866 !important; }
        .scan-line { animation: scan 3s linear infinite; }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0a0f0c", borderBottom: "1px solid #1a2820", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ color: "#00ff88", fontSize: "18px", fontWeight: 600, letterSpacing: "2px" }}>G</span>
        <span style={{ color: "#4a6a50", margin: "0 4px" }}>|</span>
        <span style={{ color: "#4a6a50", letterSpacing: "3px", fontSize: "11px" }}>GREENSTACK</span>
        <span style={{ color: "#1a3020", margin: "0 8px" }}>—</span>
        <span style={{ color: "#00ff88", fontSize: "10px", letterSpacing: "2px" }}>AGENT SWARM / UNIVERSE</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", display: "inline-block" }} className="blink" />
          <span style={{ color: "#4a6a50", fontSize: "11px" }}>6 AGENTS INITIALISED</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1a2820", padding: "0 24px", display: "flex", gap: "24px" }}>
        {[
          { id: "universe", label: "⬡ Universe" },
          { id: "bidwriter", label: "✍ Bid Writer" },
          { id: "tenders", label: "◈ Live Tenders" },
          { id: "activity", label: "▣ Activity Feed" },
        ].map(t => (
          <div key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`}
            style={{ padding: "12px 0", fontSize: "11px", letterSpacing: "1px", color: activeTab === t.id ? "#00ff88" : "#4a6a50" }}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      <div style={{ padding: "24px", maxWidth: "1200px" }}>

        {/* UNIVERSE TAB */}
        {activeTab === "universe" && (
          <div className="fade-in">
            {/* Stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "ACTIVE AGENTS", value: "5/6", sub: "1 on alert" },
                { label: "TENDERS SCANNING", value: "847", sub: "portals monitored" },
                { label: "BIDS IN PIPELINE", value: "4", sub: "£2.1M total value" },
                { label: "SWARM UPTIME", value: "99.8%", sub: "last 30 days" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#0a0f0c", border: "1px solid #1a2820", padding: "16px" }}>
                  <div style={{ color: "#2a4a30", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px" }}>{s.label}</div>
                  <div style={{ color: "#00ff88", fontSize: "22px", fontWeight: 600 }}>{s.value}</div>
                  <div style={{ color: "#3a5a40", fontSize: "11px", marginTop: "4px" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Agent grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {agentStates.map(agent => (
                <div key={agent.id}
                  className={`agent-card ${selectedAgent?.id === agent.id ? "selected" : ""}`}
                  style={{ background: "#0a0f0c", border: `1px solid #1a2820`, padding: "20px", position: "relative", overflow: "hidden" }}
                  onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}>

                  {/* Scan line effect for active agents */}
                  {agent.status === "active" && (
                    <div className="scan-line" style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                      background: `linear-gradient(90deg, transparent, ${agent.color}44, transparent)`,
                      pointerEvents: "none"
                    }} />
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "20px", color: agent.color }}>{agent.icon}</span>
                      <div>
                        <div style={{ color: "#c8d8c0", fontWeight: 600, fontSize: "13px" }}>{agent.name}</div>
                        <div style={{ color: agent.color, fontSize: "10px", letterSpacing: "2px" }}>{statusLabel(agent.status)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {agent.queue > 0 && (
                        <span style={{ background: "#1a2820", color: "#00ff88", padding: "2px 8px", fontSize: "11px", borderRadius: "2px" }}>
                          {agent.queue} queued
                        </span>
                      )}
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: statusColor(agent.status),
                        boxShadow: agent.status !== "idle" ? `0 0 8px ${statusColor(agent.status)}` : "none"
                      }} />
                    </div>
                  </div>

                  <div style={{ color: "#3a5a40", fontSize: "11px", marginBottom: "10px", lineHeight: 1.5 }}>{agent.role}</div>
                  <div style={{ borderTop: "1px solid #1a2820", paddingTop: "10px" }}>
                    <div style={{ color: "#4a6a50", fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>LAST ACTION</div>
                    <div style={{ color: "#8aaa80", fontSize: "11px", lineHeight: 1.4 }}>{agent.lastAction}</div>
                  </div>
                  <div style={{ marginTop: "10px", color: "#2a4030", fontSize: "10px" }}>MODEL: {agent.model}</div>
                </div>
              ))}
            </div>

            {/* Selected agent detail */}
            {selectedAgent && (
              <div className="fade-in" style={{ background: "#0a0f0c", border: `1px solid ${selectedAgent.color}44`, padding: "20px", marginBottom: "16px" }}>
                <div style={{ color: selectedAgent.color, letterSpacing: "2px", fontSize: "11px", marginBottom: "12px" }}>
                  {selectedAgent.icon} {selectedAgent.name.toUpperCase()} — AGENT DETAIL
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <div style={{ color: "#3a5a40", fontSize: "10px", letterSpacing: "1px", marginBottom: "6px" }}>CAPABILITIES</div>
                    {selectedAgent.id === "writer" && (
                      <div style={{ color: "#8aaa80", fontSize: "12px", lineHeight: 1.8 }}>
                        → Reads tender specification PDF/text<br/>
                        → Extracts requirements & evaluation criteria<br/>
                        → Generates structured bid with Claude AI<br/>
                        → Flags gaps needing human input<br/>
                        → Learns from past winning bids
                      </div>
                    )}
                    {selectedAgent.id === "scout" && (
                      <div style={{ color: "#8aaa80", fontSize: "12px", lineHeight: 1.8 }}>
                        → Monitors Contracts Finder API (live)<br/>
                        → Monitors Find a Tender Service (FTS)<br/>
                        → Scores tenders against capability profile<br/>
                        → Runs every 6 hours via Vercel Cron<br/>
                        → Pushes matches to dashboard with confidence %
                      </div>
                    )}
                    {["supply","audit","optimizer","risk"].includes(selectedAgent.id) && (
                      <div style={{ color: "#8aaa80", fontSize: "12px", lineHeight: 1.8 }}>
                        → {selectedAgent.role}<br/>
                        → Runs autonomously on schedule<br/>
                        → Human approval required before action<br/>
                        → Logs all activity to dashboard<br/>
                        → Integrates with live data sources
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ color: "#3a5a40", fontSize: "10px", letterSpacing: "1px", marginBottom: "6px" }}>INTEGRATION REQUIREMENTS</div>
                    <div style={{ color: "#8aaa80", fontSize: "12px", lineHeight: 1.8 }}>
                      {selectedAgent.id === "writer" && <>→ ANTHROPIC_API_KEY (Vercel env var)<br/>→ Supabase — bid storage<br/>→ No other deps<br/>→ <span style={{color:"#00ff88"}}>Ready to deploy ✓</span></>}
                      {selectedAgent.id === "scout" && <>→ Contracts Finder API key (free)<br/>→ FTS registration (free)<br/>→ Vercel Cron (Pro — you have this ✓)<br/>→ Supabase — tender storage</>}
                      {selectedAgent.id === "supply" && <>→ Companies House API (free)<br/>→ Supabase — contractor DB<br/>→ Optional: LinkedIn API</>}
                      {selectedAgent.id === "audit" && <>→ ANTHROPIC_API_KEY<br/>→ Supabase — audit storage<br/>→ Optional: energy data APIs</>}
                      {selectedAgent.id === "optimizer" && <>→ ANTHROPIC_API_KEY<br/>→ Supabase — historical bid data<br/>→ Min. 5 bids to analyse</>}
                      {selectedAgent.id === "risk" && <>→ Supabase — pipeline data<br/>→ Vercel Cron — hourly checks<br/>→ Email/Slack webhook for alerts</>}
                    </div>
                  </div>
                </div>
                {selectedAgent.id === "writer" && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid #1a2820", paddingTop: "16px" }}>
                    <button className="bid-btn" onClick={() => setActiveTab("bidwriter")}
                      style={{ background: "transparent", border: "1px solid #00ff88", color: "#00ff88", padding: "8px 20px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "2px" }}>
                      OPEN BID WRITER →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Deployment checklist */}
            <div style={{ background: "#0a0f0c", border: "1px solid #1a2820", padding: "20px" }}>
              <div style={{ color: "#4a6a50", fontSize: "10px", letterSpacing: "2px", marginBottom: "16px" }}>DEPLOYMENT CHECKLIST — VERCEL</div>
              {[
                { done: true, label: "Vercel Pro — Cron Jobs enabled", note: "✓ You have this" },
                { done: false, label: "ANTHROPIC_API_KEY — add to Vercel env vars", note: "Settings → Environment Variables" },
                { done: false, label: "Supabase project — create free account", note: "supabase.com → New Project" },
                { done: false, label: "NEXT_PUBLIC_SUPABASE_URL — add to Vercel env vars", note: "From Supabase dashboard" },
                { done: false, label: "Contracts Finder API key — register free", note: "contractsfinder.service.gov.uk" },
                { done: false, label: "Add vercel.json cron config — for Tender Scout", note: "I'll generate this for you" },
                { done: false, label: "Drop agent components into GreenStack repo", note: "Universe tab → already in nav ✓" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                  <span style={{ color: item.done ? "#00ff88" : "#2a4030", fontSize: "14px", marginTop: "1px" }}>{item.done ? "✓" : "○"}</span>
                  <div>
                    <div style={{ color: item.done ? "#8aaa80" : "#6a8a70", fontSize: "12px" }}>{item.label}</div>
                    <div style={{ color: "#2a4030", fontSize: "11px" }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BID WRITER TAB */}
        {activeTab === "bidwriter" && (
          <div className="fade-in">
            <div style={{ marginBottom: "20px" }}>
              <div style={{ color: "#00d4ff", fontSize: "11px", letterSpacing: "2px", marginBottom: "4px" }}>✍ BID WRITER — POWERED BY CLAUDE AI</div>
              <div style={{ color: "#3a5a40", fontSize: "12px" }}>Select a tender, add context, and let the AI draft your bid section.</div>
            </div>

            {/* Tender selector */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ color: "#4a6a50", fontSize: "10px", letterSpacing: "2px", marginBottom: "10px" }}>SELECT TENDER</div>
              {MOCK_TENDERS.map(t => (
                <div key={t.id} className={`tender-row ${bidTender?.id === t.id ? "selected" : ""}`}
                  style={{ background: "#0a0f0c", border: "1px solid #1a2820", borderLeft: "3px solid transparent", padding: "12px 16px", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  onClick={() => setBidTender(t)}>
                  <div>
                    <div style={{ color: "#c8d8c0", fontSize: "12px", marginBottom: "4px" }}>{t.title}</div>
                    <div style={{ color: "#3a5a40", fontSize: "11px" }}>{t.sector} · Due {t.deadline}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#00ff88", fontSize: "13px", fontWeight: 600 }}>{t.value}</div>
                    <div style={{ color: t.match >= 90 ? "#00ff88" : t.match >= 80 ? "#ffaa00" : "#ff6688", fontSize: "11px" }}>{t.match}% match</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Context input */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ color: "#4a6a50", fontSize: "10px", letterSpacing: "2px", marginBottom: "10px" }}>ADD CONTEXT FOR THE AI</div>
              <textarea
                value={bidPrompt}
                onChange={e => setBidPrompt(e.target.value)}
                placeholder="e.g. We have delivered 3 similar projects in the North West. Our lead consultant has 15 years NHS experience. We have ISO 14001 certification. We can mobilise within 2 weeks..."
                style={{
                  width: "100%", minHeight: "100px", background: "#0a0f0c", border: "1px solid #1a2820",
                  color: "#c8d8c0", padding: "12px", fontFamily: "inherit", fontSize: "12px",
                  resize: "vertical", boxSizing: "border-box", lineHeight: 1.6
                }}
              />
            </div>

            <button className="bid-btn" onClick={runBidWriter} disabled={!bidTender || bidLoading}
              style={{
                background: "transparent", border: `1px solid ${bidTender ? "#00ff88" : "#1a2820"}`,
                color: bidTender ? "#00ff88" : "#2a4030", padding: "12px 28px", cursor: bidTender ? "pointer" : "not-allowed",
                fontFamily: "inherit", fontSize: "11px", letterSpacing: "2px", marginBottom: "24px"
              }}>
              {bidLoading ? "⟳ GENERATING BID..." : "⬡ GENERATE BID SECTION"}
            </button>

            {/* Output */}
            {(bidLoading || bidOutput) && (
              <div ref={bidRef} className="fade-in" style={{ background: "#0a0f0c", border: "1px solid #00d4ff33", padding: "20px" }}>
                <div style={{ color: "#00d4ff", fontSize: "10px", letterSpacing: "2px", marginBottom: "16px" }}>
                  ✍ CLAUDE AI OUTPUT — {bidTender?.title?.toUpperCase()}
                </div>
                {bidLoading ? (
                  <div style={{ color: "#4a6a50", fontSize: "12px" }}>
                    <span className="blink">▮</span> Analysing tender specification and generating bid...
                  </div>
                ) : (
                  <div style={{ color: "#c8d8c0", fontSize: "12px", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                    {bidOutput}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LIVE TENDERS TAB */}
        {activeTab === "tenders" && (
          <div className="fade-in">
            <div style={{ color: "#4a6a50", fontSize: "10px", letterSpacing: "2px", marginBottom: "16px" }}>
              ◈ LIVE TENDER MATCHES — AI SCORED
            </div>
            {MOCK_TENDERS.map(t => (
              <div key={t.id} style={{ background: "#0a0f0c", border: "1px solid #1a2820", padding: "20px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ color: "#c8d8c0", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>{t.title}</div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <span style={{ color: "#3a5a40", fontSize: "11px" }}>📍 {t.sector}</span>
                      <span style={{ color: "#3a5a40", fontSize: "11px" }}>⏱ Due {t.deadline}</span>
                      <span style={{ background: "#0d1a10", color: "#00ff88", padding: "2px 8px", fontSize: "10px", letterSpacing: "1px" }}>
                        {t.status === "draft" ? "DRAFT STARTED" : t.status === "drafting" ? "DRAFTING" : "NEW MATCH"}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#00ff88", fontSize: "18px", fontWeight: 600 }}>{t.value}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginTop: "4px" }}>
                      <div style={{ width: "60px", height: "3px", background: "#1a2820", borderRadius: "2px" }}>
                        <div style={{ width: `${t.match}%`, height: "100%", background: t.match >= 90 ? "#00ff88" : t.match >= 80 ? "#ffaa00" : "#ff6688", borderRadius: "2px" }} />
                      </div>
                      <span style={{ color: t.match >= 90 ? "#00ff88" : "#ffaa00", fontSize: "12px" }}>{t.match}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="bid-btn" onClick={() => { setBidTender(t); setActiveTab("bidwriter"); }}
                    style={{ background: "transparent", border: "1px solid #00ff8844", color: "#00ff88", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: "10px", letterSpacing: "1px" }}>
                    DRAFT BID →
                  </button>
                  <button style={{ background: "transparent", border: "1px solid #1a2820", color: "#4a6a50", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: "10px", letterSpacing: "1px" }}>
                    VIEW FULL BRIEF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div className="fade-in">
            <div style={{ color: "#4a6a50", fontSize: "10px", letterSpacing: "2px", marginBottom: "16px" }}>
              ▣ AGENT ACTIVITY FEED — LIVE
            </div>
            {activityLog.map((entry, i) => (
              <div key={i} className="fade-in" style={{ display: "flex", gap: "12px", marginBottom: "10px", background: "#0a0f0c", border: "1px solid #1a2820", padding: "12px 16px" }}>
                <span style={{ color: entry.color, fontSize: "16px", marginTop: "1px" }}>{entry.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#c8d8c0", fontSize: "12px", lineHeight: 1.5 }}>{entry.msg}</div>
                  <div style={{ color: "#2a4030", fontSize: "10px", marginTop: "4px" }}>{entry.time} · {entry.agent.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
