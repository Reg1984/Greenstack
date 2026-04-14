import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { sendOutreachEmail } from '@/lib/outreach-crm'
import { publishFile, readRepoFile, listRepoDir } from '@/lib/github-publisher'
import { scrapeUrl, searchAndScrape } from '@/lib/firecrawl'

const client = new Anthropic()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'send_email',
    description: 'Send an outreach email to an external contact and log it to the CRM.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
        organisation: { type: 'string' },
        contact_name: { type: 'string' },
        sector: { type: 'string' },
        country: { type: 'string' },
      },
      required: ['to', 'subject', 'body', 'organisation'],
    },
  },
  {
    name: 'publish_to_website',
    description: 'Create or update a file on the GreenStack website. Use this to add blog posts, case studies, service pages, or update existing content. The file will be committed to GitHub and Vercel will auto-deploy it. For new Next.js pages use path like "app/insights/cbam-guide/page.tsx". For markdown content use "content/blog/post-title.md".',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path in the repo e.g. app/insights/cbam-guide/page.tsx' },
        content: { type: 'string', description: 'Full file content to write' },
        message: { type: 'string', description: 'Git commit message describing what was added/changed' },
      },
      required: ['path', 'content', 'message'],
    },
  },
  {
    name: 'read_website_file',
    description: 'Read the current content of a file in the GreenStack repo. Use this before updating a file to understand what is already there.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path in the repo' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_website_files',
    description: 'List files in a directory of the GreenStack repo. Use this to understand existing site structure.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Directory path e.g. app or app/insights' },
      },
      required: ['path'],
    },
  },
  {
    name: 'scrape_webpage',
    description: 'Scrape a webpage and get its content as clean markdown. Use for researching companies, reading tender portals, extracting competitor intelligence.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_search_and_read',
    description: 'Search the web and return full page content for the top results. Better than keyword search — returns actual page content. Use for company research, finding decision-makers, market intelligence.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Number of results (default 5)' },
      },
      required: ['query'],
    },
  },
]

async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case 'send_email': {
        const result = await sendOutreachEmail(input as any)
        return result.success
          ? `✅ Email sent to ${input.to}. Logged to CRM.`
          : `❌ Email failed: ${result.error}`
      }

      case 'publish_to_website': {
        const result = await publishFile({
          path: input.path,
          content: input.content,
          message: input.message,
        })
        return result.success
          ? `✅ Published to ${input.path}. GitHub URL: ${result.url}. Vercel deploying now.`
          : `❌ Publish failed: ${result.error}`
      }

      case 'read_website_file': {
        const content = await readRepoFile(input.path)
        return content ? `File content:\n\`\`\`\n${content}\n\`\`\`` : `File not found: ${input.path}`
      }

      case 'list_website_files': {
        const files = await listRepoDir(input.path)
        return files.length ? `Files in ${input.path}:\n${files.join('\n')}` : `No files found in ${input.path}`
      }

      case 'scrape_webpage': {
        const result = await scrapeUrl(input.url)
        return result.success
          ? `Scraped ${input.url}:\n\n${result.markdown.slice(0, 3000)}`
          : `Failed to scrape ${input.url}`
      }

      case 'web_search_and_read': {
        const results = await searchAndScrape(input.query, { limit: input.limit ?? 5 })
        if (!results.length) return `No results for: ${input.query}`
        return results.map(r => `## ${r.title ?? r.url}\n${r.url}\n\n${r.markdown.slice(0, 800)}`).join('\n\n---\n\n')
      }

      default:
        return `Unknown tool: ${name}`
    }
  } catch (err) {
    return `Tool error: ${String(err)}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, systemPrompt } = await request.json()

    const systemBase = systemPrompt || `You are VERDANT — the world's most advanced green energy and sustainability AI agent, built for GreenStack AI.

You have direct tools to:
- Send outreach emails (send_email)
- Build and update the GreenStack website (publish_to_website, read_website_file, list_website_files)
- Research companies and scrape web pages (scrape_webpage, web_search_and_read)

When asked to send emails — use send_email tool directly, do not just draft.
When asked to build or update the website — use publish_to_website. Read the existing file first if updating.
When researching companies or finding contacts — use web_search_and_read.`

    let currentMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Agentic loop — keep running until no more tool calls
    for (let iteration = 0; iteration < 10; iteration++) {
      const response = await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 4096,
        tools: TOOLS,
        system: systemBase,
        messages: currentMessages,
      })

      if (response.stop_reason !== 'tool_use') {
        const text = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
        return NextResponse.json({ response: text?.text ?? 'Done.' })
      }

      // Execute all tool calls in parallel
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await executeTool(toolUse.name, toolUse.input as Record<string, any>)
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result,
          }
        })
      )

      // Add assistant response and tool results to message history
      currentMessages = [
        ...currentMessages,
        { role: 'assistant' as const, content: response.content },
        { role: 'user' as const, content: toolResults },
      ]
    }

    return NextResponse.json({ response: 'Completed all tasks.' })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Chat processing failed' }, { status: 500 })
  }
}
