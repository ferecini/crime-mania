CREATE TABLE IF NOT EXISTS dossier_document_versions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  version INT NOT NULL,
  snapshot JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_dossier_document_versions_slug ON dossier_document_versions (slug, published_at DESC);
