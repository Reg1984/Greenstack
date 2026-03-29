import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST — create an invoice (optionally with AI assistance)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // If natural language request, use AI to structure it
    if (body.description) {
      return createInvoiceFromDescription(body.description)
    }

    return saveInvoice(body)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET — list invoices + financial summary
export async function GET() {
  try {
    const supabase = await createClient()
    const [{ data: invoices }, { data: summary }] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('financial_summary').select('*').single(),
    ])
    return NextResponse.json({ invoices: invoices ?? [], summary: summary ?? {} })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PUT — update invoice status (mark paid, send, etc.)
export async function PUT(request: Request) {
  try {
    const { id, status, paid_date } = await request.json()
    const supabase = await createClient()

    const updates: any = { status }
    if (status === 'paid' && !paid_date) updates.paid_date = new Date().toISOString().split('T')[0]
    if (paid_date) updates.paid_date = paid_date

    // If sending, email the invoice
    if (status === 'sent') {
      const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
      if (invoice?.client_email) {
        await emailInvoice(invoice)
        updates.sent_at = new Date().toISOString()
      }
    }

    const { data } = await supabase.from('invoices').update(updates).eq('id', id).select().single()
    return NextResponse.json({ invoice: data })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function createInvoiceFromDescription(description: string) {
  const supabase = await createClient()

  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 30)

  // Get next invoice number
  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
  const invoiceNumber = `GS-${String((count ?? 0) + 1).padStart(4, '0')}`

  const prompt = `You are creating an invoice for GreenStack AI based on this description:

"${description}"

GreenStack AI's services:
- Sustainability Intelligence Reports: typically £15,000–£45,000
- Net Zero Roadmap: £20,000–£60,000
- ESOS Compliance Assessment: £8,000–£20,000
- ESG Reporting Package: £10,000–£35,000
- Carbon Footprint Assessment: £5,000–£15,000
- Pilot/Demonstration Report: £2,500–£5,000
- Monthly retainer: £3,000–£8,000/month

Invoice number: ${invoiceNumber}
Today: ${today.toISOString().split('T')[0]}
Due: ${dueDate.toISOString().split('T')[0]}

Return ONLY a JSON object:
{
  "invoice_number": "${invoiceNumber}",
  "client_name": "extracted client name or 'To Be Confirmed'",
  "client_email": "extracted email or null",
  "client_address": "extracted address or null",
  "line_items": [
    { "description": "service description", "quantity": 1, "unit_price": 25000, "total": 25000 }
  ],
  "subtotal": 25000,
  "vat_rate": 20,
  "vat_amount": 5000,
  "total": 30000,
  "issued_date": "${today.toISOString().split('T')[0]}",
  "due_date": "${dueDate.toISOString().split('T')[0]}",
  "notes": "any relevant notes"
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse invoice' }, { status: 500 })

  const invoiceData = JSON.parse(jsonMatch[0])
  return saveInvoice(invoiceData)
}

async function saveInvoice(data: any) {
  const supabase = await createClient()

  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 30)

  // Get next invoice number if not provided
  if (!data.invoice_number) {
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
    data.invoice_number = `GS-${String((count ?? 0) + 1).padStart(4, '0')}`
  }

  if (!data.due_date) data.due_date = dueDate.toISOString().split('T')[0]
  if (!data.issued_date) data.issued_date = today.toISOString().split('T')[0]

  const { data: saved, error } = await supabase.from('invoices').insert(data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoice: saved })
}

async function emailInvoice(invoice: any) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !invoice.client_email) return

  const lineItemsHtml = invoice.line_items?.map((item: any) =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.description}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">£${item.unit_price?.toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">£${item.total?.toLocaleString()}</td>
    </tr>`
  ).join('') ?? ''

  const html = `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;color:#222">
      <div style="background:#051210;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#00ff87;margin:0;font-size:24px">GreenStack AI</h1>
        <p style="color:#4ade80;margin:4px 0 0">INVOICE ${invoice.invoice_number}</p>
      </div>
      <div style="padding:24px;border:1px solid #eee;border-top:none">
        <div style="display:flex;justify-content:space-between;margin-bottom:24px">
          <div>
            <strong>Bill To:</strong><br>
            ${invoice.client_name}<br>
            ${invoice.client_address ?? ''}
          </div>
          <div style="text-align:right">
            <strong>Issue Date:</strong> ${invoice.issued_date}<br>
            <strong>Due Date:</strong> ${invoice.due_date}<br>
            <strong>Status:</strong> <span style="color:#f59e0b">OUTSTANDING</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8f8f8">
              <th style="padding:8px;text-align:left">Description</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Unit Price</th>
              <th style="padding:8px;text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${lineItemsHtml}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right">
          <div>Subtotal: £${invoice.subtotal?.toLocaleString()}</div>
          <div>VAT (${invoice.vat_rate}%): £${invoice.vat_amount?.toLocaleString()}</div>
          <div style="font-size:20px;font-weight:bold;margin-top:8px">Total Due: £${invoice.total?.toLocaleString()}</div>
        </div>
        ${invoice.notes ? `<div style="margin-top:24px;padding:12px;background:#f8f8f8;border-radius:4px"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
        <div style="margin-top:24px;padding:16px;background:#051210;border-radius:4px;color:#4ade80;font-size:12px">
          GreenStack AI | verdant@greenstackai.co.uk | greenstackai.co.uk
        </div>
      </div>
    </div>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'GreenStack AI <verdant@greenstackai.co.uk>',
      to: invoice.client_email,
      subject: `Invoice ${invoice.invoice_number} from GreenStack AI — £${invoice.total?.toLocaleString()}`,
      html,
    }),
  })
}
