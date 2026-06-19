CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('user', 'listener', 'corporate_admin', 'platform_admin');
CREATE TYPE subscription_plan AS ENUM ('free', 'pay_per_session', 'basic', 'standard', 'premium', 'corporate');
CREATE TYPE session_status AS ENUM ('pending', 'matching', 'matched', 'active', 'completed', 'cancelled');
CREATE TYPE session_type AS ENUM ('voice', 'text', 'scheduled');
CREATE TYPE listener_status AS ENUM ('online', 'away', 'break', 'offline');
CREATE TYPE age_segment AS ENUM ('16_25', '26_35', '36_50', '51_plus');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  age_segment age_segment,
  profession TEXT,
  language_preference TEXT DEFAULT 'en',
  anonymous_mode BOOLEAN DEFAULT FALSE,
  subscription_plan subscription_plan DEFAULT 'free',
  stripe_customer_id TEXT,
  consent_analytics BOOLEAN DEFAULT FALSE,
  consent_marketing BOOLEAN DEFAULT FALSE,
  is_minor BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

INSERT INTO support_categories (id, name) VALUES
  ('relationship_dating', 'Relationship & Dating'),
  ('marriage_commitment', 'Marriage & Commitment'),
  ('infidelity_trust', 'Infidelity & Trust'),
  ('career_stress', 'Career Stress & Workplace Issues'),
  ('family_pressure', 'Family Pressure & Conflict'),
  ('societal_peer', 'Societal & Peer Pressure'),
  ('emotional_wellness', 'Emotional Wellness & Anxiety'),
  ('abuse_safety', 'Abuse & Safety Support'),
  ('self_discovery', 'Self-Discovery & Confidence'),
  ('venting_general', 'Venting & General Support'),
  ('students_career', 'Students & Career Counseling');

CREATE TABLE listeners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  alias TEXT NOT NULL,
  bio TEXT,
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  status listener_status DEFAULT 'offline',
  active_session_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_trauma_informed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  sessions_used INTEGER DEFAULT 0,
  sessions_limit INTEGER,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listener_id UUID REFERENCES listeners(id),
  category_id TEXT REFERENCES support_categories(id),
  session_type session_type DEFAULT 'voice',
  status session_status DEFAULT 'pending',
  user_alias TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  rating_comment TEXT,
  crisis_flagged BOOLEAN DEFAULT FALSE,
  twilio_room_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  listener_id UUID NOT NULL REFERENCES listeners(id),
  content TEXT NOT NULL,
  is_shared_with_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wellness_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('article', 'audio', 'workbook', 'ebook')),
  category_id TEXT REFERENCES support_categories(id),
  content_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  is_affiliate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  host_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_attendees INTEGER,
  registered_count INTEGER DEFAULT 0,
  meeting_url TEXT,
  category_id TEXT REFERENCES support_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workshop_registrations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, workshop_id)
);

CREATE TABLE wellness_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listener_id UUID REFERENCES listeners(id),
  session_id UUID REFERENCES sessions(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  resource_links TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_listener ON sessions(listener_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_wellness_checkins_user ON wellness_checkins(user_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
