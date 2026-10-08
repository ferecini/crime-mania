-- Crime Mania — Assinaturas Asaas (Neon / Postgres)

CREATE TABLE IF NOT EXISTS billing_customers (
  user_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'asaas',
  customer_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_customers_provider_customer
  ON billing_customers (provider, customer_id);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES billing_customers(user_id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_subscription_id TEXT,
  provider_customer_id TEXT NOT NULL,
  payment_id TEXT,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  past_due_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user
  ON billing_subscriptions (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscriptions_provider_sub
  ON billing_subscriptions (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'asaas',
  event_type TEXT NOT NULL,
  subscription_id TEXT REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
  payment_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_subscription
  ON billing_events (subscription_id, processed_at DESC);
