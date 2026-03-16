'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return profile
}

export async function getTenders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createTender(tender: {
  title: string
  description: string
  value: number
  deadline: string
  sector: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('tenders')
    .insert([
      {
        user_id: user.id,
        title: tender.title,
        description: tender.description,
        value: tender.value,
        deadline: tender.deadline,
        sector: tender.sector,
        status: 'open',
      },
    ])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function createBid(bid: {
  tender_id: string
  title: string
  content: string
  status: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('bids')
    .insert([
      {
        user_id: user.id,
        tender_id: bid.tender_id,
        title: bid.title,
        content: bid.content,
        status: bid.status,
      },
    ])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function saveContractor(contractor: {
  name: string
  specialty: string
  region: string
  score: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('contractors')
    .insert([
      {
        user_id: user.id,
        name: contractor.name,
        specialty: contractor.specialty,
        region: contractor.region,
        score: contractor.score,
        status: 'active',
      },
    ])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function logActivity(activity: {
  type: string
  description: string
  metadata?: Record<string, any>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('activity_log')
    .insert([
      {
        user_id: user.id,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata,
      },
    ])
  
  if (error) throw error
}
