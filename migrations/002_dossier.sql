CREATE TABLE IF NOT EXISTS dossier_jobs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded',
  blob_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  progress TEXT,
  error TEXT,
  requested_by TEXT,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dossier_jobs_status ON dossier_jobs (status, created_at ASC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dossier_jobs_idempotency ON dossier_jobs (slug, sha256);

CREATE TABLE IF NOT EXISTS dossier_manifests (
  slug TEXT PRIMARY KEY,
  draft JSONB NOT NULL,
  published JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dossier_admin_audit (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  slug TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dossier_audit_slug ON dossier_admin_audit (slug, created_at DESC);
