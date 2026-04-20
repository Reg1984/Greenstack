/**
 * VERDANT Strategic Reasoning Engine
 * Powered by claude-opus-4-5 with extended thinking.
 * Called by VERDANT as a tool when it needs to reason deeply before acting.
 */

import Anthropic from '@anthropic-ai/sdk'
import { COMPANY_PROFILE } from './company-profile'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Run extended thinking on a strategic opportunity.
 * Returns the full reasoning chain + strategic recommendation.
 */
export async function thinkStrategically(
  opportunity: string,
  question: string
): Promise<string> {
  const prompt = `You are VERDANT's deep strategic reasoning core — operating with full extended thinking.

## COMPANY PROFILE
${COMPANY_PROFILE}

## THE OPPORTUNITY
${opportunity}

## STRATEGIC QUESTION
${question}

Reason through every angle before answering. Consider:

1. **Winnability** — Does GreenStack AI actually have the credentials to win this? Be brutally honest. What gaps exist and can we credibly bridge them?
2. **Buyer psychology** — What does this specific buyer actually care about vs what they say they care about in the spec? What keeps their evaluator awake at night?
3. **Competitive positioning** — Who else is bidding? What will a Big Four firm pitch? How do we outflank them on speed, price, and AI depth?
4. **Win angle** — The single most compelling reason an evaluator chooses GreenStack AI over a larger, more established firm.
5. **Risk** — What is the one thing most likely to sink this bid, and how do we neutralise it pre-emptively?
6. **Opening move** — If we bid, what is the first sentence of the executive summary that makes the evaluator lean forward?

After reasoning, provide a clear structured recommendation.`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      messages: [{ role: 'user', content: prompt }],
    })

    const thinkingBlock = response.content.find(b => b.type === 'thinking')
    const textBlock = response.content.find(b => b.type === 'text')

    const thinkingText =
      thinkingBlock?.type === 'thinking' ? thinkingBlock.thinking : ''
    const strategyText =
      textBlock?.type === 'text' ? textBlock.text : 'No strategy generated.'

    // Return thinking summary + full recommendation
    const thinkingSummary =
      thinkingText.length > 0
        ? `**Extended reasoning (${thinkingText.length} chars):**\n${thinkingText.slice(0, 1500)}${thinkingText.length > 1500 ? '\n... [reasoning continues]' : ''}`
        : ''

    return [
      '## 🧠 OPUS 4 EXTENDED THINKING — STRATEGIC ANALYSIS',
      thinkingSummary,
      '## STRATEGIC RECOMMENDATION',
      strategyText,
    ]
      .filter(Boolean)
      .join('\n\n')
  } catch (error) {
    // Graceful fallback — if Opus fails, return a clear error so VERDANT can continue
    return `Strategic thinking unavailable: ${String(error)}. Proceed with Sonnet-level analysis.`
  }
}
