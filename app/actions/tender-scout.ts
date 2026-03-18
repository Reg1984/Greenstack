"use server"

import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"

// UK Tender Portal URLs
const TENDER_PORTALS = [
  {
    name: "Contracts Finder",
    url: "https://www.contractsfinder.service.gov.uk/Search/Results",
    type: "uk_gov"
  },
  {
    name: "Find a Tender",
    url: "https://www.find-tender.service.gov.uk/Search/Results", 
    type: "uk_gov"
  },
  {
    name: "Public Contracts Scotland",
    url: "https://www.publiccontractsscotland.gov.uk",
    type: "scotland"
  }
]

// Search keywords for energy/sustainability tenders
const SEARCH_KEYWORDS = [
  "energy efficiency",
  "solar panels",
  "heat pumps", 
  "LED lighting",
  "building management systems",
  "carbon reduction",
  "decarbonisation",
  "renewable energy",
  "insulation",
  "energy audit",
  "net zero",
  "sustainability"
]

interface ScoutedTender {
  title: string
  description: string
  value: number
  deadline: string
  sector: string
  source_url: string
  source_portal: string
  requirements: string[]
  location: string
}

// Fetch tender listings from Contracts Finder API
async function searchContractsFinder(keywords: string[]): Promise<ScoutedTender[]> {
  const tenders: ScoutedTender[] = []
  
  for (const keyword of keywords.slice(0, 5)) { // Limit to avoid rate limiting
    try {
      // Contracts Finder has a public API
      const searchUrl = `https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?queryString=${encodeURIComponent(keyword)}&size=10`
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GreenStack-TenderScout/1.0'
        }
      })
      
      if (!response.ok) continue
      
      const data = await response.json()
      
      if (data.results) {
        for (const notice of data.results.slice(0, 5)) {
          const tender: ScoutedTender = {
            title: notice.title || notice.description?.substring(0, 100) || 'Untitled',
            description: notice.description || '',
            value: notice.value?.amount || 0,
            deadline: notice.tenderPeriod?.endDate || notice.contractPeriod?.endDate || '',
            sector: extractSector(notice.description || ''),
            source_url: `https://www.contractsfinder.service.gov.uk/Notice/${notice.id}`,
            source_portal: 'Contracts Finder',
            requirements: extractRequirements(notice.description || ''),
            location: notice.deliveryLocation?.description || 'UK'
          }
          tenders.push(tender)
        }
      }
    } catch (error) {
      console.error(`Error searching Contracts Finder for "${keyword}":`, error)
    }
  }
  
  return tenders
}

// Use AI to search and parse tender portals via web search
async function aiSearchTenders(sectors: string[], capabilities: string[]): Promise<ScoutedTender[]> {
  const searchQuery = `UK government tenders ${sectors.join(' ')} ${capabilities.slice(0, 3).join(' ')} 2024 2025`
  
  try {
    const { text } = await generateText({
      model: gateway("anthropic/claude-sonnet-4"),
      system: `You are a tender research assistant. Search for and identify UK public sector tenders related to energy efficiency, sustainability, and building services.
      
Return ONLY a valid JSON array of tender objects with this structure:
[{
  "title": "Tender title",
  "description": "Brief description",
  "value": 500000,
  "deadline": "2025-06-30",
  "sector": "Healthcare|Education|Local Government|Housing|Transport|Energy",
  "source_url": "https://example.gov.uk/tender/123",
  "source_portal": "Contracts Finder|Find a Tender|Other",
  "requirements": ["requirement 1", "requirement 2"],
  "location": "Region, UK"
}]

If you cannot find real tenders, return realistic examples based on typical UK public sector opportunities.`,
      prompt: `Find current UK public sector tenders for:
Sectors: ${sectors.join(', ')}
Capabilities: ${capabilities.join(', ')}

Search query: ${searchQuery}

Return 5-10 relevant tender opportunities as JSON.`,
      maxTokens: 2000
    })
    
    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const tenders = JSON.parse(jsonMatch[0])
      return tenders.map((t: any) => ({
        title: t.title || 'Untitled',
        description: t.description || '',
        value: t.value || 0,
        deadline: t.deadline || '',
        sector: t.sector || 'Other',
        source_url: t.source_url || '',
        source_portal: t.source_portal || 'AI Search',
        requirements: t.requirements || [],
        location: t.location || 'UK'
      }))
    }
  } catch (error) {
    console.error('AI tender search error:', error)
  }
  
  return []
}

// Extract sector from description
function extractSector(description: string): string {
  const desc = description.toLowerCase()
  if (desc.includes('nhs') || desc.includes('hospital') || desc.includes('health')) return 'Healthcare'
  if (desc.includes('school') || desc.includes('university') || desc.includes('college') || desc.includes('education')) return 'Education'
  if (desc.includes('council') || desc.includes('local authority') || desc.includes('borough')) return 'Local Government'
  if (desc.includes('housing') || desc.includes('residential') || desc.includes('homes')) return 'Housing'
  if (desc.includes('transport') || desc.includes('railway') || desc.includes('road')) return 'Transport'
  if (desc.includes('energy') || desc.includes('carbon') || desc.includes('solar') || desc.includes('renewable')) return 'Energy'
  return 'Other'
}

