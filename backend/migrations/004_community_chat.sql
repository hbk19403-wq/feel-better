-- 004_community_chat.sql
-- Live, anonymous group chat rooms — one running message stream per community
-- category (reuses community_groups). An alternative to talking to a listener:
-- people who'd rather not, can just talk to each other, anonymously.
-- Idempotent: safe to re-run.

create table if not exists public.community_chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid,                       -- nullable: anonymous posting allowed
  author_alias text not null default 'Anonymous',
  body text not null check (char_length(body) between 1 and 2000),
  is_crisis boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_group_time_idx
  on public.community_chat_messages(group_id, created_at);

alter table public.community_chat_messages enable row level security;

-- Backend uses the service role (bypasses RLS). Permissive read policy so the
-- room stream is visible; writes still flow through the backend.
drop policy if exists chat_read_all on public.community_chat_messages;
create policy chat_read_all on public.community_chat_messages
  for select using (true);
