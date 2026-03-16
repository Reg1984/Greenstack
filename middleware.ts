import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Only run middleware on protected routes that require authentication.
     * All other routes are publicly accessible for preview/demo mode.
     */
    '/protected/:path*',
  ],
}
