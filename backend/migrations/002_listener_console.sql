-- Listener Assist Console: transcript + after-call documentation.
-- Idempotent. Apply via the Supabase Dashboard SQL editor (project ttwrtwxrmdyzvukhhrku).

-- Per-message transcript for human (caller <-> live listener) sessions.
CREATE TABLE IF NOT EXISTS session_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  -- 'caller' = the user seeking support, 'listener' = the human listener
  sender      text NOT NULL CHECK (sender IN ('caller', 'listener', 'system')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session
  ON session_messages (session_id, created_at);

-- After-call documentation + risk tracking on the session itself.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS listener_notes text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS risk_level text;          -- low | medium | high
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS escalated boolean DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_group text;

-- Server uses the service-role key (bypasses RLS), so no policies are strictly
-- required, but enable RLS to be safe and add a permissive service policy.
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS session_messages_service ON session_messages;
CREATE POLICY session_messages_service ON session_messages
  FOR ALL USING (true) WITH CHECK (true);
