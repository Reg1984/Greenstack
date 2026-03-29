/**
 * VERDANT Browser Agent
 * Uses Playwright Core + Browserbase to fill and submit forms
 * Human-in-the-loop: VERDANT fills → screenshot → human approves → VERDANT submits
 */

import { chromium } from 'playwright-core'

export interface FormField {
  selector: string        // CSS selector or label text
  value: string
  type?: 'text' | 'select' | 'checkbox' | 'file' | 'click'
  description?: string    // human-readable description of what was filled
}

export interface BrowserSession {
  url: string
  purpose: string
  fields: FormField[]
  screenshotBase64: string
  formData: Record<string, string>
}

function getBrowserbaseWsUrl(sessionId: string) {
  return `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
}

async function createBrowserbaseSession(): Promise<{ sessionId: string; connectUrl: string }> {
  const res = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bb-api-key': process.env.BROWSERBASE_API_KEY!,
    },
    body: JSON.stringify({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      browserSettings: { viewport: { width: 1280, height: 900 } },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Browserbase session creation failed: ${err}`)
  }

  const data = await res.json()
  return {
    sessionId: data.id,
    connectUrl: getBrowserbaseWsUrl(data.id),
  }
}

/**
 * Fill a form and take a screenshot — does NOT submit
 * Returns screenshot and form data for human review
 */
export async function fillFormForReview(
  url: string,
  purpose: string,
  instructions: string,
  fields: FormField[]
): Promise<BrowserSession> {
  const { connectUrl } = await createBrowserbaseSession()
  const browser = await chromium.connectOverCDP(connectUrl)

  try {
    const context = browser.contexts()[0] ?? await browser.newContext()
    const page = context.pages()[0] ?? await context.newPage()

    // Navigate to the form
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1500)

    const formData: Record<string, string> = {}

    // Fill each field
    for (const field of fields) {
      try {
        if (field.type === 'click') {
          await page.click(field.selector, { timeout: 5000 })
        } else if (field.type === 'select') {
          await page.selectOption(field.selector, field.value, { timeout: 5000 })
          formData[field.description ?? field.selector] = field.value
        } else if (field.type === 'checkbox') {
          const checked = field.value === 'true'
          const el = page.locator(field.selector).first()
          const isChecked = await el.isChecked()
          if (checked !== isChecked) await el.click()
          formData[field.description ?? field.selector] = field.value
        } else {
          // Default: text input — try selector, fall back to label text
          const el = page.locator(field.selector).first()
          if (await el.count() > 0) {
            await el.fill(field.value, { timeout: 5000 })
          } else {
            // Try finding by label
            await page.getByLabel(field.selector, { exact: false }).fill(field.value)
          }
          formData[field.description ?? field.selector] = field.value
        }
        await page.waitForTimeout(300)
      } catch {
        // Log but continue — partial fills are still useful
        formData[`${field.description ?? field.selector} [ERROR]`] = field.value
      }
    }

    // Scroll to top for screenshot
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    // Take full-page screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: true })
    const screenshotBase64 = screenshotBuffer.toString('base64')

    return { url, purpose, fields, screenshotBase64, formData }
  } finally {
    await browser.close()
  }
}

/**
 * Re-fill and submit a form — called after human approves
 * Returns a confirmation screenshot
 */
export async function submitForm(
  url: string,
  fields: FormField[],
  submitSelector: string = 'button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Register"), button:has-text("Apply")'
): Promise<{ success: boolean; screenshotBase64: string; message: string }> {
  const { connectUrl } = await createBrowserbaseSession()
  const browser = await chromium.connectOverCDP(connectUrl)

  try {
    const context = browser.contexts()[0] ?? await browser.newContext()
    const page = context.pages()[0] ?? await context.newPage()

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1500)

    // Re-fill all fields
    for (const field of fields) {
      try {
        if (field.type === 'click') {
          await page.click(field.selector, { timeout: 5000 })
        } else if (field.type === 'select') {
          await page.selectOption(field.selector, field.value, { timeout: 5000 })
        } else if (field.type === 'checkbox') {
          const checked = field.value === 'true'
          const el = page.locator(field.selector).first()
          const isChecked = await el.isChecked()
          if (checked !== isChecked) await el.click()
        } else {
          const el = page.locator(field.selector).first()
          if (await el.count() > 0) {
            await el.fill(field.value, { timeout: 5000 })
          } else {
            await page.getByLabel(field.selector, { exact: false }).fill(field.value)
          }
        }
        await page.waitForTimeout(300)
      } catch { continue }
    }

    // Submit the form
    await page.waitForTimeout(500)
    const submitBtn = page.locator(submitSelector).first()
    if (await submitBtn.count() > 0) {
      await submitBtn.click()
      await page.waitForTimeout(3000)
    } else {
      return {
        success: false,
        screenshotBase64: (await page.screenshot()).toString('base64'),
        message: 'Submit button not found — form may need manual submission',
      }
    }

    // Wait for navigation or confirmation
    await page.waitForTimeout(2000)
    const screenshotBuffer = await page.screenshot({ fullPage: true })

    return {
      success: true,
      screenshotBase64: screenshotBuffer.toString('base64'),
      message: 'Form submitted. Screenshot shows confirmation page.',
    }
  } finally {
    await browser.close()
  }
}
