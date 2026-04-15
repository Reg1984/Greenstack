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

/** Send an outreach email via Resend and log to CRM */
export async function sendOutreachEmail(params: {
  to: string
  subject: string
  body: string
  organisation: string
  contact_name?: string
  sector?: string
  country?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not set' }

  try {
    const html = `<div style="font-family:sans-serif;max-width:600px;line-height:1.6">${params.body.replace(/\n/g, '<br>')}</div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Reginald Orme — GreenStack AI <verdant@greenstackai.co.uk>',
        to: params.to,
        bcc: 'info@greenstackai.co.uk',
        subject: params.subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: err }
    }

    // Log to CRM
    await upsertContact({
      organisation: params.organisation,
      contact_name: params.contact_name,
      contact_email: params.to,
      sector: params.sector,
      country: params.country ?? 'UK',
      source: 'verdant-chat',
      notes: params.notes ?? params.subject,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/** Query CRM for VERDANT tool use */
export async function queryCRM(filter: string = 'all'): Promise<string> {
  try {
    const supabase = await createClient()

    if (filter === 'due_followup') {
      const { data } = await supabase
        .from('outreach_contacts')
        .select('organisation, contact_name, contact_email, status, followup_count, last_contacted_at, followup_due_at, notes')
        .in('status', ['emailed', 'followed_up'])
        .lte('followup_due_at', new Date().toISOString())
        .lt('followup_count', 2)
        .order('followup_due_at', { ascending: true })
        .limit(20)
      if (!data?.length) return 'No follow-ups due.'
      return `FOLLOW-UPS DUE (${data.length}):\n` + data.map(c =>
        `• ${c.organisation} | ${c.contact_name ?? 'unknown'} | ${c.contact_email} | sent ${c.followup_count + 1}x | last: ${c.last_contacted_at?.split('T')[0]}`
      ).join('\n')
    }

    if (filter === 'replied') {
      const { data } = await supabase
        .from('outreach_contacts')
        .select('organisation, contact_name, contact_email, replied_at, notes')
        .eq('status', 'replied')
        .order('replied_at', { ascending: false })
        .limit(20)
      if (!data?.length) return 'No replies yet.'
      return `REPLIED (${data.length}):\n` + data.map(c =>
        `• ${c.organisation} | ${c.contact_name ?? 'unknown'} | ${c.contact_email} | replied: ${c.replied_at?.split('T')[0]}`
      ).join('\n')
    }

    // Search by org name
    if (filter !== 'all') {
      const { data } = await supabase
        .from('outreach_contacts')
        .select('organisation, contact_name, contact_email, status, followup_count, last_contacted_at, notes')
        .ilike('organisation', `%${filter}%`)
        .order('created_at', { ascending: false })
        .limit(10)
      if (!data?.length) return `No CRM records matching: ${filter}`
      return `CRM RESULTS FOR "${filter}":\n` + data.map(c =>
        `• ${c.organisation} | ${c.contact_name ?? 'unknown'} | ${c.contact_email} | status: ${c.status} | contacted: ${c.last_contacted_at?.split('T')[0]}`
      ).join('\n')
    }

    // All — summary + recent
    const { data } = await supabase
      .from('outreach_contacts')
      .select('organisation, contact_name, contact_email, status, last_contacted_at, country, sector')
      .order('last_contacted_at', { ascending: false })
      .limit(30)

    if (!data?.length) return 'CRM is empty — no contacts yet.'

    const counts: Record<string, number> = {}
    data.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1 })

    return `CRM PIPELINE: ${data.length} contacts shown (${Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(', ')})\n\nRECENT CONTACTS:\n` +
      data.slice(0, 15).map(c =>
        `• ${c.organisation} | ${c.contact_name ?? '—'} | ${c.contact_email ?? '—'} | ${c.status} | ${c.last_contacted_at?.split('T')[0] ?? '—'}`
      ).join('\n')
  } catch (err) {
    return `CRM query error: ${String(err)}`
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
