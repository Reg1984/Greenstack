import AppShell from '@/components/app-shell'
import { AppHeader } from '@/components/app-header'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col h-screen">
      <AppHeader user={user!} />
      <main className="flex-1 overflow-y-auto">
        <AppShell />
      </main>
    </div>
  )
}