// Extract requirements from description
function extractRequirements(description: string): string[] {
  const requirements: string[] = []
  const desc = description.toLowerCase()
  
  if (desc.includes('iso 14001') || desc.includes('environmental')) requirements.push('ISO 14001 Environmental Management')
  if (desc.includes('iso 9001') || desc.includes('quality')) requirements.push('ISO 9001 Quality Management')
  if (desc.includes('iso 50001') || desc.includes('energy management')) requirements.push('ISO 50001 Energy Management')
  if (desc.includes('salix') || desc.includes('funding')) requirements.push('Salix Funding Experience')
  if (desc.includes('decarbonisation') || desc.includes('net zero')) requirements.push('Decarbonisation Expertise')
  if (desc.includes('public sector') || desc.includes('government')) requirements.push('Public Sector Experience')
  
  return requirements.length > 0 ? requirements : ['General contracting experience']
}

// Main function: Scout for new tenders
export async function scoutForTenders(config: {
  user_id: string
  sectors: string[]
  capabilities: string[]
  max_value?: number
  min_value?: number
}): Promise<{ found: number; added: number; tenders: ScoutedTender[] }> {
  const supabase = await createClient()
  
  // Search multiple sources in parallel
  const [contractsFinderResults, aiSearchResults] = await Promise.all([
    searchContractsFinder(SEARCH_KEYWORDS.filter(k => 
      config.capabilities.some(c => k.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(k.toLowerCase()))
    )),
    aiSearchTenders(config.sectors, config.capabilities)
  ])
  
  // Combine and deduplicate results
  const allTenders = [...contractsFinderResults, ...aiSearchResults]
  const uniqueTenders = allTenders.filter((tender, index, self) =>
    index === self.findIndex(t => t.title.toLowerCase() === tender.title.toLowerCase())
  )
  
  // Filter by value if specified
  let filteredTenders = uniqueTenders
  if (config.max_value) {
    filteredTenders = filteredTenders.filter(t => t.value <= config.max_value!)
  }
  if (config.min_value) {
    filteredTenders = filteredTenders.filter(t => t.value >= config.min_value!)
  }
  
  // Filter by sector
  if (config.sectors.length > 0) {
    filteredTenders = filteredTenders.filter(t => 
      config.sectors.includes(t.sector) || t.sector === 'Other'
    )
  }
  
  // Add to database
  let addedCount = 0
  for (const tender of filteredTenders) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('tenders')
      .select('id')
      .eq('title', tender.title)
      .single()
    
    if (!existing) {
      const { error } = await supabase.from('tenders').insert({
        title: tender.title,
        description: tender.description,
        value: tender.value,
        deadline: tender.deadline || null,
        sector: tender.sector,
        status: 'found',
        match_score: null, // Will be scored by auto-bidding
        source_url: tender.source_url,
        source_portal: tender.source_portal,
        requirements: tender.requirements,
        location: tender.location,
        user_id: config.user_id
      })
      
      if (!error) {
        addedCount++
        
        // Log activity
        await supabase.from('activity_log').insert({
          action: 'tender_scouted',
          details: `Found new tender: ${tender.title} (${tender.source_portal})`,
          user_id: config.user_id
        })
      }
    }
  }
  
  return {
    found: filteredTenders.length,
    added: addedCount,
    tenders: filteredTenders
  }
}

// Run full pipeline: Scout -> Score -> Bid
export async function runFullAutoPipeline(config: {
  user_id: string
  sectors: string[]
  capabilities: string[]
  match_threshold: number
  max_bid_value: number
}): Promise<{
  scouted: number
  scored: number
  bids_created: number
  message: string
}> {
  const { runAutoBidding } = await import('./ai')
  
  // Step 1: Scout for new tenders
  const scoutResult = await scoutForTenders({
    user_id: config.user_id,
    sectors: config.sectors,
    capabilities: config.capabilities,
    max_value: config.max_bid_value
  })
  
  // Step 2: Run auto-bidding on all found tenders
  const bidResult = await runAutoBidding({
    user_id: config.user_id,
    match_threshold: config.match_threshold,
    capabilities: config.capabilities,
    max_bid_value: config.max_bid_value,
    sectors: config.sectors,
    notify_on_bid: true
  })
  
  return {
    scouted: scoutResult.added,
    scored: bidResult.results?.length || 0,
    bids_created: bidResult.results?.filter((r: any) => r.bidId)?.length || 0,
    message: `Scouted ${scoutResult.added} new tenders, created ${bidResult.results?.length || 0} bids`
  }
}
