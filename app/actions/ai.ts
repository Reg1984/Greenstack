'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Types for auto-bidding
export interface TenderScore {
  tenderId: string
  matchScore: number // 0-100
  reasoning: string
  recommendedBid: boolean
}

export interface AutoBidResult {
  bidId: string
  tenderId: string
  tenderTitle: string
  matchScore: number
  bidContent: BidContent
  submitted: boolean
}

export interface BidContent {
  executiveSummary: string
  companyCapabilities: string
  projectApproach: string
  timeline: string
  commercialTerms: string
  riskMitigation: string
}

// Helper to get authenticated user
async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

export async function generateBidContent(section: string, tender: string, value: number) {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate professional UK ${section} section for a tender bid. 
Tender: ${tender}
Contract Value: £${value}K

The response should be practical, compliant with UK standards (BS EN 16247, PAS 2035, ISO 50001), 
and written for sustainability/energy efficiency contracts. Keep it concise but comprehensive.`,
        },
      ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (error) {
    console.error('AI generation error:', error)
    throw new Error('Failed to generate content')
  }
}

export async function matchTendersToCapabilities(companyCapabilities: string[]) {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Based on these company capabilities: ${companyCapabilities.join(', ')}
          
What sectors and tender types would be the best fit? Provide a brief assessment of match likelihood (high/medium/low) for:
- Energy audits
- Solar installations
- BEMS systems
- Heat pump conversions
- LED retrofits
- Supply chain consulting

Format as a simple list with percentages.`,
        },
      ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (error) {
    console.error('AI matching error:', error)
    throw new Error('Failed to match tenders')
  }
}

export async function analyzeTenderRisk(tenderDescription: string) {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Analyze this UK sustainability tender for risk factors:

${tenderDescription}

Identify key risks (timeline pressure, compliance requirements, competition, scope complexity) and suggest mitigation strategies.`,
        },
      ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (error) {
    console.error('AI risk analysis error:', error)
    throw new Error('Failed to analyze risk')
  }
}

export async function generateTenderSummary(tenderText: string) {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Create a one-paragraph executive summary of this tender, highlighting key requirements and opportunity:

${tenderText.substring(0, 1000)}`,
        },
      ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (error) {
    console.error('AI summary error:', error)
    throw new Error('Failed to generate summary')
  }
}

// ============ AUTO-BIDDING ENGINE ============

/**
 * Extract tender details from a URL by fetching and analyzing the content
 */
export async function extractTenderFromURL(url: string): Promise<{
  title: string
  client?: string
  sector?: string
  value?: number
  deadline?: string
  description: string
  requirements?: string
}> {
  try {
    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GreenStack-AI/1.0',
      },
    })
    
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`)
    
    const html = await response.text()
    
    // Use AI to extract tender details from HTML
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract tender information from this HTML content and return a JSON object with:
- title: (string) The tender/project name
- client: (string) The client/organization issuing the tender
- sector: (string) Industry sector (e.g., Energy, Construction, Sustainability)
- value: (number) Contract value in thousands (e.g., 150 for £150k), or null if unknown
- deadline: (string) Application deadline in ISO format, or null if unknown
- description: (string) 2-3 paragraph description of the project
- requirements: (string) Key technical or compliance requirements

HTML Content:
${html.substring(0, 3000)}

Return ONLY valid JSON, no other text.`,
        },
      ],
    })
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    
    // Extract JSON from response (in case AI wraps it with markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText)
    
    return {
      title: extracted.title || 'Imported Tender',
      client: extracted.client,
      sector: extracted.sector,
      value: extracted.value,
      deadline: extracted.deadline,
      description: extracted.description || '',
      requirements: extracted.requirements,
    }
  } catch (error) {
    console.error('URL extraction error:', error)
    throw new Error('Failed to extract tender from URL')
  }
}

/**
 * Score a tender against user capabilities and settings
 */
