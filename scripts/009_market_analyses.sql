-- Monthly market analyses — permanent strategic memory
create table if not exists market_analyses (
  id uuid primary key default gen_random_uuid(),
  period text not null,           -- e.g. "2026-04"
  analysis text not null,         -- full 8-section advisor output
  key_findings jsonb default '{}', -- extracted: top_move, win_probability, competitors[], sectors[]
  created_at timestamptz default now()
);

create index if not exists market_analyses_period_idx on market_analyses(period desc);
create index if not exists market_analyses_created_idx on market_analyses(created_at desc);

-- Full-text search on verdant_memory so recall_memory is fast
create index if not exists verdant_memory_fts on verdant_memory
  using gin(to_tsvector('english', key || ' ' || value));
