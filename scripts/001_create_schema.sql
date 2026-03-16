-- GreenStack Database Schema
-- Tables for tenders, bids, contractors, audits, reports, and user profiles

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'user',
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenders table
CREATE TABLE IF NOT EXISTS public.tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client TEXT,
  sector TEXT,
  region TEXT,
  value BIGINT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'found',
  ai_score INTEGER DEFAULT 0,
  description TEXT,
  requirements TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  carbon_intensity DOUBLE PRECISION DEFAULT 0.5,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
  tender_title TEXT NOT NULL,
  value BIGINT,
  status TEXT DEFAULT 'drafting',
  progress INTEGER DEFAULT 0,
  ai_score INTEGER DEFAULT 0,
  content JSONB DEFAULT '{}',
  last_edit TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors table
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  region TEXT,
  score INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  jobs INTEGER DEFAULT 0,
  on_time INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  accreditations TEXT[] DEFAULT '{}',
  insurance TEXT DEFAULT 'Valid',
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audits table
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  date TIMESTAMPTZ DEFAULT NOW(),
  savings TEXT,
  co2_reduction TEXT,
  report_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  period TEXT,
  win_rate TEXT,
  total_value TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for tenders
CREATE POLICY "tenders_select_own" ON public.tenders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tenders_insert_own" ON public.tenders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tenders_update_own" ON public.tenders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tenders_delete_own" ON public.tenders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bids
CREATE POLICY "bids_select_own" ON public.bids FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bids_insert_own" ON public.bids FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bids_update_own" ON public.bids FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bids_delete_own" ON public.bids FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contractors
CREATE POLICY "contractors_select_own" ON public.contractors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contractors_insert_own" ON public.contractors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contractors_update_own" ON public.contractors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "contractors_delete_own" ON public.contractors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audits
CREATE POLICY "audits_select_own" ON public.audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audits_insert_own" ON public.audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "audits_update_own" ON public.audits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "audits_delete_own" ON public.audits FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reports
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_update_own" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reports_delete_own" ON public.reports FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for activity_log
CREATE POLICY "activity_select_own" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_insert_own" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenders_user_id ON public.tenders(user_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_sector ON public.tenders(sector);
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON public.bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_log(created_at DESC);
