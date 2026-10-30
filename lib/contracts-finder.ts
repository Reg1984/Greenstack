/**
 * UK public tenders — Contracts Finder + Find a Tender.
 *
 * Since the Procurement Act 2023 (Feb 2025) Find a Tender is the main UK notice
 * platform; Contracts Finder still carries some lower-value notices.
 *
 * Neither API supports keyword search: Contracts Finder silently ignores `keyword`
 * and `cpvCode` (confirmed 2026-10-30 — a nonsense keyword returns the same list),
 * so every "search" VERDANT ran used to return the same ~100 recent notices of any
 * kind. We fetch recent tender notices in a few paged requests and match division
 * keywords locally. Contracts Finder also rate-limits at 12 requests per window.
 */

export type Division = 'climate' | 'education' | 'impact'

export interface ContractsFinderTender {
  id: string
  title: string
  description: string
  division: Division
  source: 'contracts_finder' | 'find_a_tender'
  /** 'planning' = market engagement / pipeline notice: contact the buyer before the tender opens */
  stage: 'tender' | 'planning'
  /** 0 means the notice published no value — price it from scratch, don't treat it as £0 */
  value: number
  deadline: string
  sector: string
  authority: string
  location: string
  url: string
  published: string
  cpvCodes: string[]
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ─── Division matching ───────────────────────────────────────────────────────
// Titles are matched broadly. Descriptions only on strict phrases, because nearly
// every UK notice description carries boilerplate ("tender evaluation criteria",
// "carbon reduction plan", "social value") that would otherwise match everything.

const TITLE_TERMS: Record<Division, string[]> = {
  impact: [
    'evaluation', 'monitoring and evaluation', 'theory of change', 'logic model', 'evidence review',
    'literature review', 'evidence synthesis', 'social value', 'social research', 'policy research',
    'impact assessment', 'outcomes framework', 'learning partner', 'research and analysis', 'research services',
  ],
  education: [
    'curriculum', 'school improvement', 'education research', 'education consultancy', 'educational',
    'send review', 'special educational needs', 'inclusion', 'attendance', 'attainment', 'teaching and learning',
    'pedagog', 'early years', 'education strategy', 'education programme', 'teacher development',
    'professional development', 'skills strategy', 'learning outcomes',
  ],
  climate: [
    'net zero', 'carbon', 'decarbonis', 'decarboniz', 'sustainab', 'climate', 'energy efficiency',
    'energy audit', 'esos', 'emissions', 'biodiversity', 'nature recovery', 'esg', 'tcfd', 'csrd',
    'green procurement', 'heat network strategy', 'environmental consultancy', 'environmental impact',
  ],
}

const DESC_TERMS: Record<Division, string[]> = {
  impact: [
    'programme evaluation', 'process evaluation', 'impact evaluation', 'economic evaluation', 'evaluation of the',
    'monitoring, evaluation and learning', 'monitoring and evaluation framework', 'theory of change',
    'evidence review', 'literature review', 'evidence synthesis', 'social research',
  ],
  education: [
    'curriculum development', 'curriculum review', 'school improvement', 'education research',
    'special educational needs', 'teaching and learning', 'pupil outcomes', 'attainment gap',
  ],
  climate: [
    'net zero strategy', 'net zero roadmap', 'decarbonisation strategy', 'decarbonisation plan',
    'carbon footprint', 'carbon management plan', 'climate action plan', 'climate change strategy',
    'energy audit', 'sustainability strategy', 'scope 3',
  ],
}

const DIVISION_CPV: Record<Division, string[]> = {
  impact: ['79419000', '79315000', '73110000'],
  education: ['80410000', '79311000'],
  climate: ['71314000', '90700000', '90711000', '71313000'],
}

const PRIORITY: Division[] = ['impact', 'education', 'climate']

// Hard filter on the TITLE only — these are almost never consultancy
const REJECT_TITLE_KEYWORDS = [
  'supply of', 'installation', 'maintenance', 'repair',
  'staffing', 'recruitment', 'software licence', 'hardware', 'construction',
  'civil engineering', 'vehicle', 'catering', 'cleaning', 'security guard',
  'legal service', 'audit service', 'it service desk', 'managed service',
  'printing', 'furniture', 'equipment supply', 'medical', 'clinical',
  'tutoring', 'supply teacher', 'school meals', 'home to school', 'demolition',
]

/** The division a notice belongs to, or null if it isn't consultancy GreenStack does. */
export function matchDivision(title: string, description: string, cpvCodes: string[] = []): Division | null {
  const t = title.toLowerCase()
  if (REJECT_TITLE_KEYWORDS.some(kw => t.includes(kw))) return null
  const d = description.toLowerCase()
  for (const div of PRIORITY) if (TITLE_TERMS[div].some(s => t.includes(s))) return div
  for (const div of PRIORITY) if (DESC_TERMS[div].some(s => d.includes(s))) return div
  for (const div of PRIORITY) if (cpvCodes.some(c => DIVISION_CPV[div].includes(c))) return div
  return null
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

function toTender(release: any, source: ContractsFinderTender['source']): ContractsFinderTender | null {
  const tender = release?.tender
  if (!tender?.title) return null
  const description: string = tender.description ?? ''
  const cpvCodes: string[] = [
    tender?.classification?.id,
    ...(tender?.items ?? []).flatMap((i: any) => [i?.classification?.id, ...(i?.additionalClassifications ?? []).map((c: any) => c?.id)]),
  ].filter(Boolean)

  const division = matchDivision(tender.title, description, cpvCodes)
  if (!division) return null

  const deadline = tender?.tenderPeriod?.endDate ?? ''
  const tags: string[] = release?.tag ?? []
  const url = source === 'find_a_tender'
    ? `https://www.find-tender.service.gov.uk/Notice/${release.id}`
    : `https://www.contractsfinder.service.gov.uk/Notice/${String(release.ocid ?? '').replace('ocds-b5fd17-', '')}`

  return {
    id: release.ocid ?? release.id,
    title: tender.title,
    description,
    division,
    source,
    stage: tags.some(t => t.startsWith('planning')) ? 'planning' : 'tender',
    value: parseFloat(tender?.value?.amount ?? 0) || 0,
    deadline: deadline ? new Date(deadline).toLocaleDateString('en-GB') : 'TBC',
    sector: tender?.mainProcurementCategory ?? 'Services',
    authority: release?.buyer?.name ?? 'Unknown Authority',
    location: 'UK',
    url,
    published: release?.date ?? new Date().toISOString(),
    cpvCodes,
  }
}

/** All open Contracts Finder tender notices from the last 14 days — one request, two at most. */
async function fetchContractsFinderNotices(): Promise<ContractsFinderTender[]> {
  const since = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
  const out: ContractsFinderTender[] = []
  let publishedTo = ''
  for (let page = 0; page < 2; page++) {
    try {
      const url = `https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?publishedFrom=${since}&stages=tender&limit=100${publishedTo}`
      const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) break
      const releases: any[] = (await res.json())?.releases ?? []
      for (const r of releases) {
        const t = toTender(r, 'contracts_finder')
        if (t) out.push(t)
      }
      if (releases.length < 100) break
      publishedTo = `&publishedTo=${encodeURIComponent(releases[releases.length - 1].date)}`
    } catch {
      break
    }
  }
  return out
}

/** New tender and planning notices on Find a Tender from the last 3 days, via cursor paging. */
async function fetchFindATenderNotices(maxPages = 8): Promise<ContractsFinderTender[]> {
  const since = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 19)
  let url: string | undefined = `https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages?updatedFrom=${since}&limit=100`
  const out: ContractsFinderTender[] = []
  for (let page = 0; page < maxPages && url; page++) {
    try {
      const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) break
      const data = await res.json()
      for (const r of data?.releases ?? []) {
        const tags: string[] = r?.tag ?? []
        if (!tags.some(t => t === 'tender' || t === 'planning')) continue
        const t = toTender(r, 'find_a_tender')
        if (t) out.push(t)
      }
      url = data?.links?.next
    } catch {
      break
    }
  }
  return out
}