export async function scoreTender(
  tender: {
    title: string
    description?: string
    sector?: string
    value?: number
    deadline?: string
  },
  userCapabilities: string[],
  matchThreshold: number = 65
): Promise<TenderScore> {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Score this UK sustainability tender for a company with these capabilities: ${userCapabilities.join(', ')}

Tender Details:
Title: ${tender.title}
Sector: ${tender.sector || 'Unknown'}
Value: £${tender.value || 0}K
Deadline: ${tender.deadline || 'Not specified'}
Description: ${tender.description || 'No description provided'}

Provide a JSON response with:
- matchScore: (0-100) How well this matches the company's capabilities
- reasoning: (string) Explain the score in 1-2 sentences
- recommendedBid: (boolean) Should the company bid on this? (true if score >= ${matchThreshold})

Return ONLY valid JSON, no other text.`,
        },
      ],
    })
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const scored = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText)
    
    return {
      tenderId: tender.title,
      matchScore: scored.matchScore || 0,
      reasoning: scored.reasoning || '',
      recommendedBid: scored.recommendedBid || false,
    }
  } catch (error) {
    console.error('Tender scoring error:', error)
    throw new Error('Failed to score tender')
  }
}

/**
 * Generate a complete bid with all 6 sections
 */
export async function generateCompleteBid(
  tender: {
    title: string
    description?: string
    requirements?: string
    value?: number
  },
  userProfile: {
    company_name?: string
    full_name?: string
  },
  capabilities: string[]
): Promise<BidContent> {
  try {
    const sections: (keyof BidContent)[] = [
      'executiveSummary',
      'companyCapabilities',
      'projectApproach',
      'timeline',
      'commercialTerms',
      'riskMitigation',
    ]
    
    const bidContent: Partial<BidContent> = {}
    
    // Generate each section
    for (const section of sections) {
      const sectionPrompt = getSectionPrompt(section, tender, userProfile, capabilities)
      
      const message = await client.messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: sectionPrompt,
          },
        ],
      })
      
      bidContent[section] = message.content[0].type === 'text' ? message.content[0].text : ''
    }
    
    return bidContent as BidContent
  } catch (error) {
    console.error('Bid generation error:', error)
    throw new Error('Failed to generate bid content')
  }
}

/**
 * Get section-specific prompt for bid generation
 */
function getSectionPrompt(
  section: keyof BidContent,
  tender: any,
  profile: any,
  capabilities: string[]
): string {
  const companyName = profile.company_name || 'Our Company'
  const baseContext = `
Tender: ${tender.title}
Company: ${companyName}
Company Capabilities: ${capabilities.join(', ')}
Requirements: ${tender.requirements || 'Not specified'}
Contract Value: £${tender.value || 0}K
`

  const prompts: Record<keyof BidContent, string> = {
    executiveSummary: `${baseContext}
Write a professional executive summary (150-200 words) for this bid. 
Highlight why ${companyName} is the ideal choice and key value propositions.
Focus on the client's needs based on the requirements.`,

    companyCapabilities: `${baseContext}
Write a company capabilities section (200-300 words) showcasing ${companyName}'s:
- Relevant experience and track record
- Key strengths in ${tender.title}
- Certifications and accreditations
- Team expertise

Be specific and compelling.`,

    projectApproach: `${baseContext}
Write a detailed project approach section (250-350 words) outlining:
- How ${companyName} will deliver this project
- Methodology and key stages
- How we'll address the tender requirements
- Innovation or unique approaches

Be practical and comprehensive.`,

    timeline: `${baseContext}
Write a realistic project timeline/delivery schedule (150-200 words) including:
- Key milestones and phases
- Critical path items
- Resource allocation
- Quality checkpoints
- Risk contingencies

Format as a structured timeline.`,

    commercialTerms: `${baseContext}
Write commercial and terms section (150-200 words) addressing:
- Value for money proposition
- Payment terms proposed
- Pricing breakdown approach
- Performance guarantees
- Service level commitments

Be realistic for this contract value.`,

    riskMitigation: `${baseContext}
Write a risk mitigation and contingency section (150-200 words) covering:
- Identified risks and mitigation strategies
- Quality assurance measures
- Contingency plans
- Insurance and compliance
- Communication and escalation procedures`,
  }

  return prompts[section]
}

