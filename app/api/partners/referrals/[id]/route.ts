/**
 * Reg approves or rejects a VERDANT-proposed partner referral from the signed
 * link in his email. Nothing reaches the partner until this runs with approve.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/admin-token'
import { decideReferral } from '@/lib/partner-network'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const decision = request.nextUrl.searchParams.get('decision')
  if (!verifyToken('referral', id, request.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'Invalid or missing token' }, { status: 403 })
  }
  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json({ error: 'decision must be approve or reject' }, { status: 400 })
  }
  const message = await decideReferral(id, decision)
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width"><title>Referral</title>
     <body style="font-family:sans-serif;background:#000;color:#e4e4e7;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px">
     <div style="max-width:480px;text-align:center"><p style="color:rgba(134,239,172,.8);letter-spacing:.2em;font-size:.75rem;text-transform:uppercase">GreenStack Partner Network</p>
     <h1 style="font-size:1.4rem">${message.replace(/</g, '&lt;')}</h1></div></body>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
