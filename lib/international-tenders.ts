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
  source: 'ungm' | 'worldbank' | 'giz' | 'gem' | 'ted'
  division?: 'climate' | 'education' | 'impact'
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

const WB_EDUCATION = /educat|school|teacher|curricul|learning|literacy|skills|tvet/i
const WB_IMPACT = /evaluation|monitoring|impact assessment|baseline|end-?line|survey|research|theory of change|learning agenda/i
const WB_CLIMATE = /climate|carbon|emission|energy efficiency|decarbon|net zero|renewable energy strategy|environmental (impact|assessment|management plan)/i

/** World Bank-financed consulting notices (every country, incl. India). The old
 * /v2/procurement endpoint 404s; /v2/procnotices is the live one (checked 2026-10-30). */
export async function fetchWorldBankTenders(): Promise<InternationalTender[]> {
  const tenders: InternationalTender[] = []

  try {
    const url = 'https://search.worldbank.org/api/v2/procnotices?format=json&rows=300&srt=noticedate&order=desc' +
      '&fl=id,bid_description,project_name,notice_type,submission_deadline_date,project_ctry_name,procurement_group,noticedate'
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 15000)
    if (!res.ok) return []

    const notices: any[] = (await res.json())?.procnotices ?? []
    for (const n of notices) {
      if (n.procurement_group !== 'CS') continue // consulting services only
      if (!/expression of interest|invitation for bids|prequalification/i.test(n.notice_type ?? '')) continue
      const title: string = n.bid_description ?? ''
      if (!title) continue
      const text = `${title} ${n.project_name ?? ''}`
      // Evaluation first (an evaluation of an education project is Impact work)
      const division = WB_IMPACT.test(title) ? 'impact' : WB_EDUCATION.test(text) ? 'education' : WB_CLIMATE.test(title) ? 'climate' : null
      if (!division) continue

      tenders.push({
        id: `wb-${n.id}`,
        title,
        description: `Project: ${n.project_name ?? 'n/a'} | ${n.notice_type}`,
        division,
        value: 0,
        deadline: n.submission_deadline_date ? new Date(n.submission_deadline_date).toLocaleDateString('en-GB') : 'TBC',
        organisation: 'World Bank-financed project',
        country: n.project_ctry_name ?? 'International',
        url: `https://projects.worldbank.org/en/projects-operations/procurement-detail/${n.id}`,
        source: 'worldbank',
        published: n.noticedate ?? new Date().toISOString(),
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

// EU service categories (CPV) for the three divisions. TED's free-text title search
// matches across translations ("monitoring" → cardiac monitors, "climate" → air
// conditioning), so we search by category instead.
const TED_CPV_DIVISION: Record<string, 'climate' | 'education' | 'impact'> = {
  '79419000': 'impact',    // evaluation consultancy
  '79315000': 'impact',    // social research
  '73110000': 'impact',    // research services
  '73210000': 'impact',    // research consultancy
  '80410000': 'education', // various school services
  '71314000': 'climate',   // energy and related services
  '90711000': 'climate',   // environmental impact assessment
  '90713000': 'climate',   // environmental issues consultancy
}

const pickLang = (field: any): string => {
  if (!field) return ''
  if (typeof field === 'string') return field
  const v = field.eng ?? Object.values(field)[0]
  return Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '')
}

/** TED (EU Official Journal) — open notices across Europe in our service categories.
 * Uses the v3 POST search API; the old GET /api/v3.0 call returned nothing. */
export async function fetchTEDTenders(): Promise<InternationalTender[]> {
  const tenders: InternationalTender[] = []

  try {
    const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10).replace(/-/g, '')
    const query = `(classification-cpv IN (${Object.keys(TED_CPV_DIVISION).join(' ')})) AND (publication-date >= ${since}) AND (notice-type IN (cn-standard cn-social pin-only))`
    const res = await fetchWithTimeout('https://api.ted.europa.eu/v3/notices/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query,
        fields: ['publication-number', 'notice-title', 'buyer-name', 'buyer-country', 'notice-type', 'classification-cpv', 'deadline-receipt-tender-date-lot', 'estimated-value-lot', 'estimated-value-cur-lot'],
        limit: 60,
      }),
      cache: 'no-store',
    }, 15000)
    if (!res.ok) return []

    for (const n of (await res.json())?.notices ?? []) {
      const title = pickLang(n['notice-title'])
      if (!title) continue
      const cpvs: string[] = n['classification-cpv'] ?? []
      const division = cpvs.map(c => TED_CPV_DIVISION[c]).find(Boolean)
      const deadline = (n['deadline-receipt-tender-date-lot'] ?? [])[0]
      const value = parseFloat((n['estimated-value-lot'] ?? [])[0] ?? '0') || 0
      const currency = (n['estimated-value-cur-lot'] ?? [])[0] ?? 'EUR'

      tenders.push({
        id: `ted-${n['publication-number']}`,
        title,
        description: `${n['notice-type'] === 'pin-only' ? 'Prior information notice (pipeline)' : 'Contract notice'}${value ? ` | est. ${currency} ${value.toLocaleString()}` : ''}`,
        division,
        value: 0, // in local currency, so shown in the description instead of as GBP
        deadline: deadline ? new Date(deadline.slice(0, 10)).toLocaleDateString('en-GB') : 'See notice',
        organisation: pickLang(n['buyer-name']) || 'EU public buyer',
        country: (n['buyer-country'] ?? [])[0] ?? 'EU',
        url: `https://ted.europa.eu/en/notice/-/detail/${n['publication-number']}`,
        source: 'ted',
        published: new Date().toISOString(),
      })
    }
  } catch {
    // Non-fatal
  }

  return tenders
}

