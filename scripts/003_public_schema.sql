-- GreenStack Public Schema (no auth required)
-- Run this in Supabase SQL Editor

-- Drop old tables if they exist with wrong schema
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.bids CASCADE;
DROP TABLE IF EXISTS public.tenders CASCADE;
DROP TABLE IF EXISTS public.contractors CASCADE;
DROP TABLE IF EXISTS public.audits CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;

-- Tenders
CREATE TABLE public.tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client TEXT,
  sector TEXT,
  region TEXT,
  value BIGINT DEFAULT 0,
  deadline TEXT,
  status TEXT DEFAULT 'sourcing',
  ai_score INTEGER DEFAULT 0,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
  tender_title TEXT NOT NULL,
  value BIGINT DEFAULT 0,
  status TEXT DEFAULT 'draft',
  progress INTEGER DEFAULT 0,
  ai_score INTEGER DEFAULT 0,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors
CREATE TABLE public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  region TEXT,
  score INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  jobs INTEGER DEFAULT 0,
  on_time INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  accreditations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audits
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  date TIMESTAMPTZ DEFAULT NOW(),
  savings TEXT,
  co2_reduction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log (used by VERDANT)
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  action TEXT,
  description TEXT,
  entity_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow full public access (no auth)
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_tenders" ON public.tenders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_bids" ON public.bids FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_contractors" ON public.contractors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_audits" ON public.audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_activity" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_tenders_status ON public.tenders(status);
CREATE INDEX idx_tenders_created ON public.tenders(created_at DESC);
CREATE INDEX idx_bids_status ON public.bids(status);
CREATE INDEX idx_activity_type ON public.activity_log(type);
CREATE INDEX idx_activity_created ON public.activity_log(created_at DESC);
