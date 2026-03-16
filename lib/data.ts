// ── Tender data with lat/lng for globe ──
export const TENDERS = [
  { id: 1, title: "Manchester Airport Carbon Offset Programme", sector: "Aviation", value: 1200000, deadline: "14 Mar 2026", status: "bidding", match: 94, location: "Manchester", lat: 53.35, lng: -2.27, description: "Full carbon offset strategy for MAG operations across 3 airports. Includes Scope 1, 2, and 3 emissions baselining, offset procurement, and a 5-year monitoring plan aligned with CORSIA requirements.", tags: ["Carbon", "Strategy", "Multi-site"], requirements: ["ISO 14064 expertise", "Aviation sector experience", "CORSIA compliance knowledge"], timeline: "12 months delivery, 5-year monitoring" },
  { id: 2, title: "Leeds City Council LED Street Retrofit", sector: "Local Authority", value: 280000, deadline: "18 Mar 2026", status: "sourcing", match: 88, location: "Leeds", lat: 53.80, lng: -1.55, description: "City-wide LED replacement programme for 12,000 street lights across all Leeds wards. Must include smart dimming controls and a central management system.", tags: ["LED", "Street Lighting", "Infrastructure"], requirements: ["NICEIC certification", "Smart controls experience", "Council framework agreement"], timeline: "18 months phased rollout" },
  { id: 3, title: "NHS Trust Energy Management System", sector: "Healthcare", value: 560000, deadline: "22 Mar 2026", status: "reviewing", match: 91, location: "Sheffield", lat: 53.38, lng: -1.47, description: "BEMS installation across 4 hospital sites with ongoing monitoring contract. Real-time dashboards for facilities managers and automated fault detection.", tags: ["BEMS", "Healthcare", "Monitoring"], requirements: ["CIBSE accreditation", "NHS experience", "BMS Certified"], timeline: "9 months installation, 3-year monitoring" },
  { id: 4, title: "Sheffield Renewable Energy Audit", sector: "Local Authority", value: 95000, deadline: "28 Mar 2026", status: "submitted", match: 79, location: "Sheffield", lat: 53.38, lng: -1.47, description: "Comprehensive renewable energy feasibility audit for council estate covering 45 buildings. Solar, wind, and ground-source heat pump assessments.", tags: ["Audit", "Solar", "Wind"], requirements: ["MCS certification", "EPC assessment capability"], timeline: "3 months" },
  { id: 5, title: "Birmingham Schools Solar Installation", sector: "Education", value: 420000, deadline: "5 Apr 2026", status: "found", match: 85, location: "Birmingham", lat: 52.48, lng: -1.89, description: "Rooftop solar PV for 18 secondary schools across Birmingham. Includes battery storage and export metering for each site.", tags: ["Solar PV", "Education", "Multi-site"], requirements: ["MCS certification", "DBS clearance", "School premises experience"], timeline: "24 months phased" },
  { id: 6, title: "Liverpool Port Authority Decarbonisation", sector: "Transport", value: 890000, deadline: "10 Apr 2026", status: "found", match: 82, location: "Liverpool", lat: 53.41, lng: -2.98, description: "Full decarbonisation roadmap and implementation for port operations. Shore power installation, EV fleet transition, and hydrogen feasibility study.", tags: ["Decarbonisation", "Transport", "Strategy"], requirements: ["Port/maritime experience", "EV infrastructure", "Hydrogen knowledge"], timeline: "36 months" },
  { id: 7, title: "Bristol Council Heat Pump Programme", sector: "Local Authority", value: 340000, deadline: "15 Apr 2026", status: "found", match: 76, location: "Bristol", lat: 51.45, lng: -2.59, description: "Air source heat pump installation across 200 council properties. Must include resident engagement programme and training for maintenance teams.", tags: ["Heat Pump", "Residential", "Retrofit"], requirements: ["MCS HP certification", "TrustMark", "Social housing experience"], timeline: "18 months" },
  { id: 8, title: "Yorkshire Water Energy Optimisation", sector: "Utilities", value: 1100000, deadline: "20 Apr 2026", status: "found", match: 87, location: "Yorkshire", lat: 53.96, lng: -1.08, description: "Energy optimisation across 23 pumping stations and 8 treatment works. AI-driven predictive control, variable speed drives, and renewable self-generation.", tags: ["Water", "Utilities", "Optimisation"], requirements: ["Water industry experience", "SCADA integration", "VSD expertise"], timeline: "24 months" },
]

