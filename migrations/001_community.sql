-- Crime Mania — Comunidade (Neon / Postgres)
CREATE TABLE IF NOT EXISTS community_categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS community_rules_acceptance (
  user_id TEXT NOT NULL,
  rules_version INT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, rules_version)
);

CREATE TABLE IF NOT EXISTS community_topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES community_categories(id),
  author_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  reply_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_activity ON community_topics (is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_status ON community_topics (status);

CREATE TABLE IF NOT EXISTS community_replies (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replies_topic ON community_replies (topic_id, created_at ASC);

CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON community_notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_audit (
  id TEXT PRIMARY KEY,
  moderator_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_participation_restrictions (
  user_id TEXT PRIMARY KEY,
  restricted_until TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS episode_suggestions (
  id TEXT PRIMARY KEY,
  protocol TEXT NOT NULL UNIQUE,
  author_id TEXT NOT NULL,
  case_title TEXT NOT NULL,
  location TEXT,
  summary TEXT NOT NULL,
  relevance TEXT NOT NULL,
  source_links JSONB NOT NULL DEFAULT '[]',
  sensitive_content BOOLEAN NOT NULL DEFAULT FALSE,
  no_private_data_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'received',
  member_message TEXT,
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_author ON episode_suggestions (author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_rate_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_user_action ON community_rate_events (user_id, action, created_at DESC);