// India — World Bank India projects + ADB
export async function fetchIndiaTenders(): Promise<InternationalTender[]> {
  const tenders: InternationalTender[] = []

  // World Bank India-specific sustainability consulting
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const url = `https://search.worldbank.org/api/v2/procurement?format=json&rows=15&fq=procurement_category:consulting&fq=contact_country_name:India&fq=submission_date:[${thirtyDaysAgo}T00:00:00Z TO NOW]`
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      const docs = data?.procurement?.docs ?? []
      for (const doc of docs) {
        const title = doc.project_name ?? doc.contract_description ?? ''
        if (!title) continue
        const isRelevant = SUSTAINABILITY_KEYWORDS.some(kw =>
          title.toLowerCase().includes(kw) ||
          (doc.contract_description ?? '').toLowerCase().includes(kw)
        )
        if (!isRelevant) continue
        tenders.push({
          id: `wb-india-${doc.id}`,
          title,
          description: doc.contract_description ?? '',
          value: parseFloat(doc.totalamt) || 0,
          deadline: doc.submission_date ? new Date(doc.submission_date).toLocaleDateString('en-GB') : 'TBC',
          organisation: 'World Bank — India',
          country: 'India',
          url: `https://projects.worldbank.org/en/projects-operations/procurement-detail/${doc.id}`,
          source: 'worldbank',
          published: doc.submission_date ?? new Date().toISOString(),
        })
      }
    }
  } catch {
    // Non-fatal
  }

  // ADB (Asian Development Bank) — India sustainability consulting notices
  try {
    const url = `https://www.adb.org/api/procurement/notices?country=IND&type=consulting&status=active&limit=15`
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }, 10000)
    if (res.ok) {
      const data = await res.json()
      const notices = data?.data ?? data?.notices ?? []
      for (const n of Array.isArray(notices) ? notices : []) {
        const title = n.title ?? n.name ?? ''
        if (!title) continue
        const isRelevant = SUSTAINABILITY_KEYWORDS.some(kw => title.toLowerCase().includes(kw))
        if (!isRelevant) continue
        tenders.push({
          id: `adb-${n.id ?? Math.random()}`,
          title,
          description: n.description ?? n.summary ?? 'ADB India procurement notice',
          value: parseFloat(n.amount ?? '0') || 0,
          deadline: n.deadline ? new Date(n.deadline).toLocaleDateString('en-GB') : 'See tender',
          organisation: 'Asian Development Bank',
          country: 'India',
          url: n.url ?? 'https://www.adb.org/projects/tenders',
          source: 'worldbank',
          published: n.publishedDate ?? new Date().toISOString(),
        })
      }
    }
  } catch {
    // Non-fatal
  }

  return tenders
}

