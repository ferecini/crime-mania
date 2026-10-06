CREATE TABLE IF NOT EXISTS dossier_documents (
  slug TEXT PRIMARY KEY,
  draft JSONB NOT NULL,
  published JSONB,
  published_format TEXT NOT NULL DEFAULT 'legacy',
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dossier_document_assets (
  id TEXT NOT NULL,
  slug TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INT,
  alt_text TEXT,
  caption TEXT,
  credit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (slug, id)
);

CREATE INDEX IF NOT EXISTS idx_dossier_document_assets_slug ON dossier_document_assets (slug);
