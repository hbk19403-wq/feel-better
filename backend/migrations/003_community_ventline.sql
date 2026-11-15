-- 003_community_ventline.sql
-- Community groups, anonymous blog posts + comments, and The Vent Line.
-- Backend uses the Supabase service-role key, which bypasses RLS; policies below
-- exist for defense-in-depth and so the schema is safe if ever queried with anon.

-- ---------------------------------------------------------------------------
-- Community groups (e.g. "Trust Issues", "Marriage Issues")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_groups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  description  text,
  emoji        text DEFAULT '💬',
  post_count   integer NOT NULL DEFAULT 0,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Posts — anonymous by default. user_id is kept only so an author can manage
-- their own post; author_alias is what is shown publicly.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id       uuid,
  author_alias  text NOT NULL DEFAULT 'Anonymous',
  title         text,
  body          text NOT NULL,
  is_anonymous  boolean NOT NULL DEFAULT true,
  support_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_posts_group ON community_posts(group_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Comments / suggestions on a post
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id       uuid,
  author_alias  text NOT NULL DEFAULT 'Anonymous',
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- The Vent Line — users drop an anonymous vent, get a warm AI reply, and can
-- choose to share it to a public wall.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vent_line_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  alias         text NOT NULL DEFAULT 'Anonymous',
  body          text NOT NULL,
  ai_reply      text,
  mood          text,
  is_public     boolean NOT NULL DEFAULT false,
  support_count integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vent_public ON vent_line_entries(is_public, created_at DESC);

-- ---------------------------------------------------------------------------
-- Seed starter community groups (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO community_groups (slug, name, description, emoji, sort_order) VALUES
  ('trust-issues',     'Trust Issues',        'For when it''s hard to let people in. Share, vent, and feel less alone.', '🤝', 1),
  ('marriage-issues',  'Marriage & Partners', 'Navigating the hard parts of marriage and long-term relationships.',     '💍', 2),
  ('anxiety',          'Anxiety & Overwhelm', 'Racing thoughts, worry, panic — a space to breathe together.',           '🌊', 3),
  ('loneliness',       'Loneliness',          'You don''t have to feel alone in feeling alone.',                        '🫂', 4),
  ('grief-loss',       'Grief & Loss',        'Holding space for what — and who — we''ve lost.',                        '🕯️', 5),
  ('family',           'Family Stuff',        'Parents, siblings, kids, in-laws — the people we can''t choose.',        '🏡', 6),
  ('work-burnout',     'Work & Burnout',      'When the job takes more than it gives.',                                 '💼', 7),
  ('self-worth',       'Self-Worth',          'Quieting the inner critic, one honest post at a time.',                  '🌱', 8)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS (service role bypasses; anon/auth get read-only on public content)
-- ---------------------------------------------------------------------------
ALTER TABLE community_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vent_line_entries  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_groups' AND policyname='groups_read') THEN
    CREATE POLICY groups_read ON community_groups FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_posts' AND policyname='posts_read') THEN
    CREATE POLICY posts_read ON community_posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_comments' AND policyname='comments_read') THEN
    CREATE POLICY comments_read ON community_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vent_line_entries' AND policyname='vent_read_public') THEN
    CREATE POLICY vent_read_public ON vent_line_entries FOR SELECT USING (is_public = true);
  END IF;
END $$;
