-- Outreach emails table
CREATE TABLE IF NOT EXISTS outreach_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_name TEXT,
  organisation TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, bounced, replied
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  tender_title TEXT,
  resend_id TEXT,
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON outreach_emails FOR ALL USING (true);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON invoices FOR ALL USING (true);

-- Financial summary view
CREATE OR REPLACE VIEW financial_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'paid') AS invoices_paid,
  COUNT(*) FILTER (WHERE status = 'sent') AS invoices_outstanding,
  COUNT(*) FILTER (WHERE status = 'overdue') AS invoices_overdue,
  COUNT(*) FILTER (WHERE status = 'draft') AS invoices_draft,
  COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) AS total_revenue,
  COALESCE(SUM(total) FILTER (WHERE status IN ('sent', 'overdue')), 0) AS outstanding_value,
  COALESCE(SUM(total) FILTER (WHERE status = 'overdue'), 0) AS overdue_value
FROM invoices;
