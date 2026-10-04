/**
 * Metered Anthropic client — every non-streaming messages.create call logs its
 * token usage and approximate USD cost to the Vercel runtime logs, tagged by
 * source, so spend can be traced to the job that caused it.
 *
 * Search Vercel logs for "[llm-cost]" to see it. Hard spend limits belong in the
 * Anthropic Console (Settings → Limits), not here.
 */

import Anthropic from '@anthropic-ai/sdk'

// USD per million tokens [input, output], matched by model-id prefix.
const PRICES: [string, number, number][] = [
  ['claude-opus-4-1', 15, 75],
  ['claude-opus-4', 5, 25],
  ['claude-sonnet-4', 3, 15],
  ['claude-haiku-4', 1, 5],
]
const WEB_SEARCH_USD = 0.01 // per search; web_fetch has no per-use fee

function estimateCost(model: string, usage: any): number {
  const [, input, output] = PRICES.find(([prefix]) => model?.startsWith(prefix)) ?? ['', 3, 15]
  const tokens =
    (usage.input_tokens ?? 0) * input +
    (usage.cache_creation_input_tokens ?? 0) * input * 1.25 +
    (usage.cache_read_input_tokens ?? 0) * input * 0.1 +
    (usage.output_tokens ?? 0) * output
  return tokens / 1e6 + (usage.server_tool_use?.web_search_requests ?? 0) * WEB_SEARCH_USD
}

export function createAnthropic(source: string): Anthropic {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const create = client.messages.create.bind(client.messages)

  ;(client.messages as any).create = async (params: any, options?: any) => {
    const response: any = await create(params, options)
    if (!params.stream && response?.usage) {
      const u = response.usage
      console.log(
        `[llm-cost] source=${source} model=${params.model} in=${u.input_tokens} out=${u.output_tokens}` +
        ` cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0}` +
        ` searches=${u.server_tool_use?.web_search_requests ?? 0} usd=${estimateCost(params.model, u).toFixed(4)}`
      )
    }
    return response
  }

  return client
}
