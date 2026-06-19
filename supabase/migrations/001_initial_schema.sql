-- 1800-FeelBetter initial schema for Supabase PostgreSQL
-- Run this in the Supabase SQL editor or via supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  age_segment TEXT,
  profession TEXT,
  language_preference TEXT DEFAULT 'en',
  anonymous_mode BOOLEAN DEFAULT false,
  subscription_plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  consent_analytics BOOLEAN DEFAULT false,
  consent_marketing BOOLEAN DEFAULT false,
  is_minor BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support categories
CREATE TABLE IF NOT EXISTS support_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Listeners
CREATE TABLE IF NOT EXISTS listeners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  alias TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  specializations JSONB DEFAULT '[]',
  languages JSONB DEFAULT '["en"]',
  status TEXT DEFAULT 'offline',
  is_online BOOLEAN DEFAULT false,
  active_session_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_trauma_informed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listener_id UUID REFERENCES listeners(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES support_categories(id),
  session_type TEXT DEFAULT 'voice',
  status TEXT DEFAULT 'pending',
  user_alias TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  mood_before INTEGER,
  mood_after INTEGER,
  rating INTEGER,
  rating_comment TEXT,
  crisis_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wellness check-ins
CREATE TABLE IF NOT EXISTS wellness_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category_id TEXT REFERENCES support_categories(id),
  content_url TEXT,
  content TEXT,
  duration_minutes INTEGER,
  is_affiliate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  host_name TEXT,
  facilitator TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_attendees INTEGER,
  max_participants INTEGER,
  registered_count INTEGER DEFAULT 0,
  category_id TEXT REFERENCES support_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop registrations
CREATE TABLE IF NOT EXISTS workshop_registrations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, workshop_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_listener_id ON sessions(listener_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_user_id ON wellness_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_listeners_status ON listeners(status);
CREATE INDEX IF NOT EXISTS idx_listeners_is_online ON listeners(is_online);
