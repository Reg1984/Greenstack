'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Generic fetcher for Supabase queries
async function fetchTenders() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('tenders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return data || []
}

async function fetchBids() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('bids')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  
  return data || []
}

async function fetchContractors() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('contractors')
    .select('*')
    .eq('user_id', user.id)
    .order('score', { ascending: false })
  
  return data || []
}

async function fetchAudits() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('audits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return data || []
}

async function fetchReports() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return data || []
}

async function fetchDashboardStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const [tendersRes, bidsRes, contractorsRes] = await Promise.all([
    supabase.from('tenders').select('id, value, status').eq('user_id', user.id),
    supabase.from('bids').select('id, status, value').eq('user_id', user.id),
    supabase.from('contractors').select('id, status').eq('user_id', user.id),
  ])
  
  const tenders = tendersRes.data || []
  const bids = bidsRes.data || []
  const contractors = contractorsRes.data || []
  
  const pipelineValue = tenders.reduce((sum, t) => sum + (t.value || 0), 0)
  const wonBids = bids.filter(b => b.status === 'won')
  const winRate = bids.length > 0 ? Math.round((wonBids.length / bids.length) * 100) : 0
  
  return {
    totalTenders: tenders.length,
    activeTenders: tenders.filter(t => ['open', 'found', 'reviewing'].includes(t.status)).length,
    totalBids: bids.length,
    wonBids: wonBids.length,
    winRate,
    pipelineValue,
    activeContractors: contractors.filter(c => c.status === 'active').length,
  }
}

// SWR Hooks
export function useTenders() {
  const { data, error, isLoading, mutate } = useSWR('tenders', fetchTenders)
  return { tenders: data || [], error, isLoading, mutate }
}

export function useBids() {
  const { data, error, isLoading, mutate } = useSWR('bids', fetchBids)
  return { bids: data || [], error, isLoading, mutate }
}

export function useContractors() {
  const { data, error, isLoading, mutate } = useSWR('contractors', fetchContractors)
  return { contractors: data || [], error, isLoading, mutate }
}

export function useAudits() {
  const { data, error, isLoading, mutate } = useSWR('audits', fetchAudits)
  return { audits: data || [], error, isLoading, mutate }
}

export function useReports() {
  const { data, error, isLoading, mutate } = useSWR('reports', fetchReports)
  return { reports: data || [], error, isLoading, mutate }
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR('dashboard-stats', fetchDashboardStats)
  return { stats: data, error, isLoading, mutate }
}

// Auth hook
export function useUser() {
  const { data, error, isLoading } = useSWR('user', async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  })
  return { user: data, error, isLoading }
}
