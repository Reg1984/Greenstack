-- VERDANT CRM & Intelligence Tables
-- Run this in Supabase SQL Editor

-- Outreach contacts CRM — one record per person/org, tracks full journey
CREATE TABLE IF NOT EXISTS outreach_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_title TEXT,
  sector TEXT,
  country TEXT DEFAULT 'UK',
  signal TEXT, -- Why we're targeting: CBAM, CSRD, ESOS, education, GIZ, etc.
  status TEXT NOT NULL DEFAULT 'identified',
  -- Status values: identified | emailed | followed_up | replied | meeting_booked | won | dead | unsubscribed
  followup_count INTEGER NOT NULL DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  followup_due_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  notes TEXT,
  source TEXT, -- cycle, chat, manual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_email, organisation)
);

ALTER TABLE outreach_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON outreach_contacts FOR ALL USING (true);

-- Buyer intent signals — Exa-detected buying signals
CREATE TABLE IF NOT EXISTS buyer_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  -- Types: sustainability_job | esos_deadline | csrd_obligation | cbam_exposure | expansion_news | funding_round
  signal_text TEXT NOT NULL,
  source_url TEXT,
  country TEXT DEFAULT 'UK',
  priority TEXT DEFAULT 'medium', -- high | medium | low
  acted_on BOOLEAN DEFAULT FALSE,
  contact_id UUID REFERENCES outreach_contacts(id) ON DELETE SET NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE buyer_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON buyer_signals FOR ALL USING (true);

-- Content drafts — LinkedIn posts, blog articles, capability statements drafted by VERDANT
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- linkedin_post | blog_article | capability_statement | case_study
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_audience TEXT,
  status TEXT DEFAULT 'draft', -- draft | approved | published
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON content_drafts FOR ALL USING (true);

-- Win/loss columns on bids table (if not already added)
ALTER TABLE bids ADD COLUMN IF NOT EXISTS outcome TEXT;
-- Values: won | lost | withdrawn | pending | no_response
ALTER TABLE bids ADD COLUMN IF NOT EXISTS loss_reason TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS win_factor TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_followup
  ON outreach_contacts (followup_due_at, status, followup_count)
  WHERE status IN ('emailed', 'followed_up');

CREATE INDEX IF NOT EXISTS idx_buyer_signals_unacted
  ON buyer_signals (detected_at, acted_on)
  WHERE acted_on = FALSE;
