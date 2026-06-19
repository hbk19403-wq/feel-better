-- Seed support categories
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
  ('students_career', 'Students & Career Counseling')
ON CONFLICT (id) DO NOTHING;

-- Seed listeners (passwords are hashed: ListenerPass123!)
-- Using bcrypt hash for 'ListenerPass123!'
DO $$
DECLARE
  uid UUID;
  hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lred';
BEGIN
  -- River
  INSERT INTO users (id, email, password_hash, name, role)
  VALUES (uuid_generate_v4(), 'listener.river@feelbetter.internal', hash, 'River', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.river@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, is_trauma_informed)
  VALUES (uid, 'River', 'River', 'Compassionate listener with 5 years in relationship support. Creates a safe, non-judgmental space.', '["relationship_dating","marriage_commitment"]', '["English"]', 'online', true, 4.8, 142, false)
  ON CONFLICT (alias) DO NOTHING;

  -- Sage
  INSERT INTO users (id, email, password_hash, name, role)
  VALUES (uuid_generate_v4(), 'listener.sage@feelbetter.internal', hash, 'Sage', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.sage@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, is_trauma_informed)
  VALUES (uid, 'Sage', 'Sage', 'Career coach helping professionals navigate transitions and workplace challenges.', '["career_stress","students_career"]', '["English","Spanish"]', 'online', true, 4.6, 89, false)
  ON CONFLICT (alias) DO NOTHING;

  -- Willow
  INSERT INTO users (id, email, password_hash, name, role)
  VALUES (uuid_generate_v4(), 'listener.willow@feelbetter.internal', hash, 'Willow', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.willow@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, is_trauma_informed)
  VALUES (uid, 'Willow', 'Willow', 'Trauma-informed listener specializing in anxiety and emotional wellness. Here to hold space for your journey.', '["emotional_wellness","self_discovery"]', '["English"]', 'online', true, 4.9, 201, true)
  ON CONFLICT (alias) DO NOTHING;

  -- Cedar
  INSERT INTO users (id, email, password_hash, name, role)
  VALUES (uuid_generate_v4(), 'listener.cedar@feelbetter.internal', hash, 'Cedar', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.cedar@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, is_trauma_informed)
  VALUES (uid, 'Cedar', 'Cedar', 'Family dynamics specialist with a calm, grounded approach. Skilled at navigating complex family situations.', '["family_pressure","venting_general"]', '["English","French"]', 'online', true, 4.5, 67, false)
  ON CONFLICT (alias) DO NOTHING;

  -- Storm
  INSERT INTO users (id, email, password_hash, name, role)
  VALUES (uuid_generate_v4(), 'listener.storm@feelbetter.internal', hash, 'Storm', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.storm@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, is_trauma_informed)
  VALUES (uid, 'Storm', 'Storm', 'Certified in safety planning and trauma-informed care. Here to help you feel safe and supported.', '["abuse_safety","emotional_wellness"]', '["English"]', 'online', true, 4.7, 113, true)
  ON CONFLICT (alias) DO NOTHING;

  -- Nova
  INSERT INTO users (id, email, password_hash, name, role)
  VALUES (uuid_generate_v4(), 'listener.nova@feelbetter.internal', hash, 'Nova', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.nova@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, is_trauma_informed)
  VALUES (uid, 'Nova', 'Nova', 'Helping young adults navigate identity, peer pressure and life transitions with empathy.', '["societal_peer","students_career"]', '["English","Mandarin"]', 'online', true, 4.4, 55, false)
  ON CONFLICT (alias) DO NOTHING;
END $$;

-- Seed resources
INSERT INTO resources (title, type, category_id, content, duration_minutes) VALUES
  ('Understanding Anxiety: A Practical Guide', 'article', 'emotional_wellness', 'Anxiety is one of the most common emotional experiences. This guide covers recognizing anxiety triggers, grounding techniques, and when to seek further help.', 8),
  ('Breathing for Calm', 'audio', 'emotional_wellness', 'A guided breathing exercise to activate your parasympathetic nervous system and reduce stress in minutes.', 12),
  ('Relationship Boundaries Workbook', 'workbook', 'relationship_dating', 'A structured workbook to help you identify, communicate, and maintain healthy boundaries in romantic relationships.', 30),
  ('Career Clarity Journal', 'workbook', 'career_stress', 'Journaling prompts and exercises to help you rediscover your professional purpose and manage workplace stress.', 20),
  ('The Art of Letting Go', 'ebook', 'self_discovery', 'A compassionate exploration of how to release what no longer serves you—past hurts, limiting beliefs, and unhealthy relationships.', 90),
  ('Setting Boundaries with Family', 'article', 'family_pressure', 'Practical strategies for navigating difficult family dynamics while preserving your own mental health and wellbeing.', 6)
ON CONFLICT DO NOTHING;

-- Seed workshops
INSERT INTO workshops (title, description, host_name, facilitator, scheduled_at, duration_minutes, max_attendees, max_participants, category_id) VALUES
  ('Navigating Relationship Anxiety', 'Learn to identify and manage anxiety in romantic relationships. Interactive exercises and group discussion.', 'FeelBetter Team', 'River', NOW() + INTERVAL '3 days', 60, 50, 50, 'relationship_dating'),
  ('Career Burnout: Signs & Solutions', 'Recognize burnout early and discover practical recovery strategies. Q&A with experienced career listeners.', 'FeelBetter Team', 'Sage', NOW() + INTERVAL '7 days', 90, 30, 30, 'career_stress'),
  ('Building Self-Confidence', 'A workshop on cultivating genuine self-worth from the inside out. Exercises, reflection, and peer support.', 'FeelBetter Team', 'Willow', NOW() + INTERVAL '10 days', 60, 40, 40, 'self_discovery')
ON CONFLICT DO NOTHING;
