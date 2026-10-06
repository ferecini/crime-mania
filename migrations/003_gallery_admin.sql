CREATE TABLE IF NOT EXISTS dossier_gallery_manifests (
  dossier_slug TEXT PRIMARY KEY,
  draft JSONB NOT NULL DEFAULT '{"items":[],"version":1}'::jsonb,
  published JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dossier_catalog (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ASSASSINATO',
  access_tier TEXT NOT NULL DEFAULT 'tier1',
  intro TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_media_catalog (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL CHECK (section IN ('episodes', 'juris', 'archive')),
  slug TEXT,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INT,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'video')),
  provider TEXT NOT NULL DEFAULT 'blob',
  storage_key TEXT,
  stream_path TEXT,
  access_tier TEXT NOT NULL DEFAULT 'tier2',
  dossier_slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_media_section ON member_media_catalog (section, status);

CREATE TABLE IF NOT EXISTS admin_rate_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_rate ON admin_rate_events (actor_id, action, created_at DESC);
