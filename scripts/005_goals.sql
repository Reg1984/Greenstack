-- VERDANT Goals — goal-oriented behaviour table
-- Run in Supabase SQL editor

create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,

  -- What metric this goal tracks
  target_type text not null check (target_type in (
    'revenue',        -- total paid invoices (all time)
    'mrr',            -- paid invoices in last 30 days
    'pipeline_value', -- total value of active tenders
    'bids_submitted', -- count of submitted bids
    'contracts_won',  -- count of won bids
    'outreach_sent'   -- count of outreach emails sent
  )),

  target_value numeric not null,
  current_value numeric default 0,
  target_date date not null,

  status text default 'active' check (status in ('active', 'achieved', 'paused', 'missed')),

  -- VERDANT's living strategy to hit this goal
  strategy text,

  -- Actions VERDANT has logged toward this goal
  verdant_actions jsonb default '[]'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_goals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists goals_updated_at on goals;
create trigger goals_updated_at
  before update on goals
  for each row execute function update_goals_updated_at();

-- RLS — open for now (dashboard is password-gated)
alter table goals enable row level security;
create policy "goals_open" on goals for all using (true) with check (true);
