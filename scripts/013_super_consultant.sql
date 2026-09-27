-- VERDANT super-consultant layer: Academy (knowledge from primary sources),
-- Regulatory Radar, traceable emissions engine, and the partner consultant network.
-- Run this in Supabase SQL Editor. Same "Public access" RLS pattern as 006/011 —
-- the app connects server-side with the anon key.

-- ─── VERDANT ACADEMY ─────────────────────────────────────────────────────────
-- One row per curriculum module (seeded from lib/verdant-academy.ts on first run).
CREATE TABLE IF NOT EXISTS public.verdant_knowledge (
  slug             TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  mirrors_course   TEXT,              -- the professional course whose syllabus this mirrors
  status           TEXT NOT NULL DEFAULT 'not_started'
                   CHECK (status IN ('not_started', 'studied', 'mastered', 'needs_restudy')),
  notes            TEXT,              -- VERDANT's study notes, markdown, every rule cited
  sources_read     JSONB DEFAULT '[]'::jsonb,   -- [{url, title, retrieved_at}]
  weak_areas       TEXT,              -- topics missed in the last self-test
  last_score       INTEGER,           -- % on most recent closed-book self-test
  best_score       INTEGER,
  attempts         INTEGER NOT NULL DEFAULT 0,
  last_studied_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.verdant_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.verdant_knowledge FOR ALL USING (true);

-- ─── REGULATORY RADAR ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.regulatory_watch (
  url              TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  jurisdiction     TEXT NOT NULL,
  topics           TEXT[] DEFAULT '{}',
  last_fingerprint TEXT,              -- gov.uk public_updated_at, or sha256 of normalised text
  last_content     TEXT,              -- normalised text snapshot used for diffing
  last_checked_at  TIMESTAMPTZ,
  last_changed_at  TIMESTAMPTZ
);
ALTER TABLE public.regulatory_watch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.regulatory_watch FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.regulatory_changes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url       TEXT NOT NULL,
  source_name      TEXT NOT NULL,
  materiality      TEXT NOT NULL CHECK (materiality IN ('high', 'medium', 'low', 'noise')),
  headline         TEXT NOT NULL,
  summary          TEXT NOT NULL,
  who_is_affected  TEXT,
  sectors          TEXT[] DEFAULT '{}',
  deadline         TEXT,
  actions          TEXT,
  evidence_quote   TEXT,              -- verbatim text from the source that shows the change
  affected_clients JSONB DEFAULT '[]'::jsonb,  -- [{organisation, contact_email, reason}]
  detected_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.regulatory_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.regulatory_changes FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_regulatory_changes_detected ON public.regulatory_changes(detected_at DESC);

-- ─── TRACEABLE EMISSIONS ENGINE ──────────────────────────────────────────────
-- Loaded ONLY from the official DESNZ flat file via scripts/import-desnz-factors.mjs.
-- VERDANT never writes factors itself — no factor, no number.
CREATE TABLE IF NOT EXISTS public.emission_factors (
  id               TEXT PRIMARY KEY,  -- "<factor_set>:<DESNZ row ID>"
  factor_set       TEXT NOT NULL,     -- e.g. "DESNZ 2025"
  scope            TEXT,
  level_1          TEXT,
  level_2          TEXT,
  level_3          TEXT,
  level_4          TEXT,
  column_text      TEXT,
  unit             TEXT NOT NULL,     -- UOM, e.g. "kWh", "litres", "tonnes"
  ghg_unit         TEXT NOT NULL,     -- e.g. "kg CO2e"
  factor           DOUBLE PRECISION NOT NULL,
  source_url       TEXT NOT NULL,
  imported_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.emission_factors FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_emission_factors_set ON public.emission_factors(factor_set);

CREATE TABLE IF NOT EXISTS public.calculation_packs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client           TEXT NOT NULL,
  reporting_period TEXT NOT NULL,
  factor_set       TEXT NOT NULL,
  lines            JSONB NOT NULL,    -- every line: input, factor row, formula, result
  totals           JSONB NOT NULL,
  unresolved       JSONB DEFAULT '[]'::jsonb,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'signed_off')),
  signed_off_by    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.calculation_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.calculation_packs FOR ALL USING (true);

-- ─── PARTNER CONSULTANT NETWORK ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_consultants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  firm             TEXT,
  specialisms      TEXT[] DEFAULT '{}',
  regions          TEXT[] DEFAULT '{}',
  credentials      TEXT,              -- self-declared, checked by Reg before 'vetted'
  day_rate_gbp     INTEGER,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'vetted', 'paused', 'rejected')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partner_consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.partner_consultants FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.partner_referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID REFERENCES public.partner_consultants(id) ON DELETE CASCADE,
  opportunity      TEXT NOT NULL,
  client_org       TEXT,
  estimated_value  INTEGER,
  why_this_partner TEXT,
  status           TEXT NOT NULL DEFAULT 'proposed'
                   CHECK (status IN ('proposed', 'approved', 'rejected', 'accepted', 'declined', 'won', 'lost')),
  referral_fee_pct INTEGER DEFAULT 15,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  decided_at       TIMESTAMPTZ
);
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.partner_referrals FOR ALL USING (true);

-- Lets the radar match regulatory changes to clients by Companies House SIC code.
-- Conditional so the migration is safe on a database where 006_verdant_crm.sql hasn't run.
DO $$
BEGIN
  IF to_regclass('public.outreach_contacts') IS NOT NULL THEN
    ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS sic_codes TEXT[];
  END IF;
END $$;
