/**
 * VERDANT Outreach CRM
 * Tracks every contact in the pipeline — prevents duplicate emails,
 * manages follow-up sequences, and builds intelligence over time.
 */

import { createClient } from '@/lib/supabase/server'

export interface OutreachContact {
  id: string
  organisation: string
  contact_name: string | null
  contact_email: string | null
  contact_title: string | null
  sector: string | null
  country: string
  signal: string | null
  status: string
  followup_count: number
  last_contacted_at: string | null
  followup_due_at: string | null
  replied_at: string | null
  notes: string | null
  source: string | null
  created_at: string
}

/** Check if a contact already exists in the CRM */
export async function checkContactExists(
  email: string | null,
  organisation: string
): Promise<OutreachContact | null> {
  try {
    const supabase = await createClient()

    if (email) {
      const { data } = await supabase
        .from('outreach_contacts')
        .select('*')
        .eq('contact_email', email)
        .single()
      if (data) return data
    }

    // Fuzzy org match — check if we've contacted this org recently
    const { data } = await supabase
      .from('outreach_contacts')
      .select('*')
      .ilike('organisation', `%${organisation.split(' ')[0]}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return data ?? null
  } catch {
    return null
  }
}

/** Upsert contact after sending an email */
export async function upsertContact(contact: {
  organisation: string
  contact_name?: string
  contact_email?: string
  contact_title?: string
  sector?: string
  country?: string
  signal?: string
  source?: string
  notes?: string
}): Promise<OutreachContact | null> {
  try {
    const supabase = await createClient()

    const now = new Date().toISOString()
    // Follow-up sequence: email 1 → 4 days → email 2 → 7 days → email 3
    const followupDue = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()

    const { data: existing } = contact.contact_email
      ? await supabase.from('outreach_contacts').select('*').eq('contact_email', contact.contact_email).single()
      : { data: null }

    if (existing) {
      // Update existing — increment followup count if already emailed
      const { data } = await supabase
        .from('outreach_contacts')
        .update({
          followup_count: existing.followup_count + (existing.status === 'emailed' || existing.status === 'followed_up' ? 1 : 0),
          status: existing.status === 'identified' ? 'emailed' : 'followed_up',
          last_contacted_at: now,
          followup_due_at: existing.followup_count < 2 ? (
            existing.followup_count === 0
              ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          ) : null,
          updated_at: now,
          notes: contact.notes ?? existing.notes,
        })
        .eq('id', existing.id)
        .select()
        .single()
      return data
    }

    // Create new contact
    const { data } = await supabase
      .from('outreach_contacts')
      .insert({
        organisation: contact.organisation,
        contact_name: contact.contact_name ?? null,
        contact_email: contact.contact_email ?? null,
        contact_title: contact.contact_title ?? null,
        sector: contact.sector ?? null,
        country: contact.country ?? 'UK',
        signal: contact.signal ?? null,
        source: contact.source ?? 'verdant',
        status: 'emailed',
        followup_count: 0,
        last_contacted_at: now,
        followup_due_at: followupDue,
        notes: contact.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    return data
  } catch (err) {
    console.error('CRM upsert error:', err)
    return null
  }
}

/** Get all contacts due a follow-up email */
export async function getFollowupsDue(): Promise<OutreachContact[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('outreach_contacts')
      .select('*')
      .in('status', ['emailed', 'followed_up'])
      .lte('followup_due_at', new Date().toISOString())
      .lt('followup_count', 2)
      .not('contact_email', 'is', null)
      .order('followup_due_at', { ascending: true })
      .limit(20)

    return data ?? []
  } catch {
    return []
  }
}

/** Get CRM summary stats */
export async function getCRMSummary(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('outreach_contacts').select('status, country, sector')

    if (!data || data.length === 0) return 'CRM: No contacts yet.'

    const counts: Record<string, number> = {}
    data.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1 })

    const followupsDue = data.filter(c =>
      (c.status === 'emailed' || c.status === 'followed_up') &&
      counts['emailed'] > 0
    ).length

    return `CRM PIPELINE: ${data.length} total contacts | ` +
      Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(' | ') +
      ` | ~${followupsDue} follow-ups due`
  } catch {
    return 'CRM: Unable to load.'
  }
}

/** Mark contact as replied */
export async function markContactReplied(contactId: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase
      .from('outreach_contacts')
      .update({
        status: 'replied',
        replied_at: new Date().toISOString(),
        followup_due_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
  } catch { /* non-fatal */ }
}
