/**
 * Download a calculation pack for review — ?token= (signed link from VERDANT),
 * &format=md (default) or csv.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/admin-token'
import { renderPackMarkdown, type CalcLine } from '@/lib/emissions-engine'

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!verifyToken('calc', id, request.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'Invalid or missing token' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: pack } = await supabase.from('calculation_packs').select('*').eq('id', id).maybeSingle()
  if (!pack) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const slug = `${pack.client}-${pack.reporting_period}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  if (request.nextUrl.searchParams.get('format') === 'csv') {
    const header = ['scope', 'description', 'quantity', 'unit', 'factor_id', 'factor_path', 'factor', 'factor_unit', 'kg_co2e', 'formula', 'factor_source', 'evidence']
    const rows = (pack.lines as CalcLine[]).map(l => header.map(h => csvCell((l as any)[h])).join(','))
    return new NextResponse([header.join(','), ...rows].join('\n'), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ghg-pack-${slug}.csv"` },
    })
  }
  return new NextResponse(renderPackMarkdown(pack), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': `inline; filename="ghg-pack-${slug}.md"` },
  })
}
