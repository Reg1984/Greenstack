/**
 * VERDANT Goals — goal-oriented behaviour engine
 *
 * Loads active goals, calculates real-time progress against live data,
 * and formats them as strategic context for VERDANT's cron cycles.
 */

import { createClient } from '@/lib/supabase/server'

export type GoalTargetType =
  | 'revenue'
  | 'mrr'
  | 'pipeline_value'
  | 'bids_submitted'
  | 'contracts_won'
  | 'outreach_sent'

export interface Goal {
  id: string
  title: string
  description: string | null
  target_type: GoalTargetType
  target_value: number
  current_value: number
  target_date: string
  status: 'active' | 'achieved' | 'paused' | 'missed'
  strategy: string | null
  verdant_actions: string[]
  created_at: string
  updated_at: string
}

/** Load all active goals */
export async function loadActiveGoals(): Promise<Goal[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('status', 'active')
      .order('target_date', { ascending: true })
    return (data as Goal[]) ?? []
  } catch {
    return []
  }
}

/** Calculate the current real value for a goal based on live Supabase data */
export async function calculateCurrentValue(targetType: GoalTargetType): Promise<number> {
  try {
    const supabase = await createClient()

    switch (targetType) {
      case 'revenue': {
        const { data } = await supabase
          .from('invoices')
          .select('total')
          .eq('status', 'paid')
        return (data ?? []).reduce((sum, i) => sum + (i.total ?? 0), 0)
      }

      case 'mrr': {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data } = await supabase
          .from('invoices')
          .select('total')
          .eq('status', 'paid')
          .gte('paid_date', thirtyDaysAgo.toISOString().split('T')[0])
        return (data ?? []).reduce((sum, i) => sum + (i.total ?? 0), 0)
      }

      case 'pipeline_value': {
        const { data } = await supabase
          .from('tenders')
          .select('value')
          .not('status', 'eq', 'lost')
        return (data ?? []).reduce((sum, t) => sum + (t.value ?? 0), 0)
      }

      case 'bids_submitted': {
        const { count } = await supabase
          .from('bids')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted')
        return count ?? 0
      }

      case 'contracts_won': {
        const { count } = await supabase
          .from('bids')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'won')
        return count ?? 0
      }

      case 'outreach_sent': {
        const { count } = await supabase
          .from('outreach_emails')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
        return count ?? 0
      }

      default:
        return 0
    }
  } catch {
    return 0
  }
}

/** Update a goal's current_value and optionally its strategy in Supabase */
export async function updateGoalProgress(
  goalId: string,
  currentValue: number,
  strategy?: string,
  action?: string
): Promise<void> {
  try {
    const supabase = await createClient()

    const updates: any = { current_value: currentValue }
    if (strategy) updates.strategy = strategy

    // Append action to verdant_actions log if provided
    if (action) {
      const { data: existing } = await supabase
        .from('goals')
        .select('verdant_actions')
        .eq('id', goalId)
        .single()

      const actions = (existing?.verdant_actions as string[]) ?? []
      actions.unshift(`[${new Date().toISOString().split('T')[0]}] ${action}`)
      updates.verdant_actions = actions.slice(0, 50) // keep last 50
    }

    // Auto-achieve if target met
    const { data: goal } = await supabase
      .from('goals')
      .select('target_value')
      .eq('id', goalId)
      .single()

    if (goal && currentValue >= goal.target_value) {
      updates.status = 'achieved'
    }

    await supabase.from('goals').update(updates).eq('id', goalId)
  } catch {
    // Non-fatal
  }
}

/** Format active goals as a context string for VERDANT's system prompt */
export async function formatGoalsForVerdant(): Promise<string> {
  const goals = await loadActiveGoals()
  if (goals.length === 0) return ''

  const today = new Date()

  const goalLines = await Promise.all(
    goals.map(async goal => {
      const current = await calculateCurrentValue(goal.target_type)

      // Update progress in DB silently
      await updateGoalProgress(goal.id, current)

      const target = goal.target_value
      const pct = Math.min(100, Math.round((current / target) * 100))
      const daysLeft = Math.ceil(
        (new Date(goal.target_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      const gap = target - current
      const label = formatMetricLabel(goal.target_type, target)
      const currentLabel = formatMetricLabel(goal.target_type, current)

      const runRate =
        daysLeft > 0 && gap > 0
          ? `Need ${formatMetricLabel(goal.target_type, Math.ceil(gap / (daysLeft / 30)))} more per month to hit target.`
          : gap <= 0
          ? '🎯 TARGET ACHIEVED'
          : 'Deadline passed.'

      return `### GOAL: ${goal.title}
- Target: ${label} by ${goal.target_date} (${daysLeft} days left)
- Current: ${currentLabel} (${pct}% of target)
- Gap: ${formatMetricLabel(goal.target_type, Math.max(0, gap))}
- Run rate needed: ${runRate}
- Your strategy: ${goal.strategy ?? 'Not yet defined — define one this cycle'}
- Goal ID: ${goal.id}`
    })
  )

  return `## 🎯 ACTIVE GOALS — VERDANT IS ACCOUNTABLE FOR THESE

${goalLines.join('\n\n')}

**GOAL-ORIENTED BEHAVIOUR REQUIRED:**
Every action this cycle must be evaluated against these goals. Ask yourself:
1. Does this action directly contribute to hitting a goal?
2. What is the highest-leverage action I can take RIGHT NOW to close the gap?
3. If behind on a goal, escalate urgency — more outreach, more bids, new markets.
4. After this cycle, update your strategy for each goal using the update_goal_strategy tool.
`
}

function formatMetricLabel(type: GoalTargetType, value: number): string {
  switch (type) {
    case 'revenue':
    case 'mrr':
    case 'pipeline_value':
      return `£${value.toLocaleString()}`
    default:
      return `${Math.round(value)}`
  }
}
