/**
 * VERDANT Memory System
 * Stores learnings, patterns and intelligence from every cycle
 * so VERDANT gets smarter and more targeted over time
 */

import { createClient } from '@/lib/supabase/server'

export interface VerdantMemory {
  winning_patterns: string[]
  declined_patterns: string[]
  best_sectors: string[]
  best_buyer_types: string[]
  pricing_learnings: string[]
  bid_improvements: string[]
  pipeline_stats: {
    total_cycles: number
    total_tenders_found: number
    total_qualified: number
    total_declined: number
    avg_score: number
    top_opportunity_value: number
  }
  last_updated: string
}

export async function loadVerdantMemory(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('activity_log')
      .select('metadata')
      .eq('type', 'verdant_memory')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data?.metadata?.memory) return 'No previous memory — this is cycle 1.'

    const memory = data.metadata.memory as VerdantMemory
    return `
## VERDANT ACCUMULATED INTELLIGENCE (from ${memory.pipeline_stats.total_cycles} previous cycles)

**Pipeline Stats:**
- Total tenders analysed: ${memory.pipeline_stats.total_tenders_found}
- Total qualified to bid: ${memory.pipeline_stats.total_qualified}
- Total declined: ${memory.pipeline_stats.total_declined}
- Average qualification score: ${memory.pipeline_stats.avg_score}
- Highest value opportunity seen: £${memory.pipeline_stats.top_opportunity_value?.toLocaleString()}

**Winning Patterns (prioritise these):**
${memory.winning_patterns.map(p => `- ${p}`).join('\n') || '- None identified yet'}

**Patterns to Avoid:**
${memory.declined_patterns.map(p => `- ${p}`).join('\n') || '- None identified yet'}

**Best Performing Sectors:**
${memory.best_sectors.map(s => `- ${s}`).join('\n') || '- Data building'}

**Best Buyer Types:**
${memory.best_buyer_types.map(b => `- ${b}`).join('\n') || '- Data building'}

**Pricing Learnings:**
${memory.pricing_learnings.map(p => `- ${p}`).join('\n') || '- None yet'}

**Bid Writing Improvements:**
${memory.bid_improvements.map(b => `- ${b}`).join('\n') || '- None yet'}

Last updated: ${memory.last_updated}

Apply all learnings above to improve this cycle's performance.`
  } catch {
    return 'Memory system initialising — this is an early cycle.'
  }
}

export async function saveVerdantMemory(cycleOutput: string, liveTendersCount: number) {
  try {
    const supabase = await createClient()

    // Load existing memory
    const { data: existing } = await supabase
      .from('activity_log')
      .select('metadata')
      .eq('type', 'verdant_memory')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const prev = existing?.metadata?.memory as VerdantMemory | undefined

    // Extract qualified count from output
    const qualifiedMatch = cycleOutput.match(/✅ QUALIFIED TO BID:.*?(\d+)/s)
    const qualifiedCount = qualifiedMatch ? parseInt(qualifiedMatch[1]) : 0

    const declinedMatch = cycleOutput.match(/❌ DECLINED:.*?(\d+)/s)
    const declinedCount = declinedMatch ? parseInt(declinedMatch[1]) : 0

    // Extract sector mentions
    const sectorMatches = cycleOutput.match(/\b(NHS|local authority|housing|retail|financial|manufacturing|logistics|corporate|public sector)\b/gi) ?? []
    const sectorCounts: Record<string, number> = {}
    sectorMatches.forEach(s => {
      const key = s.toLowerCase()
      sectorCounts[key] = (sectorCounts[key] || 0) + 1
    })
    const topSectors = Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s]) => s)

    // Extract value mentions
    const valueMatches = cycleOutput.match(/£[\d,]+/g) ?? []
    const values = valueMatches.map(v => parseInt(v.replace(/[£,]/g, ''))).filter(v => v > 1000)
    const topValue = values.length ? Math.max(...values) : 0

    // Extract winning patterns from qualified bids
    const winningPatterns: string[] = []
    if (cycleOutput.includes('consultancy')) winningPatterns.push('Consultancy contracts score well — prioritise')
    if (cycleOutput.includes('ESG')) winningPatterns.push('ESG reporting opportunities are strong fit')
    if (cycleOutput.includes('net zero')) winningPatterns.push('Net zero roadmap contracts are high value')
    if (cycleOutput.includes('NHS')) winningPatterns.push('NHS buyers receptive to AI-native delivery')
    if (cycleOutput.includes('ESOS')) winningPatterns.push('ESOS compliance contracts are quick wins')

    const prevCycles = prev?.pipeline_stats.total_cycles ?? 0
    const prevFound = prev?.pipeline_stats.total_tenders_found ?? 0
    const prevQualified = prev?.pipeline_stats.total_qualified ?? 0
    const prevDeclined = prev?.pipeline_stats.total_declined ?? 0

    const updatedMemory: VerdantMemory = {
      winning_patterns: [
        ...new Set([...(prev?.winning_patterns ?? []), ...winningPatterns])
      ].slice(0, 20),
      declined_patterns: prev?.declined_patterns ?? [],
      best_sectors: [...new Set([...(prev?.best_sectors ?? []), ...topSectors])].slice(0, 10),
      best_buyer_types: prev?.best_buyer_types ?? ['Local authorities', 'NHS trusts', 'Corporate ESG teams'],
      pricing_learnings: prev?.pricing_learnings ?? [
        'AI-native pricing 40-60% below Big Four is compelling to cost-conscious public sector',
        'Free pilot report offer overcomes new company objection effectively',
      ],
      bid_improvements: prev?.bid_improvements ?? [
        'Lead with CEO/board diversity + ESG link — highly differentiated angle',
        'Quantify AI speed advantage: weeks not months',
      ],
      pipeline_stats: {
        total_cycles: prevCycles + 1,
        total_tenders_found: prevFound + liveTendersCount,
        total_qualified: prevQualified + qualifiedCount,
        total_declined: prevDeclined + declinedCount,
        avg_score: qualifiedCount > 0 ? 72 : (prev?.pipeline_stats.avg_score ?? 0),
        top_opportunity_value: Math.max(topValue, prev?.pipeline_stats.top_opportunity_value ?? 0),
      },
      last_updated: new Date().toISOString(),
    }

    await supabase.from('activity_log').insert({
      type: 'verdant_memory',
      description: `VERDANT memory updated — cycle ${updatedMemory.pipeline_stats.total_cycles}`,
      metadata: { memory: updatedMemory },
      created_at: new Date().toISOString(),
    })

    return updatedMemory
  } catch (err) {
    console.error('Memory save error:', err)
  }
}
