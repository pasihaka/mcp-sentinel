-- Cloudflare D1 Relational Schema for MCP Sentinel

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free', -- 'free' | 'pro' | 'team'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);

CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  check_interval_seconds INTEGER DEFAULT 60,
  status TEXT DEFAULT 'operational',
  last_checked_at INTEGER,
  current_schema_hash TEXT,
  last_latency_ms INTEGER,
  auth_header TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monitors_active ON monitors(is_active, last_checked_at);
CREATE INDEX IF NOT EXISTS idx_monitors_user ON monitors(user_id);

CREATE TABLE IF NOT EXISTS check_logs (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL,
  http_status INTEGER,
  latency_ms INTEGER,
  tools_count INTEGER,
  schema_hash TEXT,
  error_message TEXT,
  diff_summary TEXT, -- JSON array of diff items
  secret_findings TEXT, -- JSON array of secret leaks
  FOREIGN KEY(monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_check_logs_monitor ON check_logs(monitor_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS schema_snapshots (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  raw_tools_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schema_snapshots_monitor ON schema_snapshots(monitor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS alert_destinations (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'slack' | 'discord' | 'webhook'
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_destinations_monitor ON alert_destinations(monitor_id);
