'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Data fetching functions
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
  
  const pipelineValue = tenders.reduce((sum: number, t: any) => sum + (t.value || 0), 0)
  const wonBids = bids.filter((b: any) => b.status === 'won')
  const winRate = bids.length > 0 ? Math.round((wonBids.length / bids.length) * 100) : 0
  
  return {
    totalTenders: tenders.length,
    activeTenders: tenders.filter((t: any) => ['open', 'found', 'reviewing'].includes(t.status)).length,
    totalBids: bids.length,
    wonBids: wonBids.length,
    winRate,
    pipelineValue,
    activeContractors: contractors.filter((c: any) => c.status === 'active').length,
  }
}

// Custom hooks using useState + useEffect
export function useTenders() {
  const [tenders, setTenders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchTenders()
      .then(setTenders)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  const mutate = () => {
    setIsLoading(true)
    fetchTenders()
      .then(setTenders)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }

  return { tenders, error, isLoading, mutate }
}

export function useBids() {
  const [bids, setBids] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchBids()
      .then(setBids)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  const mutate = () => {
    setIsLoading(true)
    fetchBids()
      .then(setBids)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }

  return { bids, error, isLoading, mutate }
}

export function useContractors() {
  const [contractors, setContractors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchContractors()
      .then(setContractors)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  const mutate = () => {
    setIsLoading(true)
    fetchContractors()
      .then(setContractors)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }

  return { contractors, error, isLoading, mutate }
}

export function useAudits() {
  const [audits, setAudits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchAudits()
      .then(setAudits)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  const mutate = () => {
    setIsLoading(true)
    fetchAudits()
      .then(setAudits)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }

  return { audits, error, isLoading, mutate }
}

export function useReports() {
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchReports()
      .then(setReports)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  const mutate = () => {
    setIsLoading(true)
    fetchReports()
      .then(setReports)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }

  return { reports, error, isLoading, mutate }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchDashboardStats()
      .then(setStats)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  const mutate = () => {
    setIsLoading(true)
    fetchDashboardStats()
      .then(setStats)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }

  return { stats, error, isLoading, mutate }
}

// Auth hook
export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    supabase.auth.getUser()
      .then(({ data: { user } }) => setUser(user))
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { user, error, isLoading }
}
