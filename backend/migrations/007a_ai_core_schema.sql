-- 007a_ai_core_schema.sql
-- AI listeners/sessions/messages, external therapist profiles, and billing usage.
-- These tables previously existed ONLY in the live database (created ad-hoc) and
-- were never captured in a migration file — recovered 2026-11-15 after the live
-- DB was lost. Runs before 008 (which alters ai_sessions). Idempotent.

-- AI listener personas (voice + chat).
CREATE TABLE IF NOT EXISTS ai_listeners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male')),
  voice_id TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🤖',
  personality_prompt TEXT NOT NULL,
  specializations JSONB DEFAULT '[]',
  languages JSONB DEFAULT '["en"]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat/voice sessions.
CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ai_listener_id UUID REFERENCES ai_listeners(id),
  mode TEXT NOT NULL DEFAULT 'vent' CHECK (mode IN ('vent', 'advisory')),
  topic_id TEXT REFERENCES support_categories(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  charged_minutes INTEGER DEFAULT 0,
  total_charged NUMERIC(10,2) DEFAULT 0,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-message transcript for AI chat sessions.
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External (human) therapist / professional directory.
CREATE TABLE IF NOT EXISTS therapist_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credentials TEXT,
  profession TEXT DEFAULT 'therapist',
  specializations JSONB DEFAULT '[]',
  bio TEXT,
  location TEXT,
  source_platform TEXT,
  source_url TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  invitation_sent_at TIMESTAMPTZ,
  invitation_status TEXT DEFAULT 'pending',
  is_listed BOOLEAN DEFAULT false,
  rate_per_minute NUMERIC(10,2) DEFAULT 0.25,
  avatar_emoji TEXT DEFAULT '👩‍⚕️',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing usage records (AI + live sessions).
CREATE TABLE IF NOT EXISTS billing_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  session_kind TEXT DEFAULT 'ai',
  minutes_used INTEGER DEFAULT 0,
  amount_charged NUMERIC(10,2) DEFAULT 0,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extra session/user columns the app reads.
ALTER TABLE ai_sessions ADD COLUMN IF NOT EXISTS age_group text;
ALTER TABLE ai_sessions ADD COLUMN IF NOT EXISTS crisis_flagged boolean NOT NULL DEFAULT false;
ALTER TABLE ai_sessions ADD COLUMN IF NOT EXISTS suggested_track text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_band text;

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id ON ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_profession ON therapist_profiles(profession);
