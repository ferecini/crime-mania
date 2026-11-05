-- Crime Mania — Spotify Open Access (auditoria operacional; NÃO é fonte de verdade)
-- A verdade sobre entitlements é a assinatura em billing_subscriptions.

CREATE TABLE IF NOT EXISTS spotify_soa_links (
  user_id TEXT PRIMARY KEY,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_entitlements JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_sync_at TIMESTAMPTZ
);
