/**
 * GitHub Publisher — VERDANT's website building tool
 * Allows VERDANT to create and update pages, blog posts, case studies
 * directly in the GreenStack repo. Vercel auto-deploys on push.
 */

const GITHUB_API = 'https://api.github.com'
const REPO_OWNER = 'Reg1984'
const REPO_NAME = 'Greenstack'
const DEFAULT_BRANCH = 'main'

export interface PublishResult {
  success: boolean
  url?: string
  sha?: string
  error?: string
}

export interface FileContent {
  path: string        // e.g. "app/blog/cbam-guide/page.tsx" or "content/case-studies/nhs-trust.md"
  content: string     // File content (will be base64 encoded)
  message: string     // Commit message
  branch?: string
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Get the current SHA of a file (needed for updates) */
async function getFileSha(path: string, token: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.sha ?? null
  } catch {
    return null
  }
}

/** Create or update a file in the repo */
export async function publishFile(file: FileContent): Promise<PublishResult> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return { success: false, error: 'GITHUB_TOKEN not set' }

  try {
    const branch = file.branch ?? DEFAULT_BRANCH
    const existingSha = await getFileSha(file.path, token)

    const body: Record<string, string> = {
      message: file.message,
      content: Buffer.from(file.content).toString('base64'),
      branch,
    }
    if (existingSha) body.sha = existingSha

    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${file.path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: err }
    }

    const data = await res.json()
    const htmlUrl = data?.content?.html_url ?? `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${branch}/${file.path}`

    return { success: true, url: htmlUrl, sha: data?.content?.sha }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/** Read a file from the repo */
export async function readRepoFile(path: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null

  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.content) return null
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

/** List files in a directory */
export async function listRepoDir(path: string): Promise<string[]> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return []

  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data.map((f: any) => f.name) : []
  } catch {
    return []
  }
}
