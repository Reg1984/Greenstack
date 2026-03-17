-- Auto-Bid Settings Table
-- Stores user preferences for automatic bidding system

CREATE TABLE IF NOT EXISTS public.auto_bid_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Enable/disable auto-bidding
  enabled BOOLEAN DEFAULT FALSE,
  
  -- Bidding thresholds and criteria
  min_match_score INTEGER DEFAULT 70,
  max_bid_value BIGINT DEFAULT 500000,
  min_bid_value BIGINT DEFAULT 10000,
  
  -- Company capabilities (sectors/specialties they can bid on)
  capabilities TEXT[] DEFAULT '{}',
  
  -- Preferred sectors
  preferred_sectors TEXT[] DEFAULT '{}',
  
  -- Regions to bid in
  preferred_regions TEXT[] DEFAULT '{}',
  
  -- Auto-submit settings
  auto_submit BOOLEAN DEFAULT FALSE,
  require_approval_before_submit BOOLEAN DEFAULT TRUE,
  
  -- Notification preferences
  notify_on_tender_found BOOLEAN DEFAULT TRUE,
  notify_on_bid_created BOOLEAN DEFAULT TRUE,
  notify_on_bid_submitted BOOLEAN DEFAULT TRUE,
  
  -- URL import settings
  extract_from_urls BOOLEAN DEFAULT TRUE,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.auto_bid_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auto_bid_settings
CREATE POLICY "auto_bid_settings_select_own" ON public.auto_bid_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "auto_bid_settings_insert_own" ON public.auto_bid_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auto_bid_settings_update_own" ON public.auto_bid_settings FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auto_bid_settings_user_id ON public.auto_bid_settings(user_id);
