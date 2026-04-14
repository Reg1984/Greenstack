/**
 * Companies House API — free UK company lookup
 * Find directors, SIC codes, registered address, filing history
 * No API key required for basic search
 */

const CH_API = 'https://api.company-information.service.gov.uk'

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 10000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function chHeaders() {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY
  // Basic auth: API key as username, empty password
  if (apiKey) {
    const encoded = Buffer.from(`${apiKey}:`).toString('base64')
    return { Authorization: `Basic ${encoded}`, Accept: 'application/json' }
  }
  return { Accept: 'application/json' }
}

export async function lookupCompaniesHouse(name: string): Promise<string> {
  try {
    // Search for company
    const searchRes = await fetchWithTimeout(
      `${CH_API}/search/companies?q=${encodeURIComponent(name)}&items_per_page=3`,
      { headers: chHeaders() }
    )
    if (!searchRes.ok) return `Companies House search failed (${searchRes.status}). Try searching manually at find-and-update.company-information.service.gov.uk`

    const searchData = await searchRes.json()
    const companies = searchData?.items ?? []
    if (!companies.length) return `No Companies House results for: ${name}`

    const results: string[] = []

    for (const company of companies.slice(0, 2)) {
      const companyNumber = company.company_number
      const companyName = company.title
      const status = company.company_status
      const address = company.registered_office_address
        ? `${company.registered_office_address.address_line_1 ?? ''}, ${company.registered_office_address.postal_code ?? ''}`.trim().replace(/^,\s*/, '')
        : 'N/A'
      const sicCodes = company.sic_codes?.join(', ') ?? 'N/A'
      const incorporated = company.date_of_creation ?? 'N/A'

      let officersText = ''
      try {
        const officersRes = await fetchWithTimeout(
          `${CH_API}/company/${companyNumber}/officers?items_per_page=10`,
          { headers: chHeaders() }
        )
        if (officersRes.ok) {
          const officersData = await officersRes.json()
          const activeOfficers = (officersData?.items ?? [])
            .filter((o: any) => !o.resigned_on)
            .map((o: any) => `${o.name} (${o.officer_role})`)
          officersText = activeOfficers.length
            ? `\nDirectors/Officers: ${activeOfficers.join(', ')}`
            : '\nDirectors: None listed'
        }
      } catch { /* non-fatal */ }

      results.push(
        `**${companyName}** (${companyNumber})\n` +
        `Status: ${status} | Incorporated: ${incorporated}\n` +
        `Address: ${address}\n` +
        `SIC Codes: ${sicCodes}${officersText}\n` +
        `CH Link: https://find-and-update.company-information.service.gov.uk/company/${companyNumber}`
      )
    }

    return results.join('\n\n---\n\n')
  } catch (err) {
    return `Companies House lookup error: ${String(err)}`
  }
}
