-- Reply drafts — VERDANT-drafted responses to inbound replies, pending human approval

create table if not exists reply_drafts (
  id              uuid default gen_random_uuid() primary key,
  organisation    text not null,
  contact_email   text not null,
  contact_name    text,
  their_reply     text,                    -- what they actually said
  draft_subject   text not null,
  draft_body      text not null,
  status          text default 'pending',  -- pending | approved | sent | dismissed
  created_at      timestamptz default now(),
  sent_at         timestamptz
);

alter table reply_drafts enable row level security;
create policy "Public access" on reply_drafts for all using (true);

create index if not exists idx_reply_drafts_pending
  on reply_drafts (created_at desc)
  where status = 'pending';
