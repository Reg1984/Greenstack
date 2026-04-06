/**
 * International tender sources
 * - GIZ (via UNGM — UN Global Marketplace)
 * - World Bank procurement
 * - UNDP, UNEP and other UN agencies (via UNGM)
 */

export interface InternationalTender {
  id: string
  title: string
  description: string
  value: number
  deadline: string
  organisation: string
  country: string
  url: string
  source: 'ungm' | 'worldbank' | 'giz'
  published: string
}

/** Fetch with a hard timeout — prevents any single external API from blocking the cycle */
async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const SUSTAINABILITY_KEYWORDS = [
  'sustainability',
  'net zero',
  'climate',
  'energy efficiency',
  'carbon',
  'ESG',
  'renewable',
  'green',
  'decarbonisation',
  'environmental',
]

// World Bank procurement API — consulting contracts
export async function fetchWorldBankTenders(): Promise<InternationalTender[]> {
  const tenders: InternationalTender[] = []

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const url = `https://search.worldbank.org/api/v2/procurement?format=json&rows=20&fl=id,project_name,contract_description,procurement_method,contact_country_name,submission_date,totalamt,contact_email&fq=procurement_category:consulting&fq=submission_date:[${thirtyDaysAgo}T00:00:00Z TO NOW]`

    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) return []

    const data = await res.json()
    const docs = data?.procurement?.docs ?? []

    for (const doc of docs) {
      const title = doc.project_name ?? doc.contract_description ?? ''
      if (!title) continue

      // Filter for sustainability relevance
      const isRelevant = SUSTAINABILITY_KEYWORDS.some(kw =>
        title.toLowerCase().includes(kw) ||
        (doc.contract_description ?? '').toLowerCase().includes(kw)
      )
      if (!isRelevant) continue

      tenders.push({
        id: `wb-${doc.id}`,
        title,
        description: doc.contract_description ?? '',
        value: parseFloat(doc.totalamt) || 0,
        deadline: doc.submission_date ? new Date(doc.submission_date).toLocaleDateString('en-GB') : 'TBC',
        organisation: 'World Bank',
        country: doc.contact_country_name ?? 'International',
        url: `https://projects.worldbank.org/en/projects-operations/procurement-detail/${doc.id}`,
        source: 'worldbank',
        published: doc.submission_date ?? new Date().toISOString(),
      })
    }
  } catch {
    // Non-fatal — international feeds are supplementary
  }

  return tenders
}

// UNGM (UN Global Marketplace) — includes GIZ, UNDP, UNEP, WHO contracts
export async function fetchUNGMTenders(): Promise<InternationalTender[]> {
  const tenders: InternationalTender[] = []

  try {
    // UNGM public notice search — run keywords in parallel, not sequential
    const keywords = ['sustainability', 'climate change']
    const results = await Promise.allSettled(keywords.map(async keyword => {
      const url = `https://www.ungm.org/Public/Notice/Search?keyword=${encodeURIComponent(keyword)}&pageSize=10&page=1`
      const res = await fetchWithTimeout(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        cache: 'no-store',
      })
      if (!res.ok) return []
      const data = await res.json()
      return data?.Notices ?? data?.notices ?? data?.data ?? []
    }))

    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      for (const notice of result.value) {
        const title = notice.Title ?? notice.title ?? ''
        if (!title) continue
        tenders.push({
          id: `ungm-${notice.NoticeId ?? notice.id ?? Math.random()}`,
          title,
          description: notice.Description ?? notice.description ?? '',
          value: 0,
          deadline: notice.DeadlineDate
            ? new Date(notice.DeadlineDate).toLocaleDateString('en-GB')
            : notice.deadline ?? 'TBC',
          organisation: notice.AgencyName ?? notice.agency ?? 'UN Agency',
          country: notice.CountryName ?? notice.country ?? 'International',
          url: notice.NoticeId
            ? `https://www.ungm.org/Public/Notice/${notice.NoticeId}`
            : 'https://www.ungm.org/Public/Notice',
          source: 'ungm',
          published: notice.PublishedDate ?? new Date().toISOString(),
        })
      }
    }
  } catch {
    // Non-fatal
  }

  return tenders
}

// GIZ-specific: fetch from their public tender RSS / listing
// GIZ publishes via DTVP and their own portal — we use UNGM + direct knowledge
export async function fetchGIZTenders(): Promise<InternationalTender[]> {
  const tenders: InternationalTender[] = []

  try {
    // GIZ publishes international tenders via their website's JSON feed
    const url = 'https://www.giz.de/en/workwithgiz/tenders.html'
    const res = await fetch(url, {
      headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })

    if (!res.ok) return []

    // Parse tender links from GIZ page — they use a structured list
    const html = await res.text()
    const titleMatches = [...html.matchAll(/href="(\/en\/html\/\d+\.html)"[^>]*>([^<]+)</g)]

    for (const match of titleMatches.slice(0, 10)) {
      const path = match[1]
      const title = match[2]?.trim()
      if (!title || title.length < 10) continue

      const isRelevant = SUSTAINABILITY_KEYWORDS.some(kw => title.toLowerCase().includes(kw))
      if (!isRelevant) continue

      tenders.push({
        id: `giz-${path}`,
        title,
        description: 'GIZ international tender — see link for full specification',
        value: 0,
        deadline: 'See tender',
        organisation: 'GIZ (Deutsche Gesellschaft für Internationale Zusammenarbeit)',
        country: 'International',
        url: `https://www.giz.de${path}`,
        source: 'giz',
        published: new Date().toISOString(),
      })
    }
  } catch {
    // Non-fatal
  }

  return tenders
}

export async function fetchAllInternationalTenders(): Promise<InternationalTender[]> {
  const [worldBank, ungm, giz] = await Promise.all([
    fetchWorldBankTenders(),
    fetchUNGMTenders(),
    fetchGIZTenders(),
  ])

  return [...worldBank, ...ungm, ...giz]
}
