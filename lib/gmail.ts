const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

async function getAccessToken(): Promise<string> {
  const res = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Gmail token error: ${JSON.stringify(data)}`)
  return data.access_token
}

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) return decodeBase64(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return decodeBase64(part.body.data)
    }
    for (const part of payload.parts) {
      const nested = extractBody(part)
      if (nested) return nested
    }
  }
  return ''
}

export interface GmailMessage {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
  body: string
}

export async function checkGmailInbox(query: string, maxResults = 10): Promise<GmailMessage[]> {
  const token = await getAccessToken()

  const listRes = await fetch(
    `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const listData = await listRes.json()
  if (!listData.messages?.length) return []

  const messages: GmailMessage[] = await Promise.all(
    listData.messages.map(async (msg: { id: string }) => {
      const msgRes = await fetch(`${GMAIL_API}/messages/${msg.id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const msgData = await msgRes.json()
      const headers: { name: string; value: string }[] = msgData.payload?.headers ?? []
      const get = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
      return {
        id: msg.id,
        subject: get('Subject'),
        from: get('From'),
        date: get('Date'),
        snippet: msgData.snippet ?? '',
        body: extractBody(msgData.payload).slice(0, 2000),
      }
    })
  )

  return messages
}

export async function markAsRead(messageId: string): Promise<void> {
  const token = await getAccessToken()
  await fetch(`${GMAIL_API}/messages/${messageId}/modify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  })
}
