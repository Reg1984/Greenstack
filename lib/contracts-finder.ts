export interface ContractsFinderTender {
  id: string
  title: string
  description: string
  value: number
  deadline: string
  sector: string
  authority: string
  location: string
  url: string
  published: string
  cpvCodes: string[]
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// CPV codes for sustainability/consultancy — used both for filtering and for direct CPV queries
const SUSTAINABILITY_CPV_CODES = [
  '71314000', // Energy and related services consultancy
  '90700000', // Environmental services
  '90711000', // Environmental impact assessment
  '71313000', // Environmental engineering consultancy
  '79410000', // Business and management consultancy
  '79411000', // General management consultancy
  '73200000', // Research and development consultancy
  '71241000', // Feasibility study and programme spec
  '79419000', // Evaluation consultancy services
]

// Consultancy-focused keywords — ordered by specificity and value
const SUSTAINABILITY_KEYWORDS = [
  'sustainability consultancy',
  'net zero roadmap',
  'carbon reduction strategy',
  'ESG reporting',
  'ESOS compliance',
  'energy audit',
  'decarbonisation strategy',
  'carbon footprint assessment',
  'net zero strategy',
  'sustainability strategy',
  'energy efficiency consultancy',
  'TCFD report',
  'CSRD compliance',
  'low carbon',
  'estate decarbonisation',
  'sustainability report',
  'green procurement strategy',
  'carbon management',
  'climate change strategy',
  'energy management consultancy',
]

// Education-specific sustainability keywords
const EDUCATION_KEYWORDS = [
  'school sustainability',
  'academy trust net zero',
  'university decarbonisation',
  'college energy audit',
  'education estate sustainability',
  'school carbon footprint',
]

// Hard filter — titles containing these are almost never consultancy
const REJECT_TITLE_KEYWORDS = [
  'transport', 'delivery', 'supply of', 'installation', 'maintenance', 'repair',
  'staffing', 'recruitment', 'software licence', 'hardware', 'construction',
  'civil engineering', 'vehicle', 'catering', 'cleaning', 'security guard',
  'legal service', 'audit service', 'it service desk', 'managed service',
  'printing', 'furniture', 'equipment supply', 'medical', 'clinical',
]

function isRelevantTender(title: string, description: string): boolean {
  const combined = `${title} ${description}`.toLowerCase()
  return !REJECT_TITLE_KEYWORDS.some(kw => combined.includes(kw))
}

async function queryContractsFinder(params: {
  keyword?: string
  cpvCode?: string
  daysBack?: number
}): Promise<ContractsFinderTender[]> {
  const tenders: ContractsFinderTender[] = []

  try {
    const daysBack = params.daysBack ?? 14
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    let url = `https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?publishedFrom=${since}&size=15`
    if (params.keyword) url += `&keyword=${encodeURIComponent(params.keyword)}`
    if (params.cpvCode) url += `&cpvCode=${params.cpvCode}`

    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) return []

    const data = await res.json()
    const releases = data?.releases ?? []

    for (const release of releases) {
      const tender = release?.tender
      const awards = release?.awards?.[0]
      const buyer = release?.buyer

      if (!tender?.title) continue
      if (!isRelevantTender(tender.title, tender?.description ?? '')) continue

      const value = parseFloat(tender?.value?.amount ?? awards?.value?.amount ?? 0) || 0
      const deadline = tender?.tenderPeriod?.endDate ?? tender?.contractPeriod?.endDate ?? ''

      tenders.push({
        id: release?.ocid ?? Math.random().toString(),
        title: tender.title,
        description: tender?.description ?? '',
        value,
        deadline: deadline ? new Date(deadline).toLocaleDateString('en-GB') : 'TBC',
        sector: tender?.mainProcurementCategory ?? 'Services',
        authority: buyer?.name ?? 'Unknown Authority',
        location: release?.planning?.budget?.description ?? 'UK',
        url: release?.ocid
          ? `https://www.contractsfinder.service.gov.uk/Notice/${release.ocid.replace('ocds-b5fd17-', '')}`
          : 'https://www.contractsfinder.service.gov.uk/Search/Results',
        published: release?.date ?? new Date().toISOString(),
        cpvCodes: tender?.items?.map((i: any) => i?.additionalClassifications?.[0]?.id).filter(Boolean) ?? [],
      })
    }
  } catch {
    // Non-fatal
  }

  return tenders
}

export async function fetchContractsFinder(): Promise<ContractsFinderTender[]> {
  const allTenders: ContractsFinderTender[] = []

  // Run keyword queries and CPV code queries in parallel batches
  const keywordBatch = SUSTAINABILITY_KEYWORDS.slice(0, 8).map(kw =>
    queryContractsFinder({ keyword: kw })
  )

  const educationBatch = EDUCATION_KEYWORDS.slice(0, 3).map(kw =>
    queryContractsFinder({ keyword: kw })
  )

  const cpvBatch = SUSTAINABILITY_CPV_CODES.slice(0, 4).map(cpv =>
    queryContractsFinder({ cpvCode: cpv })
  )

  const results = await Promise.allSettled([
    ...keywordBatch,
    ...educationBatch,
    ...cpvBatch,
  ])

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTenders.push(...result.value)
    }
  }

  // Deduplicate by id
  const seen = new Set<string>()
  return allTenders.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}

/** Fetch from devolved UK procurement portals via keyword search */
export async function fetchDevolvedTenders(): Promise<Array<{
  title: string; authority: string; url: string; region: string; description: string
}>> {
  const results: Array<{ title: string; authority: string; url: string; region: string; description: string }> = []

  const portals = [
    {
      region: 'Scotland',
      url: 'https://www.publiccontractsscotland.gov.uk/Search/Search_AuthProfile.aspx?ID=AA32108',
      searchUrl: 'https://www.publiccontractsscotland.gov.uk/search/Search_Keyword.aspx?k=sustainability+net+zero',
    },
    {
      region: 'Wales',
      url: 'https://www.sell2wales.gov.wales/search/search_mainpage.aspx',
      searchUrl: 'https://www.sell2wales.gov.wales/search/search_mainpage.aspx?k=sustainability',
    },
    {
      region: 'Northern Ireland',
      url: 'https://etendersni.gov.uk/epps/cft/listContractNotices.do',
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
    description: `Browse ${p.region} sustainability/net zero tenders at: ${p.searchUrl}`,
  }))
}
