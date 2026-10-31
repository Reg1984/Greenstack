/**
 * Every published insight, read from the repo at build time — so nothing VERDANT
 * publishes can go missing from the index or the division pages again.
 *
 * Two sources:
 *  - content/insights/<slug>.md — how VERDANT publishes now. Front matter
 *    (title, date, division, description, tags) plus a Markdown body, rendered by
 *    app/insights/[slug]. Content as data can't break the site build.
 *  - app/insights/<slug>/page.tsx — older hand-built pages. Title, description and
 *    date are read from their `article` or `metadata` export; they're all Climate
 *    unless they declare a division.
 *
 * Only call this from statically rendered pages: the source files exist at build
 * time, not in the deployed functions.
 */

import fs from 'fs'
import path from 'path'

export type InsightDivision = 'climate' | 'education' | 'impact'

export const INSIGHT_DIVISIONS: { id: InsightDivision; name: string }[] = [
  { id: 'climate', name: 'Climate' },
  { id: 'education', name: 'Education' },
  { id: 'impact', name: 'Impact' },
]

export interface Insight {
  slug: string
  title: string
  description: string
  date: string // YYYY-MM-DD
  division: InsightDivision
  tags: string[]
}

export interface MarkdownInsight extends Insight {
  body: string
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'insights')
const PAGES_DIR = path.join(process.cwd(), 'app', 'insights')

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

function isDivision(v: string): v is InsightDivision {
  return v === 'climate' || v === 'education' || v === 'impact'
}

/**
 * Parse a Markdown insight. Returns the insight, or a list of what's wrong —
 * VERDANT's publish tool uses the same check to refuse a malformed post.
 */
export function parseMarkdownInsight(slug: string, source: string): { insight: MarkdownInsight } | { errors: string[] } {
  const errors: string[] = []
  if (!SLUG.test(slug)) errors.push(`slug "${slug}" must be lowercase words joined by hyphens`)

  const m = source.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { errors: [...errors, 'file must start with front matter between --- lines'] }

  const fields: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z]+):\s*(.*)$/i)
    if (kv) fields[kv[1].toLowerCase()] = kv[2].trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  const body = m[2].trim()

  if (!fields.title) errors.push('front matter needs a title')
  if (!fields.description) errors.push('front matter needs a description')
  if (!DATE.test(fields.date ?? '')) errors.push('front matter needs date: YYYY-MM-DD')
  if (!isDivision(fields.division ?? '')) errors.push('front matter needs division: climate, education or impact')
  if (body.split(/\s+/).length < 300) errors.push('body is under 300 words')
  if (errors.length) return { errors }

  return {
    insight: {
      slug,
      title: fields.title,
      description: fields.description,
      date: fields.date,
      division: fields.division as InsightDivision,
      tags: (fields.tags ?? '').split(',').map(t => t.trim()).filter(Boolean),
      body,
    },
  }
}

function readMarkdownInsights(): MarkdownInsight[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .flatMap(f => {
      const parsed = parseMarkdownInsight(f.slice(0, -3), fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8'))
      if ('errors' in parsed) {
        console.warn(`[insights] skipping ${f}: ${parsed.errors.join('; ')}`)
        return []
      }
      return [parsed.insight]
    })
}

// A JS string literal: "…", '…' or `…` with escapes
const STR = String.raw`("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|` + '`' + String.raw`(?:[^` + '`' + String.raw`\\]|\\.)*` + '`)'

function field(source: string, name: string): string | null {
  const m = source.match(new RegExp(`\\b${name}\\s*:\\s*${STR}`))
  if (!m) return null
  return m[1].slice(1, -1).replace(/\\(.)/g, '$1').replace(/\s+/g, ' ').trim()
}

function readPageInsights(): Insight[] {
  if (!fs.existsSync(PAGES_DIR)) return []
  return fs.readdirSync(PAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && SLUG.test(d.name))
    .flatMap(d => {
      const file = path.join(PAGES_DIR, d.name, 'page.tsx')
      if (!fs.existsSync(file)) return []
      const src = fs.readFileSync(file, 'utf8')
      const title = field(src, 'title')?.replace(/\s*\|\s*GreenStack AI$/, '')
      const description = field(src, 'description')
      const date = field(src, 'date') ?? field(src, 'publishedTime') ?? field(src, 'publishedAt') ?? field(src, 'datePublished')
      if (!title || !description || !date || !DATE.test(date.slice(0, 10))) {
        console.warn(`[insights] skipping app/insights/${d.name}: couldn't read title, description and date`)
        return []
      }
      const division = field(src, 'division') ?? 'climate'
      const tags = src.match(/\btags\s*:\s*\[([^\]]*)\]/)?.[1].match(/["']([^"']+)["']/g)?.map(t => t.slice(1, -1)) ?? []
      return [{ slug: d.name, title, description, date: date.slice(0, 10), division: isDivision(division) ? division : 'climate', tags }]
    })
}

/** All insights, newest first. */
export function getInsights(division?: InsightDivision): Insight[] {
  try {
    const all = [...readMarkdownInsights(), ...readPageInsights()]
    const unique = [...new Map(all.map(i => [i.slug, i])).values()]
    return unique
      .filter(i => !division || i.division === division)
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch (err) {
    console.error('[insights] failed to read insights:', err)
    return []
  }
}

export function getMarkdownInsight(slug: string): MarkdownInsight | null {
  return readMarkdownInsights().find(i => i.slug === slug) ?? null
}

export function getMarkdownSlugs(): string[] {
  return readMarkdownInsights().map(i => i.slug)
}

export function divisionName(id: InsightDivision): string {
  return INSIGHT_DIVISIONS.find(d => d.id === id)?.name ?? 'Climate'
}
