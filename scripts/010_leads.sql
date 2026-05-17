-- Public leads table — homepage email capture, CBAM enquiries, pilot requests
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT DEFAULT 'homepage',   -- homepage | cbam | insights
  message TEXT,                     -- optional context from form
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous inserts (public form — no login required)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_insert_anon"
  ON public.leads FOR INSERT TO anon WITH CHECK (true);

-- Owner read-only (service role bypasses RLS anyway)
CREATE POLICY "leads_select_service"
  ON public.leads FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
