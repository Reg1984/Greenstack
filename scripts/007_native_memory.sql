-- Native memory files for VERDANT (Anthropic memory_20250818 tool)
-- Each row is a markdown file Claude reads/writes directly

create table if not exists verdant_memory_files (
  path       text primary key,
  content    text not null default '',
  updated_at timestamptz default now()
);
