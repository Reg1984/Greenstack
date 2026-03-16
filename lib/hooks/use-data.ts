'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface Tender {
  id: string
  title: string
  value: number
  status: string
  deadline: string
  [key: string]: any
}

interface Bid {
  id: string
  tender_id: string
  status: string
  [key: string]: any
}

interface Contractor {
  id: string
  name: string
  specialty?: string
  [key: string]: any
}

interface Audit {
  id: string
  client: string
  [key: string]: any
}

interface Report {
  id: string
  title: string
  [key: string]: any
}

interface DashboardStats {
  totalBids: number
  wonBids: number
  winRate: number
  pipelineValue: number
  totalTenders: number
}

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  return { user, loading }
}

export function useTenders() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTenders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTenders(data || [])
    } catch (e) {
      console.error('Error fetching tenders:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTenders()
  }, [fetchTenders])

  const mutate = async () => {
    await fetchTenders()
  }

  return { tenders, isLoading, mutate }
}

export function useBids() {
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBids = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setBids(data || [])
    } catch (e) {
      console.error('Error fetching bids:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBids()
  }, [fetchBids])

  const mutate = async () => {
    await fetchBids()
  }

  return { bids, isLoading, mutate }
}

export function useContractors() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchContractors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setContractors(data || [])
    } catch (e) {
      console.error('Error fetching contractors:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContractors()
  }, [fetchContractors])

  const mutate = async () => {
    await fetchContractors()
  }

  return { contractors, isLoading, mutate }
}

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAudits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAudits(data || [])
    } catch (e) {
      console.error('Error fetching audits:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAudits()
  }, [fetchAudits])

  const mutate = async () => {
    await fetchAudits()
  }

  return { audits, isLoading, mutate }
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setReports(data || [])
    } catch (e) {
      console.error('Error fetching reports:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const mutate = async () => {
    await fetchReports()
  }

  return { reports, isLoading, mutate }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const { data: tenders } = await supabase.from('tenders').select('*')
      const { data: bids } = await supabase.from('bids').select('*')
      
      const totalBids = bids?.length || 0
      const wonBids = bids?.filter(b => b.status === 'won').length || 0
      const winRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0
      const pipelineValue = tenders?.reduce((sum: number, t: any) => sum + (t.value || 0), 0) || 0
      const totalTenders = tenders?.length || 0

      setStats({
        totalBids,
        wonBids,
        winRate,
        pipelineValue,
        totalTenders,
      })
    } catch (e) {
      console.error('Error fetching stats:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const mutate = async () => {
    await fetchStats()
  }

  return { stats, isLoading, mutate }
}
