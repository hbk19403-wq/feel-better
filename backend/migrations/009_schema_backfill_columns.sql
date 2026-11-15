-- 009_schema_backfill_columns.sql
-- Columns the app reads/writes that were added ad-hoc to the live DB and never
-- captured in a migration. Recovered 2026-11-15. Idempotent.

-- Human listener directory: display name + online flag, and a unique alias so
-- seeds can upsert on it.
ALTER TABLE listeners ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE listeners ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listeners_alias_key'
  ) THEN
    ALTER TABLE listeners ADD CONSTRAINT listeners_alias_key UNIQUE (alias);
  END IF;
END $$;

-- Resources: inline text body (distinct from content_url).
ALTER TABLE resources ADD COLUMN IF NOT EXISTS content text;

-- Workshops: facilitator alias + participant cap alias used by the app.
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS facilitator text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS max_participants integer;
