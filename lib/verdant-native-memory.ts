/**
 * VERDANT Native Memory Tool — Supabase backend
 * Implements Anthropic's memory_20250818 tool interface
 * Claude reads/writes structured markdown files in /memories/
 * backed by the verdant_memory_files Supabase table.
 */

import { createClient } from '@/lib/supabase/server'

const MEMORY_ROOT = '/memories'

// ─── Path validation ──────────────────────────────────────────────────────────

function validatePath(path: string): boolean {
  if (!path) return false
  const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/')
  return normalized.startsWith(MEMORY_ROOT) && !normalized.includes('..')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`
}

function formatWithLineNumbers(content: string, viewRange?: [number, number]): string {
  const lines = content.split('\n')
  const start = viewRange ? Math.max(0, viewRange[0] - 1) : 0
  const end = viewRange ? Math.min(lines.length, viewRange[1]) : lines.length
  return lines
    .slice(start, end)
    .map((line, i) => `${String(start + i + 1).padStart(6, ' ')}\t${line}`)
    .join('\n')
}

// ─── Memory command executor ──────────────────────────────────────────────────

export async function executeMemoryCommand(input: any): Promise<string> {
  const path = input.path || input.old_path || MEMORY_ROOT
  if (!validatePath(path)) {
    return `Error: Invalid path "${path}". All memory paths must start with /memories and must not contain "..".`
  }

  const supabase = await createClient()

  switch (input.command) {
    case 'view': {
      const viewPath = input.path || MEMORY_ROOT
      const isDir = viewPath === MEMORY_ROOT || viewPath.endsWith('/')

      if (isDir) {
        const { data: files } = await supabase
          .from('verdant_memory_files')
          .select('path, content')
          .like('path', `${MEMORY_ROOT}/%`)
          .order('path')

        if (!files?.length) {
          return `Here're the files and directories up to 2 levels deep in ${viewPath}, excluding hidden items and node_modules:\n0B\t${MEMORY_ROOT}`
        }

        const total = files.reduce((s, f) => s + (f.content?.length ?? 0), 0)
        const lines = [
          `Here're the files and directories up to 2 levels deep in ${viewPath}, excluding hidden items and node_modules:`,
          `${formatFileSize(total)}\t${MEMORY_ROOT}`,
          ...files.map(f => `${formatFileSize(f.content?.length ?? 0)}\t${f.path}`),
        ]
        return lines.join('\n')
      }

      const { data: file } = await supabase
        .from('verdant_memory_files')
        .select('content')
        .eq('path', viewPath)
        .single()

      if (!file) return `The path ${viewPath} does not exist. Please provide a valid path.`

      const formatted = formatWithLineNumbers(file.content ?? '', input.view_range)
      return `Here's the content of ${viewPath} with line numbers:\n${formatted}`
    }

    case 'create': {
      if (!validatePath(input.path)) return `Error: Invalid path "${input.path}"`

      const { data: exists } = await supabase
        .from('verdant_memory_files')
        .select('path')
        .eq('path', input.path)
        .maybeSingle()

      if (exists) return `Error: File ${input.path} already exists`

      const { error } = await supabase.from('verdant_memory_files').insert({
        path: input.path,
        content: input.file_text ?? '',
        updated_at: new Date().toISOString(),
      })

      if (error) return `Error creating file: ${error.message}`
      return `File created successfully at: ${input.path}`
    }

    case 'str_replace': {
      const { data: file } = await supabase
        .from('verdant_memory_files')
        .select('content')
        .eq('path', input.path)
        .single()

      if (!file) return `Error: The path ${input.path} does not exist. Please provide a valid path.`

      const content = file.content ?? ''
      const occurrences = content.split(input.old_str).length - 1

      if (occurrences === 0) {
        return `No replacement was performed, old_str \`${input.old_str}\` did not appear verbatim in ${input.path}.`
      }
      if (occurrences > 1) {
        const matchLines = content.split('\n').reduce((acc: number[], line, i) => {
          if (line.includes(input.old_str)) acc.push(i + 1)
          return acc
        }, [])
        return `No replacement was performed. Multiple occurrences of old_str \`${input.old_str}\` in lines: ${matchLines.join(', ')}. Please ensure it is unique`
      }

      const newContent = content.replace(input.old_str, input.new_str ?? '')
      await supabase.from('verdant_memory_files').update({
        content: newContent,
        updated_at: new Date().toISOString(),
      }).eq('path', input.path)

      const snippet = formatWithLineNumbers(newContent.slice(0, 600))
      return `The memory file has been edited.\n${snippet}`
    }

    case 'insert': {
      const { data: file } = await supabase
        .from('verdant_memory_files')
        .select('content')
        .eq('path', input.path)
        .single()

      if (!file) return `Error: The path ${input.path} does not exist`

      const lines = (file.content ?? '').split('\n')
      const insertLine = input.insert_line ?? 0

      if (insertLine < 0 || insertLine > lines.length) {
        return `Error: Invalid \`insert_line\` parameter: ${insertLine}. It should be within the range of lines of the file: [0, ${lines.length}]`
      }

      const insertLines = (input.insert_text ?? '').split('\n')
      lines.splice(insertLine, 0, ...insertLines)
      const newContent = lines.join('\n')

      await supabase.from('verdant_memory_files').update({
        content: newContent,
        updated_at: new Date().toISOString(),
      }).eq('path', input.path)

      return `The file ${input.path} has been edited.`
    }

    case 'delete': {
      const { error } = await supabase
        .from('verdant_memory_files')
        .delete()
        .like('path', `${input.path}%`)

      if (error) return `Error: The path ${input.path} does not exist`
      return `Successfully deleted ${input.path}`
    }

    case 'rename': {
      if (!validatePath(input.old_path) || !validatePath(input.new_path)) {
        return `Error: Invalid path in rename operation`
      }

      const { data: src } = await supabase
        .from('verdant_memory_files')
        .select('content')
        .eq('path', input.old_path)
        .single()

      if (!src) return `Error: The path ${input.old_path} does not exist`

      const { data: dest } = await supabase
        .from('verdant_memory_files')
        .select('path')
        .eq('path', input.new_path)
        .maybeSingle()

      if (dest) return `Error: The destination ${input.new_path} already exists`

      await supabase.from('verdant_memory_files').insert({
        path: input.new_path,
        content: src.content,
        updated_at: new Date().toISOString(),
      })
      await supabase.from('verdant_memory_files').delete().eq('path', input.old_path)

      return `Successfully renamed ${input.old_path} to ${input.new_path}`
    }

    default:
      return `Error: Unknown memory command: ${input.command}`
  }
}

