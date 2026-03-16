'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GsCard } from './greenstack-ui'

export function AppHeader({ user }: { user: { email?: string; user_metadata?: Record<string, any> } }) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const logout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background/40 backdrop-blur-md">
      <div>
        <h1 className="text-lg font-bold text-white">GreenStack</h1>
        <p className="text-xs text-slate-500">AI Sustainability Intelligence</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-300 transition-all flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
            {user.email?.[0].toUpperCase()}
          </div>
          {user.email}
        </button>

        {showMenu && (
          <GsCard className="absolute top-full right-0 mt-2 w-48 p-2 z-50">
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-slate-400">
                <p className="font-medium">{user.email}</p>
              </div>
              <button
                onClick={logout}
                disabled={loading}
                className="w-full px-3 py-2 text-left text-sm rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </GsCard>
        )}
      </div>
    </header>
  )
}
