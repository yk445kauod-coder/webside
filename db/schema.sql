-- WebSide schema for Cloudflare D1 (SQLite). Idempotent: safe to run on every deploy.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '{}',
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by TEXT
);
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled site',
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  template_key TEXT NOT NULL DEFAULT 'blank',
  plan TEXT NOT NULL DEFAULT 'menu',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS sites_owner_idx ON sites(owner_id);
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '/',
  blocks TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (site_id, key),
  UNIQUE (site_id, path)
);
CREATE INDEX IF NOT EXISTS pages_site_idx ON pages(site_id);
CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  pages TEXT NOT NULL DEFAULT '{}',
  content_hash TEXT NOT NULL,
  label TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (site_id, number)
);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  revision_id TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted',
  note TEXT,
  owner_notes TEXT,
  reviewed_by TEXT,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  reviewed_at TEXT,
  payment_proof_path TEXT,
  payment_method TEXT,
  payment_amount_egp INTEGER,
  payment_reference TEXT,
  UNIQUE (site_id, revision_id)
);
CREATE INDEX IF NOT EXISTS submissions_site_idx ON submissions(site_id);
CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions(status);
CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  note TEXT,
  recorded_by TEXT,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (site_id, url)
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO settings (key, value, description, is_public) VALUES
  ('sudo_admin_emails', '[]', 'Emails allowed to access the SUDO admin panel', 0),
  ('instapay_link', '""', 'InstaPay payment link/handle shown to customers', 1);
