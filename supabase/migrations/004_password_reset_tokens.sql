-- Password reset tokens for the custom-auth flow.
-- Only the backend (service_role, which bypasses RLS) touches this table, so RLS
-- is enabled with no policies — same locked-down posture as the other tables.

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON public.password_reset_tokens (user_id);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
