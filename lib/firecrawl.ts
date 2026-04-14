/**
 * Firecrawl integration — deep web scraping with JS rendering and PDF extraction
 * Used by VERDANT for portal scraping, tender document extraction, company research
 */

export interface FirecrawlResult {
  url: string
  markdown: string
  title?: string
  description?: string
  success: boolean
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

/** Scrape a single URL and return clean markdown */
export async function scrapeUrl(url: string, options?: {
  formats?: ('markdown' | 'html' | 'screenshot')[]
  onlyMainContent?: boolean
  waitFor?: number
}): Promise<FirecrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) return { url, markdown: '', success: false }

  try {
    const res = await fetchWithTimeout('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: options?.formats ?? ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor ?? 0,
      }),
    }, 20000)

    if (!res.ok) return { url, markdown: '', success: false }
    const data = await res.json()

    return {
      url,
      markdown: data?.data?.markdown ?? data?.markdown ?? '',
      title: data?.data?.metadata?.title ?? '',
      description: data?.data?.metadata?.description ?? '',
      success: true,
    }
  } catch {
    return { url, markdown: '', success: false }
  }
}

/** Crawl a site and return pages as markdown — for portal discovery */
export async function crawlSite(url: string, options?: {
  maxPages?: number
  keywords?: string[]
}): Promise<FirecrawlResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) return []

  try {
    // Start crawl job
    const startRes = await fetchWithTimeout('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        limit: options?.maxPages ?? 10,
        scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
      }),
    })

    if (!startRes.ok) return []
    const { id } = await startRes.json()
    if (!id) return []

    // Poll for results (max 30s)
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const statusRes = await fetchWithTimeout(`https://api.firecrawl.dev/v1/crawl/${id}`)
      if (!statusRes.ok) continue
      const status = await statusRes.json()

      if (status.status === 'completed') {
        const pages: FirecrawlResult[] = (status.data ?? []).map((p: any) => ({
          url: p.metadata?.sourceURL ?? url,
          markdown: p.markdown ?? '',
          title: p.metadata?.title ?? '',
          success: true,
        }))

        // Filter for keyword relevance if specified
        if (options?.keywords?.length) {
          return pages.filter(p =>
            options.keywords!.some(kw => p.markdown.toLowerCase().includes(kw.toLowerCase()))
          )
        }
        return pages
      }
    }
  } catch {
    // Non-fatal
  }

  return []
}

/** Search the web and get full page content — better than raw search APIs */
export async function searchAndScrape(query: string, options?: {
  limit?: number
}): Promise<FirecrawlResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetchWithTimeout('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: options?.limit ?? 5,
        scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
      }),
    }, 20000)

    if (!res.ok) return []
    const data = await res.json()
    const results = data?.data ?? []

    return results.map((r: any) => ({
      url: r.url ?? '',
      markdown: r.markdown ?? '',
      title: r.metadata?.title ?? '',
      description: r.metadata?.description ?? '',
      success: true,
    }))
  } catch {
    return []
  }
}
