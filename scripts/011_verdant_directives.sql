-- Standing directives for VERDANT (freeform commands worked every autonomous cycle
-- until closed). Table was referenced by lib/verdant-directives.ts and wired into
-- the manage_directive tool since commit 4a59266, but the migration was never run —
-- confirmed live in production 2026-09-22 when manage_directive failed with
-- "Could not find the table 'public.verdant_directives' in the schema cache".

CREATE TABLE IF NOT EXISTS public.verdant_directives (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction    TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'blocked', 'cancelled')),
  cycles_worked  INTEGER NOT NULL DEFAULT 0,
  last_action    TEXT,
  blocked_reason TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- App connects with the anon key server-side (no service role) — same "Public access"
-- pattern as the other VERDANT-internal tables in 006_verdant_crm.sql.
ALTER TABLE public.verdant_directives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.verdant_directives FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_verdant_directives_status ON public.verdant_directives(status);
