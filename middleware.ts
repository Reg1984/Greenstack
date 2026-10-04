import { NextResponse, type NextRequest } from 'next/server'

// Everything matched below either spends Anthropic credit or acts as Reg
// (sends outreach, publishes, invoices), so it must never be open to the web.
// Allowed callers:
//   - Vercel cron and internal server calls: `Authorization: Bearer $CRON_SECRET`
//   - Reg in a browser: HTTP Basic auth with password $ADMIN_PASSWORD (any username)
// If neither secret is configured these routes are closed, not open.
export function middleware(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  const adminPassword = process.env.ADMIN_PASSWORD

  if (cronSecret && auth === `Bearer ${cronSecret}`) return NextResponse.next()

  if (adminPassword && auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6))
      if (decoded.slice(decoded.indexOf(':') + 1) === adminPassword) return NextResponse.next()
    } catch {
      // Malformed header — fall through to 401
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="GreenStack admin", charset="UTF-8"' },
  })
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/verdant/:path*', '/api/chat', '/api/cron/:path*'],
}
