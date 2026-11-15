-- 008_ai_chat_advice_unlock.sql
-- Monetized advice: after the free discovery window, advice is gated until the
-- user pays (₹1/min). This flag records that a session has been unlocked.
alter table public.ai_sessions
  add column if not exists advice_unlocked boolean not null default false,
  add column if not exists advice_unlocked_at timestamptz;
