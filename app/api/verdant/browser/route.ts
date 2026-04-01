export const maxDuration = 300

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_PROFILE } from '@/lib/company-profile'
import { fillFormForReview, submitForm } from '@/lib/browser-agent'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BROWSER_SYSTEM = `You are VERDANT — the Sovereign Tender Intelligence Agent for GreenStack AI. You have been given browser access to fill out a form on behalf of GreenStack AI.

${COMPANY_PROFILE}

## YOUR TASK
Analyse the form at the given URL and determine exactly what fields to fill in. You will return a structured list of form fields with the correct values based on GreenStack AI's company profile.

## RULES
- Fill in GreenStack AI's real information — do not fabricate data
- If a field requires information you don't have (e.g. a specific insurance certificate number), mark it as NEEDS_HUMAN with a note
- Be precise with CSS selectors — prefer id, name, or aria-label selectors
- For registration forms, always read the full page first to understand what's required

## OUTPUT FORMAT
Return ONLY a JSON object:
{
  "purpose": "short description of what this form does",
  "fields": [
    {
      "selector": "#email or input[name='email'] or label text",
      "value": "verdant@greenstackai.co.uk",
      "type": "text",
      "description": "Email address"
    }
  ],
  "submit_selector": "CSS selector for the submit button",
  "notes": "anything the human should know before approving",
  "needs_human": ["list of fields that need human input before this can be submitted"]
}`

// POST — VERDANT analyses a form URL and fills it for review
export async function POST(request: Request) {
  try {
    const { url, purpose, custom_instructions } = await request.json()

    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
      return NextResponse.json({
        error: 'Browser automation not configured. Add BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID to your Vercel environment variables. Sign up free at browserbase.com.',
      }, { status: 503 })
    }

    // Step 1: VERDANT reads the page first via Jina
    let pageContent = ''
    try {
      const jina = await fetch(`https://r.jina.ai/${url}`, {
        headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      })
      pageContent = (await jina.text()).slice(0, 6000)
    } catch { /* page read optional */ }

    // Step 2: VERDANT decides what to fill
    const prompt = `I need to fill out this form for GreenStack AI:
URL: ${url}
Purpose: ${purpose ?? 'Registration / application form'}
${custom_instructions ? `Additional instructions: ${custom_instructions}` : ''}

Page content (from browser read):
${pageContent || 'Could not pre-read — analyse from URL and purpose'}

Based on GreenStack AI's company profile and the form content, determine exactly what to fill in each field. Return the JSON object only.`

    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: BROWSER_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'VERDANT could not parse the form structure' }, { status: 500 })
    }

    const plan = JSON.parse(jsonMatch[0])

    // Step 3: Actually fill the form with Playwright + Browserbase
    const session = await fillFormForReview(url, plan.purpose, purpose ?? '', plan.fields ?? [])

    // Step 4: Save to Supabase for approval
    const supabase = await createClient()
    const { data: saved } = await supabase.from('browser_sessions').insert({
      status: 'pending_review',
      url,
      purpose: plan.purpose,
      instructions: purpose,
      form_data: session.formData,
      screenshot_base64: session.screenshotBase64,
    }).select().single()

    return NextResponse.json({
      session_id: saved?.id,
      purpose: plan.purpose,
      form_data: session.formData,
      screenshot_base64: session.screenshotBase64,
      notes: plan.notes,
      needs_human: plan.needs_human ?? [],
      submit_selector: plan.submit_selector,
      fields: plan.fields,
    })
  } catch (error) {
    console.error('Browser agent error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PUT — human has approved, submit the form
export async function PUT(request: Request) {
  try {
    const { session_id } = await request.json()

    const supabase = await createClient()

    // Load the session
    const { data: session } = await supabase
      .from('browser_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.status !== 'pending_review') {
      return NextResponse.json({ error: `Session is ${session.status}, not pending_review` }, { status: 400 })
    }

    // Mark as approved
    await supabase.from('browser_sessions').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', session_id)

    // Re-fill and submit
    const result = await submitForm(session.url, session.form_data?.fields ?? [], session.form_data?.submit_selector)

    // Save result
    await supabase.from('browser_sessions').update({
      status: result.success ? 'submitted' : 'failed',
      result_screenshot_base64: result.screenshotBase64,
      error_message: result.success ? null : result.message,
      submitted_at: result.success ? new Date().toISOString() : null,
    }).eq('id', session_id)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      result_screenshot_base64: result.screenshotBase64,
    })
  } catch (error) {
    console.error('Browser submit error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE — reject/discard a pending session
export async function DELETE(request: Request) {
  try {
    const { session_id } = await request.json()
    const supabase = await createClient()
    await supabase.from('browser_sessions').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', session_id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
