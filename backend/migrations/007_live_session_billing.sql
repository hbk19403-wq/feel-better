-- 007_live_session_billing.sql
-- Track the ₹1/min charge accrued on a live human-listener chat session.
alter table public.sessions
  add column if not exists amount_charged numeric not null default 0;