// ── Bid data ──
export const BIDS = [
  { id: 1, tender: "Manchester Airport Carbon Offset", status: "drafting", progress: 65, value: 1200000, submitted: null, aiScore: 91, lastEdit: "2 hours ago" },
  { id: 2, tender: "NHS Trust Energy Management System", status: "review", progress: 88, value: 560000, submitted: null, aiScore: 87, lastEdit: "Yesterday" },
  { id: 3, tender: "Sheffield Renewable Energy Audit", status: "submitted", progress: 100, value: 95000, submitted: "24 Feb 2026", aiScore: 82, lastEdit: "3 days ago" },
  { id: 4, tender: "Leeds City Council LED Retrofit", status: "sourcing", progress: 30, value: 280000, submitted: null, aiScore: 88, lastEdit: "4 hours ago" },
]

// ── Contractor data with score breakdowns ──
export const CONTRACTORS = [
  { id: 1, name: "GreenTech Installations Ltd", specialty: "Solar PV", region: "North West", rating: 4.8, jobs: 23, onTime: 96, score: 94, status: "preferred", insurance: "Valid", accreditations: ["MCS", "TrustMark", "NICEIC"], scores: { carbon: 95, compliance: 92, delivery: 96, cost: 88 } },
  { id: 2, name: "EcoRetrofit Solutions", specialty: "LED & Lighting", region: "Yorkshire", rating: 4.6, jobs: 41, onTime: 91, score: 89, status: "preferred", insurance: "Valid", accreditations: ["TrustMark", "NAPIT"], scores: { carbon: 85, compliance: 90, delivery: 91, cost: 92 } },
  { id: 3, name: "ClimateFirst Engineering", specialty: "BEMS", region: "National", rating: 4.9, jobs: 18, onTime: 98, score: 96, status: "preferred", insurance: "Valid", accreditations: ["CIBSE", "BMS Certified"], scores: { carbon: 98, compliance: 97, delivery: 98, cost: 82 } },
  { id: 4, name: "Northern Heat Solutions", specialty: "Heat Pumps", region: "North East", rating: 4.3, jobs: 31, onTime: 84, score: 76, status: "active", insurance: "Valid", accreditations: ["MCS", "TrustMark"], scores: { carbon: 78, compliance: 72, delivery: 84, cost: 88 } },
  { id: 5, name: "CarbonZero Consulting", specialty: "Carbon Strategy", region: "National", rating: 4.7, jobs: 55, onTime: 93, score: 91, status: "preferred", insurance: "Valid", accreditations: ["IEMA", "Carbon Trust"], scores: { carbon: 96, compliance: 88, delivery: 93, cost: 80 } },
  { id: 6, name: "SolarEdge North", specialty: "Solar PV", region: "Yorkshire", rating: 3.9, jobs: 14, onTime: 78, score: 61, status: "flagged", insurance: "Expiring", accreditations: ["MCS"], scores: { carbon: 65, compliance: 55, delivery: 78, cost: 90 } },
]

// ── Audit data with findings ──
export const AUDITS = [
  { id: 1, client: "Hargreaves Manufacturing", type: "Full Energy Audit", date: "Jan 2026", savings: "\u00A384K/yr", co2: "210 tCO\u2082e", status: "complete", score: 72, findings: ["Lighting accounts for 34% of consumption", "HVAC running outside hours", "No sub-metering in place", "EPC rating D - potential for B"] },
  { id: 2, client: "Leeds City Council", type: "Carbon Baseline", date: "Feb 2026", savings: "\u00A3340K/yr", co2: "890 tCO\u2082e", status: "complete", score: 58, findings: ["Gas heating 62% of carbon footprint", "Fleet vehicles Scope 1 dominant", "No renewable generation on-site", "Street lighting 18% of electricity"] },
  { id: 3, client: "Nexus Retail Group", type: "ISO 50001 Gap Analysis", date: "Feb 2026", savings: "\u00A3127K/yr", co2: "315 tCO\u2082e", status: "in-progress", score: null, findings: ["Energy policy needs updating", "Monitoring procedures incomplete", "Staff training gaps identified"] },
  { id: 4, client: "Sheffield Teaching Hospitals", type: "Net Zero Roadmap", date: "Mar 2026", savings: "TBC", co2: "TBC", status: "scheduled", score: null, findings: [] },
]

// ── Reports data ──
export const REPORTS = [
  { id: 1, title: "Q1 2026 Platform Performance", type: "Platform", date: "Feb 2026", bids: 47, wins: 16, value: "\u00A32.4M", winRate: "34%" },
  { id: 2, title: "Manchester Airport \u2014 Bid Submission", type: "Bid", date: "24 Feb 2026", bids: 1, wins: null, value: "\u00A31.2M", winRate: null },
  { id: 3, title: "AI Bid Optimisation Report", type: "AI Insights", date: "20 Feb 2026", bids: null, wins: null, value: null, winRate: null },
  { id: 4, title: "Supply Chain Health Check", type: "Supply Chain", date: "15 Feb 2026", bids: null, wins: null, value: null, winRate: null },
]

