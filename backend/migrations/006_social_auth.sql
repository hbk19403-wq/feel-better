-- 006_social_auth.sql
-- Foundation for Google / Facebook / Phone-OTP sign-in alongside email/password.
-- Idempotent: safe to re-run.

alter table public.users
  add column if not exists auth_provider text not null default 'password', -- password | google | facebook | phone
  add column if not exists phone text,
  add column if not exists email_verified boolean not null default false;

-- OAuth / phone users have no password.
alter table public.users alter column password_hash drop not null;

-- Email may be absent for phone-only signups; keep it unique when present.
create unique index if not exists users_phone_key on public.users(phone) where phone is not null;

-- Short-lived OTP codes for phone login (hashed, never stored in plaintext).
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  purpose text not null default 'login',
  attempts int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists otp_phone_idx on public.otp_codes(phone, created_at desc);
alter table public.otp_codes enable row level security; -- backend-only (service role)
