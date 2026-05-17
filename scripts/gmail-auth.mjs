/**
 * Run once to get your Gmail OAuth refresh token.
 * Usage: node scripts/gmail-auth.mjs
 *
 * Paste GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET from Google Cloud Console
 * when prompted, or set them as env vars before running.
 */

import { createServer } from 'http'
import { URL } from 'url'

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3001/oauth/callback'
const SCOPE = 'https://www.googleapis.com/auth/gmail.modify'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET as env vars before running.')
  process.exit(1)
}

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`

console.log('\n1. Open this URL in your browser:\n')
console.log(authUrl)
console.log('\n2. Sign in with regorme101@gmail.com and approve the permissions.')
console.log('3. You will be redirected to localhost — this script will capture the code.\n')

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3001')
  const code = url.searchParams.get('code')
  if (!code) { res.end('No code found.'); return }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()

  if (tokens.refresh_token) {
    console.log('\n✅ SUCCESS — Add these to Vercel environment variables:\n')
    console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`)
    console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`)
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('\nThen redeploy Vercel and Verdant will start checking your inbox every hour.\n')
    res.end('Done! Check your terminal for the credentials. You can close this tab.')
  } else {
    console.error('Token exchange failed:', tokens)
    res.end('Token exchange failed — check terminal.')
  }

  server.close()
})

server.listen(3001, () => {
  console.log('Waiting for OAuth callback on http://localhost:3001 ...\n')
})