// ── Time-series data for charts ──
export const PIPELINE_MONTHLY = [
  { month: "Sep", value: 1200000, bids: 28, wins: 8 },
  { month: "Oct", value: 1450000, bids: 32, wins: 10 },
  { month: "Nov", value: 1680000, bids: 35, wins: 11 },
  { month: "Dec", value: 1900000, bids: 38, wins: 13 },
  { month: "Jan", value: 2100000, bids: 42, wins: 14 },
  { month: "Feb", value: 2400000, bids: 47, wins: 16 },
]

export const CARBON_MONTHLY = [
  { month: "Sep", saved: 420, target: 500 },
  { month: "Oct", saved: 580, target: 600 },
  { month: "Nov", saved: 710, target: 700 },
  { month: "Dec", saved: 890, target: 800 },
  { month: "Jan", saved: 1050, target: 900 },
  { month: "Feb", saved: 1280, target: 1000 },
]

export const ENERGY_MIX = [
  { name: "Solar PV", value: 35, color: "#ffd166" },
  { name: "Heat Pumps", value: 22, color: "#00ff87" },
  { name: "LED Retrofit", value: 18, color: "#60efff" },
  { name: "BEMS", value: 15, color: "#c084fc" },
  { name: "Other", value: 10, color: "#64748b" },
]

export const SAVINGS_BY_CATEGORY = [
  { category: "Lighting", savings: 184000, color: "#ffd166" },
  { category: "HVAC", savings: 320000, color: "#00ff87" },
  { category: "Solar", savings: 240000, color: "#60efff" },
  { category: "Controls", savings: 127000, color: "#c084fc" },
  { category: "Insulation", savings: 96000, color: "#fb923c" },
]

// ── Regional carbon data for globe heatmap ──
export const REGION_CARBON = [
  { name: "North West", lat: 53.5, lng: -2.5, saved: 890, intensity: 0.85 },
  { name: "Yorkshire", lat: 53.8, lng: -1.5, saved: 680, intensity: 0.7 },
  { name: "West Midlands", lat: 52.5, lng: -1.9, saved: 520, intensity: 0.55 },
  { name: "South West", lat: 51.5, lng: -2.6, saved: 340, intensity: 0.4 },
  { name: "East Midlands", lat: 52.9, lng: -1.1, saved: 280, intensity: 0.35 },
  { name: "North East", lat: 54.9, lng: -1.6, saved: 420, intensity: 0.5 },
  { name: "London", lat: 51.5, lng: -0.12, saved: 150, intensity: 0.2 },
  { name: "Scotland", lat: 56.5, lng: -4.0, saved: 200, intensity: 0.25 },
]

// ── Sector colours ──
export const SECTOR_COLORS: Record<string, { core: string; glow: string; ring: string }> = {
  "Local Authority": { core: "#60efff", glow: "#00d4ff", ring: "#60efff" },
  "Healthcare": { core: "#c084fc", glow: "#a855f7", ring: "#d8b4fe" },
  "Aviation": { core: "#00ff87", glow: "#00cc6a", ring: "#6effa0" },
  "Education": { core: "#ffd166", glow: "#f59e0b", ring: "#ffe499" },
  "Utilities": { core: "#fb923c", glow: "#ea580c", ring: "#fdba74" },
  "Transport": { core: "#f472b6", glow: "#db2777", ring: "#f9a8d4" },
  "Commercial": { core: "#818cf8", glow: "#6366f1", ring: "#a5b4fc" },
}

// ── Status map used across pages ──
export const STATUS_MAP: Record<string, { color: string; label: string }> = {
  found: { color: "blue", label: "Found" },
  reviewing: { color: "yellow", label: "Reviewing" },
  sourcing: { color: "cyan", label: "Sourcing" },
  bidding: { color: "emerald", label: "Bidding" },
  submitted: { color: "purple", label: "Submitted" },
}

// ── Utilities ──
export function fmt(n: number) {
  return n >= 1000000 ? `\u00A3${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `\u00A3${(n / 1000).toFixed(0)}K` : `\u00A3${n}`
}

export function fmtCO2(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K tCO\u2082e` : `${n} tCO\u2082e`
}

export function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export function randInt(min: number, max: number) {
  return Math.floor(rand(min, max))
}

// ── Lat/lng to 3D sphere position ──
export function latLngToSphere(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return [x, y, z]
}
