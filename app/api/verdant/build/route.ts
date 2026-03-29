import Anthropic from '@anthropic-ai/sdk'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BUILD_SYSTEM_PROMPT = `You are VERDANT — the Sovereign Tender Intelligence Agent for GreenStack AI. You also have the ability to read and modify the GreenStack platform's own codebase.

## COMPANY PROFILE
${COMPANY_PROFILE}

## YOUR BUILD CAPABILITY
You can propose and apply changes to the GreenStack website/platform. When asked to build, fix or improve something on the site, you:

1. Analyse what needs to change
2. Return a structured response with the exact file changes needed
3. Explain what you changed and why

## RESPONSE FORMAT FOR CODE CHANGES
When you want to propose a code change, your response MUST include a JSON block in this exact format (surrounded by triple backticks and the word "buildplan"):

\`\`\`buildplan
{
  "description": "Short description of what this does",
  "changes": [
    {
      "file": "relative/path/from/project/root.ts",
      "operation": "edit",
      "old_string": "exact string to find and replace",
      "new_string": "replacement string"
    }
  ]
}
\`\`\`

Supported operations: "edit" (find/replace), "create" (new file — provide full content in new_string)

## RULES
- Only modify files in the GreenStack project (app/, lib/, components/, etc.)
- Never modify .env files or secrets
- Always explain your reasoning before the buildplan
- If you're not proposing code changes, respond normally without a buildplan block
- Be precise with old_string — it must exactly match what's in the file

You are VERDANT. Build brilliantly.`

export async function POST(request: Request) {
  try {
    const { messages, action } = await request.json()

    // If applying a previously approved plan
    if (action === 'apply') {
      const { plan } = await request.json().catch(() => ({ plan: null }))
      return applyBuildPlan(plan)
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: BUILD_SYSTEM_PROMPT,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract buildplan if present
    const buildplanMatch = reply.match(/```buildplan\s*([\s\S]*?)```/)
    let buildPlan = null
    if (buildplanMatch) {
      try {
        buildPlan = JSON.parse(buildplanMatch[1].trim())
      } catch {
        // Invalid JSON in buildplan — ignore
      }
    }

    return NextResponse.json({ reply, buildPlan })
  } catch (error) {
    console.error('VERDANT build error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { plan } = await request.json()
    return applyBuildPlan(plan)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function applyBuildPlan(plan: any) {
  if (!plan?.changes?.length) {
    return NextResponse.json({ error: 'No valid build plan provided' }, { status: 400 })
  }

  const projectRoot = process.cwd()
  const results: { file: string; success: boolean; error?: string }[] = []

  for (const change of plan.changes) {
    const filePath = path.join(projectRoot, change.file)

    // Security: ensure path stays within project root
    if (!filePath.startsWith(projectRoot)) {
      results.push({ file: change.file, success: false, error: 'Path traversal blocked' })
      continue
    }

    try {
      if (change.operation === 'create') {
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(filePath, change.new_string, 'utf-8')
        results.push({ file: change.file, success: true })
      } else if (change.operation === 'edit') {
        if (!fs.existsSync(filePath)) {
          results.push({ file: change.file, success: false, error: 'File not found' })
          continue
        }
        const content = fs.readFileSync(filePath, 'utf-8')
        if (!content.includes(change.old_string)) {
          results.push({ file: change.file, success: false, error: 'old_string not found in file' })
          continue
        }
        const updated = content.replace(change.old_string, change.new_string)
        fs.writeFileSync(filePath, updated, 'utf-8')
        results.push({ file: change.file, success: true })
      }
    } catch (err) {
      results.push({ file: change.file, success: false, error: String(err) })
    }
  }

  const allOk = results.every(r => r.success)
  return NextResponse.json({ success: allOk, results })
}
