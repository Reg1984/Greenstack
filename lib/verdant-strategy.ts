/**
 * VERDANT Strategic Advisor
 * Powered by claude-sonnet-4-6 with extended thinking.
 * 8-section bid analysis: competitor intelligence, buyer psychology, game theory, positioning.
 * Called by VERDANT before writing any bid or qualifying a high-value opportunity.
 */

import Anthropic from '@anthropic-ai/sdk'
import { COMPANY_PROFILE } from './company-profile'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ADVISOR_SYSTEM = `You are VERDANT's strategic advisor — a senior partner who has reviewed over 500 public sector and international development bids. You have no emotional stake in the outcome. Your only job is to be right.

You are a chess grandmaster looking at a position. Tell the operator what they need to hear, not what they want to hear.

## GREENSTACK AI COMPANY PROFILE
${COMPANY_PROFILE}

## INTELLIGENCE SOURCES YOU ARE DRAWING ON
When analysing any opportunity, reason from the full body of GreenStack AI's accumulated intelligence:
- All tenders ever logged in the GreenStack database (won, lost, pending, declined)
- All bids written, including content, pricing, and outcomes
- All buyer organisations and their historical procurement patterns
- All competitors identified and their known bid patterns
- All emails sent to and received from prospects, buyers, and partners
- All sector-level intelligence from Contracts Finder, Find a Tender, and Companies House
- All market signals: planning applications, council budgets, policy announcements

Where this data is not explicitly provided in the prompt, state your assumption clearly and reason from first principles. Do not pretend to have data you don't have — but do reason from the patterns you would expect given the market.

When data is missing, state the assumption explicitly. Never give vague advice. Always commit to a specific recommendation with a specific reason. Use real numbers wherever possible.`

/**
 * Run structured strategic analysis on a bid opportunity.
 * Returns an 8-section advisory report.
 */
export async function thinkStrategically(
  opportunity: string,
  question: string
): Promise<string> {
  const prompt = `Today's strategic question:
${question}

Opportunity details:
${opportunity}

Produce a full 8-section strategic advisory report:

---

1. SITUATION ASSESSMENT
   What is actually happening here — stripped of spin? Who is the buyer, what do they really need, and why are they procuring now? What is the political or commercial context driving this? State what we know as fact and what we are assuming.

2. COMPETITOR INTELLIGENCE
   Who is most likely bidding against us?
   - Name the probable competitors: Big Four, specialist boutiques, incumbents, local consultancies
   - For each: historical pricing patterns, bid strengths and weaknesses, likely strategy on this specific opportunity
   - Predicted Bayesian probability (%) that each competitor bids on this opportunity and why
   - Where are we stronger and where are we weaker — specifically?

3. BUYER INTELLIGENCE
   What does the buyer actually want, beyond the spec?
   - Historical award patterns for this buyer or similar buyers
   - Stated and unstated evaluation preferences
   - Political and budgetary context
   - Decision-maker profiles where known
   - Signal preferences: do they weight price, social value, local presence, or sustainability credentials most heavily?

4. GAME THEORY ANALYSIS
   - What is the Nash equilibrium pricing point given likely competitor pricing?
   - What is the minimax strategy — how do we minimise maximum loss if competitors undercut?
   - Where is the optimal signal portfolio — which credentials, evidence, and positioning maximise perceived value per word in the submission?
   - In repeated-game terms, what is the long-term relationship value of this buyer to GreenStack AI?

5. GO / NO-GO DECISION
   Should GreenStack AI bid? Answer YES or NO, then defend it in exactly 3 bullet points. Consider: credentials, bandwidth, realistic win probability, and whether the margin justifies the bid cost.

6. PRICING STRATEGY
   What should GreenStack AI charge? Give a specific number or range. Justify against: our listed rates, the buyer's likely budget, competitor pricing, and value delivered. Should we undercut, match, or price at premium — and why?

7. BID POSITIONING
   POSITIONING: [Top 3 emphasis points for the bid]
   SIGNALS TO INCLUDE: [Specific credentials, evidence, accreditations that strengthen us]
   SIGNALS TO AVOID: [Things that could weaken the bid — gaps, overreach, irrelevant experience]
   EXPECTED OUTCOME: [Win probability % with one-line reasoning]
   FALLBACK: [What GreenStack AI does if this loses]

8. LONG-TERM POSITIONING
   How does this single decision serve the 12-month strategic goal of becoming the recognised leader in UK green energy and sustainability consultancy? Does winning or losing this change our positioning, references, or pipeline in a meaningful way?

---

End with one sentence: your single most important piece of advice for this decision.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      thinking: {
        type: 'enabled',
        budget_tokens: 5000,
      },
      system: ADVISOR_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const thinkingBlock = response.content.find(b => b.type === 'thinking')
    const textBlock = response.content.find(b => b.type === 'text')

    const thinkingText = thinkingBlock?.type === 'thinking' ? thinkingBlock.thinking : ''
    const strategyText = textBlock?.type === 'text' ? textBlock.text : 'No analysis generated.'

    const thinkingSummary = thinkingText.length > 0
      ? `**Reasoning chain (${thinkingText.length} chars):**\n${thinkingText.slice(0, 800)}${thinkingText.length > 800 ? '\n... [continues]' : ''}\n`
      : ''

    return [
      '## VERDANT STRATEGIC ADVISOR — BID ANALYSIS',
      thinkingSummary,
      strategyText,
    ]
      .filter(Boolean)
      .join('\n\n')
  } catch (error) {
    return `Strategic advisor unavailable: ${String(error)}. Proceed with standard analysis.`
  }
}