// GeM (Government e-Marketplace) — India's central government procurement portal
// gem.gov.in handles all central ministry purchases; Ministry of Environment (MoEFCC)
// is the most relevant for sustainability consulting.
// Also tries CPPP (eprocure.gov.in) as a fallback — that portal uses server-side HTML.
export async function fetchGeM(): Promise<InternationalTender[]> {
  const tenders: InternationalTender[] = []
  const seen = new Set<string>()

  // --- Attempt 1: GeM advance-search (HTML, may be JS-rendered so may return empty) ---
  const gemKeywords = ['sustainability', 'environment', 'renewable energy', 'green building', 'climate']
  await Promise.allSettled(gemKeywords.slice(0, 3).map(async keyword => {
    try {
      const url = `https://bidplus.gem.gov.in/advance-search?searchedText=${encodeURIComponent(keyword)}&page=1`
      const res = await fetchWithTimeout(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; GreenStack/1.0)',
        },
        cache: 'no-store',
      }, 12000)
      if (!res.ok) return

      const html = await res.text()

      // GeM bid numbers: BID/YYYY/X/NNNNNNN or GEM/YYYY/X/NNNNNNN
      const bidNos = [...html.matchAll(/(?:BID|GEM)\/\d{4}\/[A-Z]\/\d+/g)].map(m => m[0])
      if (bidNos.length === 0) return

      // All text from <td> cells — bid title and deadline sit near the bid number
      const cells = [...html.matchAll(/<td[^>]*?>([\s\S]*?)<\/td>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(t => t.length > 5)

      let searchFrom = 0
      for (const bidNo of bidNos) {
        if (seen.has(bidNo)) continue
        seen.add(bidNo)

        const idx = cells.findIndex((c, i) => i >= searchFrom && c.includes(bidNo))
        if (idx === -1) continue
        searchFrom = idx + 1

        const nearCells = cells.slice(idx, idx + 8)
        const title = nearCells.find(c => c.length > 20 && !/^\d{2}\/\d{2}\/\d{4}$/.test(c) && !c.includes(bidNo))
          ?? keyword

        const isRelevant = SUSTAINABILITY_KEYWORDS.some(kw => title.toLowerCase().includes(kw))
        if (!isRelevant) continue

        const dateMatch = nearCells.join(' ').match(/(\d{2})\/(\d{2})\/(\d{4})/)
        const deadline = dateMatch
          ? new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`).toLocaleDateString('en-GB')
          : 'See GeM portal'

        tenders.push({
          id: `gem-${bidNo}`,
          title,
          description: `Government of India procurement via GeM — ${bidNo}`,
          value: 0,
          deadline,
          organisation: 'Government of India (GeM)',
          country: 'India',
          url: `https://bidplus.gem.gov.in/showbidlist/${bidNo}`,
          source: 'gem',
          published: new Date().toISOString(),
        })
      }
    } catch {
      // Non-fatal per keyword
    }
  }))

  // --- Attempt 2: CPPP (Central Public Procurement Portal) — server-side rendered ---
  // eprocure.gov.in has a searchable tender list with static HTML output
  try {
    const cpppKeywords = ['sustainability', 'environment']
    const cpppResults = await Promise.allSettled(cpppKeywords.map(async keyword => {
      const url = `https://eprocure.gov.in/cppp/tenderssearch/cppp/main/all?tenderTitle=${encodeURIComponent(keyword)}`
      const res = await fetchWithTimeout(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'Mozilla/5.0 (compatible; GreenStack/1.0)',
        },
        cache: 'no-store',
      }, 12000)
      if (!res.ok) return null
      return res.text()
    }))

    for (const result of cpppResults) {
      if (result.status !== 'fulfilled' || !result.value) continue
      const html = result.value

      // CPPP renders a table: Tender ID | Title | Ministry | Last Date
      const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
      for (const row of rows) {
        const rowText = row[1]
        const cells = [...rowText.matchAll(/<td[^>]*?>([\s\S]*?)<\/td>/gi)]
          .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
          .filter(t => t.length > 2)

        if (cells.length < 3) continue

        // CPPP tender IDs typically start with year/number
        const tenderId = cells.find(c => /\d{4}\/\d+/.test(c)) ?? ''
        const title = cells.find(c => c.length > 25 && !c.match(/^\d/) && !c.match(/^\d{2}\/\d{2}\/\d{4}$/)) ?? ''
        if (!title || !tenderId) continue

        const id = `cppp-${tenderId.replace(/\s+/g, '-')}`
        if (seen.has(id)) continue
        seen.add(id)

        const isRelevant = SUSTAINABILITY_KEYWORDS.some(kw => title.toLowerCase().includes(kw))
        if (!isRelevant) continue

        const dateMatch = cells.join(' ').match(/(\d{2})\/(\d{2})\/(\d{4})/)
        const deadline = dateMatch
          ? new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`).toLocaleDateString('en-GB')
          : 'See CPPP portal'

        const linkMatch = row[1].match(/href="([^"]+)"/)

        tenders.push({
          id,
          title,
          description: `Central government India procurement via CPPP — ${tenderId}`,
          value: 0,
          deadline,
          organisation: 'Government of India (CPPP)',
          country: 'India',
          url: linkMatch
            ? `https://eprocure.gov.in${linkMatch[1]}`
            : 'https://eprocure.gov.in/cppp',
          source: 'gem',
          published: new Date().toISOString(),
        })
      }
    }
  } catch {
    // Non-fatal
  }

  return tenders
}

/**
 * Live international feeds. Tested 2026-10-30: World Bank and TED return real data.
 * Not fetched automatically because they never returned anything: UNGM blocks
 * automated requests (403), the GIZ page and GeM/CPPP scrapes found 0 notices, and
 * fetchIndiaTenders used the dead World Bank endpoint (World Bank now covers India).
 * VERDANT browses UNGM, GIZ and GeM itself via the regional directives instead.
 */
export async function fetchAllInternationalTenders(): Promise<InternationalTender[]> {
  const [worldBank, ted] = await Promise.all([
    fetchWorldBankTenders(),
    fetchTEDTenders(),
  ])

  return [...worldBank, ...ted]
}
