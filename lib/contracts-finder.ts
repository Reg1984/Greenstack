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

const CPV_CODES = [
  '09330000', // Solar energy
  '09331200', // Solar photovoltaic modules
  '45261215', // Solar panel roof-covering work
  '09332000', // Solar installation
  '09300000', // Electricity, heating, solar and nuclear energy
  '71314000', // Energy and related services
  '90711000', // Environmental impact assessment
  '71313000', // Environmental engineering consultancy services
  '90700000', // Environmental services
  '79411000', // General management consultancy
  '73200000', // Research and development consultancy
]

// Consultancy-first ordering — these match GreenStack AI's primary revenue stream
const KEYWORDS = [
  'sustainability consultancy',
  'net zero',
  'carbon reduction',
  'ESOS',
  'energy audit',
  'decarbonisation',
  'ESG',
  'carbon footprint',
  'energy efficiency',
  'net zero roadmap',
  'sustainability strategy',
  'renewable energy',
  'solar PV',
  'battery storage',
  'EV charging',
]

export async function fetchContractsFinder(): Promise<ContractsFinderTender[]> {
  const tenders: ContractsFinderTender[] = []

  for (const keyword of KEYWORDS.slice(0, 8)) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const url = `https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?publishedFrom=${sevenDaysAgo}&keyword=${encodeURIComponent(keyword)}&size=10`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      })

      if (!res.ok) continue

      const data = await res.json()
      const releases = data?.releases ?? []

      for (const release of releases) {
        const tender = release?.tender
        const awards = release?.awards?.[0]
        const buyer = release?.buyer

        if (!tender?.title) continue

        const value = tender?.value?.amount
          ?? awards?.value?.amount
          ?? 0

        const deadline = tender?.tenderPeriod?.endDate
          ?? tender?.contractPeriod?.endDate
          ?? ''

        tenders.push({
          id: release?.ocid ?? Math.random().toString(),
          title: tender.title,
          description: tender?.description ?? '',
          value: parseFloat(value) || 0,
          deadline: deadline ? new Date(deadline).toLocaleDateString('en-GB') : 'TBC',
          sector: tender?.mainProcurementCategory ?? 'Services',
          authority: buyer?.name ?? 'Unknown Authority',
          location: release?.planning?.budget?.description ?? 'UK',
          url: release?.ocid
            ? `https://www.contractsfinder.service.gov.uk/Notice/${release.ocid.replace('ocds-b5fd17-', '')}`
            : `https://www.contractsfinder.service.gov.uk/Search/Results`,
          published: release?.date ?? new Date().toISOString(),
          cpvCodes: tender?.items?.map((i: any) => i?.additionalClassifications?.[0]?.id).filter(Boolean) ?? [],
        })
      }
    } catch {
      continue
    }
  }

  // Deduplicate by id
  const seen = new Set()
  return tenders.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}