/**
 * Bootstrap the native memory files from the legacy verdant_memory key-value store.
 * Runs once — if /memories/intelligence.md already exists, does nothing.
 */
export async function bootstrapNativeMemory(): Promise<void> {
  try {
    const supabase = await createClient()

    // Check if already bootstrapped
    const { data: existing } = await supabase
      .from('verdant_memory_files')
      .select('path')
      .eq('path', '/memories/intelligence.md')
      .maybeSingle()

    if (existing) return // Already bootstrapped

    // Load legacy memories
    const { data: legacyMemories } = await supabase
      .from('verdant_memory')
      .select('category, key, value')
      .order('importance', { ascending: false })
      .limit(100)

    if (!legacyMemories?.length) return

    // Group by category and write to files
    const grouped: Record<string, string[]> = {}
    for (const m of legacyMemories) {
      if (!grouped[m.category]) grouped[m.category] = []
      grouped[m.category].push(`- **${m.key}**: ${m.value}`)
    }

    for (const [category, items] of Object.entries(grouped)) {
      const path = `/memories/${category}.md`
      const content = `# ${category.toUpperCase()}\n\n${items.join('\n')}\n`
      await supabase.from('verdant_memory_files').upsert({
        path,
        content,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'path' })
    }
  } catch {
    // Non-critical — fail silently
  }
}
