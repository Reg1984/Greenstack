/**
 * VERDANT Directives — standing freeform commands VERDANT works toward
 * every cycle until closed, independent of the numeric goals system
 * (lib/verdant-goals.ts). A directive is open-ended — "land a meeting with
 * Liverpool City Council procurement", "get GIZ to respond to our
 * capability statement" — not a KPI target with a numeric current_value.
 *
 * Created from chat (Reg gives the command once). Picked up and acted on
 * by the autonomous cron cycle every run after that, until VERDANT marks it
 * completed or blocked.
 */

import { createClient } from '@/lib/supabase/server'

export interface VerdantDirective {
  id: string
  instruction: string
  status: 'active' | 'completed' | 'blocked' | 'cancelled'
  cycles_worked: number
  last_action: string | null
  blocked_reason: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export async function getActiveDirectives(): Promise<VerdantDirective[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('verdant_directives')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
    return (data as VerdantDirective[]) ?? []
  } catch {
    return []
  }
}

/** Format active directives as cycle context — empty string if none, so it disappears from the prompt cleanly */
export async function formatDirectivesForVerdant(): Promise<string> {
  const directives = await getActiveDirectives()
  if (directives.length === 0) return ''

  const lines = directives.map(d => `### DIRECTIVE ${d.id}
Instruction: ${d.instruction}
Cycles worked so far: ${d.cycles_worked}
Last action taken: ${d.last_action ?? 'Not started yet — this is the first cycle on this directive.'}`).join('\n\n')

  return `## 🎯 STANDING DIRECTIVES — WORK THESE EVERY CYCLE UNTIL CLOSED

Reg gave you these commands directly. They persist across cycles — you don't get re-prompted, so YOU are responsible for remembering where you left off (via "Last action taken" above and your memory files) and pushing each one forward.

${lines}

**RULES:**
1. Every cycle, for every active directive above, take the single highest-leverage action you can toward closing it — send the email, make the call via browse_portal, chase the reply, whatever moves it forward. Never just re-read it and do nothing.
2. Call \`manage_directive\` with \`action: "update"\` every cycle you touch a directive — record exactly what you did, even if the answer is "nothing new to do until they reply."
3. Call \`manage_directive\` with \`action: "complete"\` the moment it's genuinely done. Don't leave finished directives sitting active.
4. Call \`manage_directive\` with \`action: "block"\` ONLY when you hit something you truly cannot get past autonomously — needs a human decision, a payment, a login you don't have, a legal question. Give Reg a specific, actionable reason, not a vague one. Blocked directives stop consuming cycle time until Reg unblocks them.
5. Do not silently give up. If you're stuck but it's not truly blocking, say so in your update and try a different angle next cycle rather than block prematurely.`
}

export async function createDirective(instruction: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('verdant_directives')
    .insert({ instruction })
    .select('id')
    .single()
  if (error) return `Failed to create directive: ${error.message}`
  return `Directive created (id: ${data.id}). It will be worked every cycle from now on until completed or blocked.`
}

export async function updateDirective(
  id: string,
  action: 'update' | 'complete' | 'block' | 'cancel',
  note: string
): Promise<string> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  if (action === 'update') {
    const { data: current } = await supabase
      .from('verdant_directives')
      .select('cycles_worked')
      .eq('id', id)
      .single()
    const { error } = await supabase
      .from('verdant_directives')
      .update({ last_action: note, cycles_worked: (current?.cycles_worked ?? 0) + 1, updated_at: now })
      .eq('id', id)
    if (error) return `Failed to update directive: ${error.message}`
    return `Directive ${id} updated.`
  }

  if (action === 'complete') {
    const { error } = await supabase
      .from('verdant_directives')
      .update({ status: 'completed', last_action: note, completed_at: now, updated_at: now })
      .eq('id', id)
    if (error) return `Failed to complete directive: ${error.message}`
    return `Directive ${id} marked complete: ${note}`
  }

  if (action === 'block') {
    const { error } = await supabase
      .from('verdant_directives')
      .update({ status: 'blocked', blocked_reason: note, updated_at: now })
      .eq('id', id)
    if (error) return `Failed to block directive: ${error.message}`
    return `Directive ${id} blocked — Reg will need to unblock it. Reason: ${note}`
  }

  // cancel
  const { error } = await supabase
    .from('verdant_directives')
    .update({ status: 'cancelled', last_action: note, updated_at: now })
    .eq('id', id)
  if (error) return `Failed to cancel directive: ${error.message}`
  return `Directive ${id} cancelled: ${note}`
}
