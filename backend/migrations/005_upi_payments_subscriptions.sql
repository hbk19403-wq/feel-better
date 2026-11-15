-- 005_upi_payments_subscriptions.sql
-- India subscription tiers + UPI payment orders. Idempotent: safe to re-run.

-- Subscription state on users.
alter table public.users
  add column if not exists subscription_status text not null default 'active',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists plan_started_at timestamptz;

-- UPI payment orders (subscription checkout + future wallet top-ups).
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null default 'subscription',            -- subscription | wallet_topup
  plan text,                                             -- basic | standard | premium
  amount_inr integer not null check (amount_inr >= 0),
  currency text not null default 'INR',
  payee_vpa text not null,                               -- merchant UPI ID collecting the payment
  txn_ref text not null unique,                          -- our order reference (also UPI note)
  upi_txn_id text,                                       -- UTR / reference the payer submits
  status text not null default 'created',                -- created | submitted | verified | failed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments(user_id, created_at desc);
create index if not exists payments_status_idx on public.payments(status);

alter table public.payments enable row level security;
-- Service role (backend) bypasses RLS; no anon policies needed.
