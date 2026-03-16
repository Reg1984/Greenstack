'use server'

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
