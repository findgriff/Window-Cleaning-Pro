-- RinseRun / Window Cleaning Pro — multi-tenant schema (SQLite).
-- Every business row carries tenant_id; all queries MUST filter on it.
-- Crews are deliberately absent (parked until Phase 3).

PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS tenants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,                 -- trading name, e.g. "Chester Window Cleaner"
  slug          TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,                 -- owner contact
  currency      TEXT NOT NULL DEFAULT 'GBP',
  sumup_api_key TEXT,                          -- per-tenant SumUp secret key (sk_live_*/sk_test_*)
  sumup_merchant_code TEXT,                    -- cached from GET /v0.1/me after key is saved
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'owner',    -- owner | member (crews parked)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- One-time login links (emailed). Short-lived, single-use.
CREATE TABLE IF NOT EXISTS magic_tokens (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  notes      TEXT,                              -- access, gate codes, pets, parking
  tags       TEXT NOT NULL DEFAULT '[]',        -- JSON array
  archived   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id, archived);

-- A round is a named geographic grouping the operator works through.
CREATE TABLE IF NOT EXISTS rounds (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name      TEXT NOT NULL,                      -- e.g. "Hoole", "CH4 Saltney"
  position  INTEGER NOT NULL DEFAULT 0,
  notes     TEXT
);
CREATE INDEX IF NOT EXISTS idx_rounds_tenant ON rounds(tenant_id);

CREATE TABLE IF NOT EXISTS properties (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  customer_id     INTEGER NOT NULL REFERENCES customers(id),
  round_id        INTEGER REFERENCES rounds(id),
  address         TEXT NOT NULL,
  postcode        TEXT,
  price_pence     INTEGER NOT NULL DEFAULT 0,   -- regular clean price
  frequency_weeks INTEGER NOT NULL DEFAULT 6,   -- 4..8 typical; 0 = ad-hoc only
  position        INTEGER NOT NULL DEFAULT 0,   -- order within round (route order)
  latitude        REAL,                         -- map pin (from postcode lookup)
  longitude       REAL,
  access_notes    TEXT,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_properties_round ON properties(round_id, position);

-- A job is one visit to one property. Generated from frequency or created ad hoc.
CREATE TABLE IF NOT EXISTS jobs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id),
  property_id    INTEGER NOT NULL REFERENCES properties(id),
  scheduled_date TEXT NOT NULL,                 -- YYYY-MM-DD
  status         TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled|done|skipped|missed
  price_pence    INTEGER NOT NULL,
  completed_at   INTEGER,
  notes          TEXT,
  created_at     INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_date ON jobs(tenant_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_property ON jobs(property_id, scheduled_date);

CREATE TABLE IF NOT EXISTS invoices (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id),
  customer_id      INTEGER NOT NULL REFERENCES customers(id),
  job_id           INTEGER REFERENCES jobs(id),
  number           TEXT NOT NULL,               -- e.g. INV-2026-0001 (per tenant)
  amount_pence     INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'unpaid',   -- unpaid|paid|void
  method           TEXT,                        -- cash|transfer|sumup_reader|sumup_online
  sumup_checkout_id  TEXT,                      -- set when an online checkout is created
  sumup_checkout_url TEXT,
  issued_at        INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  paid_at          INTEGER
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(tenant_id, number);

CREATE TABLE IF NOT EXISTS comms_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id),
  customer_id INTEGER REFERENCES customers(id),
  kind        TEXT NOT NULL,                    -- night_before|invoice_sent|reminder|note
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_comms_tenant ON comms_log(tenant_id, customer_id);
