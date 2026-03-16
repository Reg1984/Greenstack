'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to get authenticated user
async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

// ============ PROFILES ============
export async function getUserProfile() {
  const auth = await getAuthUser()
  if (!auth) return null
  
  const { data } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single()
  
  return data
}

export async function updateProfile(updates: {
  full_name?: string
  company_name?: string
}) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', auth.user.id)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

// ============ TENDERS ============
export async function getTenders() {
  const auth = await getAuthUser()
  if (!auth) return []
  
  const { data } = await auth.supabase
    .from('tenders')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
  
  return data || []
}

export async function getTenderById(id: string) {
  const auth = await getAuthUser()
  if (!auth) return null
  
  const { data } = await auth.supabase
    .from('tenders')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single()
  
  return data
}

export async function createTender(tender: {
  title: string
  client?: string
  sector?: string
  region?: string
  value?: number
  deadline?: string
  description?: string
  requirements?: string
  lat?: number
  lng?: number
  ai_score?: number
  source_url?: string
}) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('tenders')
    .insert([{ ...tender, user_id: auth.user.id, status: 'found' }])
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function updateTender(id: string, updates: Partial<{
  title: string
  client: string
  sector: string
  region: string
  value: number
  deadline: string
  status: string
  description: string
  requirements: string
  ai_score: number
}>) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('tenders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteTender(id: string) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { error } = await auth.supabase
    .from('tenders')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)
  
  if (error) throw error
  revalidatePath('/')
}

// ============ BIDS ============
export async function getBids() {
  const auth = await getAuthUser()
  if (!auth) return []
  
  const { data } = await auth.supabase
    .from('bids')
    .select('*, tenders(title, client, value)')
    .eq('user_id', auth.user.id)
    .order('updated_at', { ascending: false })
  
  return data || []
}

export async function createBid(bid: {
  tender_id?: string
  tender_title: string
  value?: number
  status?: string
  content?: Record<string, any>
}) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('bids')
    .insert([{ 
      ...bid, 
      user_id: auth.user.id, 
      status: bid.status || 'drafting',
      progress: 0 
    }])
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function updateBid(id: string, updates: Partial<{
  status: string
  progress: number
  ai_score: number
  content: Record<string, any>
}>) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('bids')
    .update({ ...updates, last_edit: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteBid(id: string) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { error } = await auth.supabase
    .from('bids')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)
  
  if (error) throw error
  revalidatePath('/')
}

// ============ CONTRACTORS ============
export async function getContractors() {
  const auth = await getAuthUser()
  if (!auth) return []
  
  const { data } = await auth.supabase
    .from('contractors')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('score', { ascending: false })
  
  return data || []
}

export async function createContractor(contractor: {
  name: string
  specialty?: string
  region?: string
  score?: number
  rating?: number
  accreditations?: string[]
  contact_email?: string
  contact_phone?: string
  notes?: string
}) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('contractors')
    .insert([{ 
      ...contractor, 
      user_id: auth.user.id, 
      status: 'active',
      jobs: 0,
      on_time: 100
    }])
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function updateContractor(id: string, updates: Partial<{
  name: string
  specialty: string
  region: string
  score: number
  rating: number
  status: string
  accreditations: string[]
  notes: string
}>) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('contractors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteContractor(id: string) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { error } = await auth.supabase
    .from('contractors')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)
  
  if (error) throw error
  revalidatePath('/')
}

// ============ AUDITS ============
export async function getAudits() {
  const auth = await getAuthUser()
  if (!auth) return []
  
  const { data } = await auth.supabase
    .from('audits')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
  
  return data || []
}

export async function createAudit(audit: {
  client: string
  audit_type: string
  status?: string
  date?: string
  report_content?: string
  savings?: string
  co2_reduction?: string
}) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('audits')
    .insert([{ 
      ...audit, 
      user_id: auth.user.id,
      status: audit.status || 'scheduled'
    }])
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function updateAudit(id: string, updates: Partial<{
  status: string
  report_content: string
  savings: string
  co2_reduction: string
}>) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('audits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

// ============ REPORTS ============
export async function getReports() {
  const auth = await getAuthUser()
  if (!auth) return []
  
  const { data } = await auth.supabase
    .from('reports')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
  
  return data || []
}

export async function createReport(report: {
  title: string
  report_type: string
  period?: string
  content?: string
  win_rate?: string
  total_value?: string
}) {
  const auth = await getAuthUser()
  if (!auth) throw new Error('Not authenticated')
  
  const { data, error } = await auth.supabase
    .from('reports')
    .insert([{ ...report, user_id: auth.user.id }])
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return data
}

// ============ ACTIVITY LOG ============
export async function getActivityLog(limit = 20) {
  const auth = await getAuthUser()
  if (!auth) return []
  
  const { data } = await auth.supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return data || []
}

export async function logActivity(action: string, entityType?: string, entityId?: string, metadata?: Record<string, any>) {
  const auth = await getAuthUser()
  if (!auth) return
  
  await auth.supabase
    .from('activity_log')
    .insert([{
      user_id: auth.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    }])
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats() {
  const auth = await getAuthUser()
  if (!auth) return null
  
  const [tendersRes, bidsRes, contractorsRes, auditsRes] = await Promise.all([
    auth.supabase.from('tenders').select('id, value, status', { count: 'exact' }).eq('user_id', auth.user.id),
    auth.supabase.from('bids').select('id, status, value', { count: 'exact' }).eq('user_id', auth.user.id),
    auth.supabase.from('contractors').select('id, status', { count: 'exact' }).eq('user_id', auth.user.id),
    auth.supabase.from('audits').select('id, status', { count: 'exact' }).eq('user_id', auth.user.id),
  ])
  
  const tenders = tendersRes.data || []
  const bids = bidsRes.data || []
  const contractors = contractorsRes.data || []
  const audits = auditsRes.data || []
  
  const pipelineValue = tenders.reduce((sum, t) => sum + (t.value || 0), 0)
  const wonBids = bids.filter(b => b.status === 'won')
  const winRate = bids.length > 0 ? Math.round((wonBids.length / bids.length) * 100) : 0
  
  return {
    totalTenders: tenders.length,
    activeTenders: tenders.filter(t => t.status === 'open' || t.status === 'found').length,
    totalBids: bids.length,
    wonBids: wonBids.length,
    winRate,
    pipelineValue,
    activeContractors: contractors.filter(c => c.status === 'active').length,
    completedAudits: audits.filter(a => a.status === 'completed').length,
  }
}