/**
 * Main auto-bidding function: Find matching tenders and auto-submit bids
 */
export async function runAutoBidding(userSettings: {
  user_id: string
  match_threshold: number
  capabilities: string[]
  max_bid_value?: number
  sectors?: string[]
  notify_on_bid?: boolean
}) {
  try {
    const auth = await getAuthUser()
    if (!auth) throw new Error('Not authenticated')

    // Get all "found" tenders for this user
    const { data: tenders } = await auth.supabase
      .from('tenders')
      .select('*')
      .eq('user_id', auth.user.id)
      .eq('status', 'found')
      .order('created_at', { ascending: false })

    if (!tenders || tenders.length === 0) {
      console.log('[v0] No tenders found for auto-bidding')
      return { results: [], message: 'No tenders to bid on' }
    }

    const results: AutoBidResult[] = []

    // Score and bid on each tender
    for (const tender of tenders) {
      try {
        // Skip if already has a bid
        const { data: existingBid } = await auth.supabase
          .from('bids')
          .select('id')
          .eq('tender_id', tender.id)
          .eq('user_id', auth.user.id)
          .single()

        if (existingBid) {
          console.log(`[v0] Skipping tender ${tender.id} - bid already exists`)
          continue
        }

        // Check value limits
        if (userSettings.max_bid_value && tender.value && tender.value > userSettings.max_bid_value) {
          console.log(`[v0] Skipping tender ${tender.id} - value exceeds limit`)
          continue
        }

        // Check sector restrictions
        if (userSettings.sectors?.length && !userSettings.sectors.includes(tender.sector)) {
          console.log(`[v0] Skipping tender ${tender.id} - sector not in allowed list`)
          continue
        }

        // Score the tender
        const score = await scoreTender(tender, userSettings.capabilities, userSettings.match_threshold)

        console.log(`[v0] Scored tender ${tender.id}: ${score.matchScore}/100`)

        // If score meets threshold, generate and submit bid
        if (score.recommendedBid && score.matchScore >= userSettings.match_threshold) {
          console.log(`[v0] Generating bid for tender ${tender.id}...`)

          // Get user profile
          const { data: profile } = await auth.supabase
            .from('profiles')
            .select('*')
            .eq('id', auth.user.id)
            .single()

          // Generate bid content
          const bidContent = await generateCompleteBid(tender, profile, userSettings.capabilities)

          // Create bid in database
          const { data: newBid, error: bidError } = await auth.supabase
            .from('bids')
            .insert([
              {
                user_id: auth.user.id,
                tender_id: tender.id,
                tender_title: tender.title,
                value: tender.value,
                status: 'auto_submitted',
                progress: 100,
                ai_score: score.matchScore,
                content: bidContent,
              },
            ])
            .select()
            .single()

          if (bidError) throw bidError

          // Update tender status to "bidding"
          await auth.supabase
            .from('tenders')
            .update({ status: 'bidding', updated_at: new Date().toISOString() })
            .eq('id', tender.id)

          // Log activity
          await auth.supabase
            .from('activity_log')
            .insert([
              {
                user_id: auth.user.id,
                action: 'auto_bid_submitted',
                entity_type: 'bid',
                entity_id: newBid.id,
                metadata: {
                  tender_id: tender.id,
                  tender_title: tender.title,
                  match_score: score.matchScore,
                },
              },
            ])

          results.push({
            bidId: newBid.id,
            tenderId: tender.id,
            tenderTitle: tender.title,
            matchScore: score.matchScore,
            bidContent,
            submitted: true,
          })

          console.log(`[v0] Successfully auto-submitted bid for ${tender.title}`)
        } else {
          console.log(`[v0] Tender ${tender.id} scored ${score.matchScore} - below threshold`)
        }
      } catch (tenderError) {
        console.error(`[v0] Error processing tender ${tender.id}:`, tenderError)
        // Continue with next tender on error
      }
    }

    return {
      results,
      message: `Auto-bidding complete. ${results.length} bids submitted.`,
    }
  } catch (error) {
    console.error('Auto-bidding error:', error)
    throw new Error('Auto-bidding process failed')
  }
}
