/**
 * Minimal Markdown → React for VERDANT's insights: ## / ### headings, paragraphs,
 * - and 1. lists, > quotes, | tables |, **bold**, *italic* and [links](url).
 * Builds React elements (no raw HTML), so anything odd in a post is escaped,
 * never executed. Styling comes from ArticleLayout's .article-body rules.
 */

import React from 'react'

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${i++}`
    if (m[1] !== undefined) out.push(<strong key={key}>{inline(m[1], key)}</strong>)
    else if (m[2] !== undefined) out.push(<em key={key}>{inline(m[2], key)}</em>)
    else {
      const href = m[4]
      const safe = /^(https?:\/\/|\/|#|mailto:)/i.test(href)
      out.push(safe
        ? <a key={key} href={href} {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{m[3]}</a>
        : m[3])
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

export function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const key = `b${blocks.length}`

    if (!line.trim()) { i++; continue }

    const heading = line.match(/^(#{2,4})\s+(.*)$/)
    if (heading) {
      const Tag = (heading[1].length === 2 ? 'h2' : 'h3') as 'h2' | 'h3'
      blocks.push(<Tag key={key}>{inline(heading[2], key)}</Tag>)
      i++
      continue
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))
        i++
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={key}>{items.map((it, n) => <li key={n}>{inline(it, `${key}-${n}`)}</li>)}</List>)
      continue
    }

    if (line.startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''))
      blocks.push(<blockquote key={key}>{inline(quote.join(' '), key)}</blockquote>)
      continue
    }

    if (line.trim().startsWith('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) {
      const head = cells(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]))
      blocks.push(
        <div key={key} style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr>{head.map((h, n) => <th key={n}>{inline(h, `${key}-h${n}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, rn) => <tr key={rn}>{r.map((c, n) => <td key={n}>{inline(c, `${key}-${rn}-${n}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
      continue
    }

    // Paragraph: consecutive plain lines
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|>|\s*[-*]\s+|\s*\d+\.\s+|\s*\|)/.test(lines[i])) para.push(lines[i++].trim())
    if (para.length === 0) { para.push(lines[i++].trim()) }
    blocks.push(<p key={key}>{inline(para.join(' '), key)}</p>)
  }

  return blocks
}
