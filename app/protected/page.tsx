'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030808]">
      <div className="text-emerald-400 animate-pulse">Loading...</div>
    </div>
  )
}