export async function fetchContractsFinder(): Promise<ContractsFinderTender[]> {
  const results = await Promise.allSettled([fetchContractsFinderNotices(), fetchFindATenderNotices()])
  const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

  // Deduplicate by id, then by title+buyer (the same notice can appear on both platforms)
  const seen = new Set<string>()
  return all.filter(t => {
    const key2 = `${t.title.toLowerCase()}|${t.authority.toLowerCase()}`
    if (seen.has(t.id) || seen.has(key2)) return false
    seen.add(t.id)
    seen.add(key2)
    return true
  })
}

/** Fetch from devolved UK procurement portals via keyword search */
export async function fetchDevolvedTenders(): Promise<Array<{
  title: string; authority: string; url: string; region: string; description: string
}>> {
  const portals = [
    {
      region: 'Scotland',
      searchUrl: 'https://www.publiccontractsscotland.gov.uk/search/Search_Keyword.aspx?k=evaluation+education+net+zero',
    },
    {
      region: 'Wales',
      searchUrl: 'https://www.sell2wales.gov.wales/search/search_mainpage.aspx',
    },
    {
      region: 'Northern Ireland',
      searchUrl: 'https://etendersni.gov.uk/epps/cft/listContractNotices.do',
    },
  ]

  // These are scraped via VERDANT's browse_url tool during the cycle
  // Return portal URLs as directives rather than live-scraping here
  return portals.map(p => ({
    title: `Search ${p.region} procurement portal`,
    authority: p.region,
    url: p.searchUrl,
    region: p.region,
    description: `Browse ${p.region} tenders for climate, education and evaluation consultancy at: ${p.searchUrl}`,
  }))
}
