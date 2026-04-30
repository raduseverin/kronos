import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db = null

const MIGRATIONS = [
  {
    id: 1,
    name: 'clients',
    sql: `
      CREATE TABLE IF NOT EXISTS clients (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        email      TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `,
  },
  {
    id: 2,
    name: 'projects',
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id   INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        name        TEXT NOT NULL,
        color       TEXT NOT NULL DEFAULT '#9333ea',
        hourly_rate REAL,
        billable    INTEGER NOT NULL DEFAULT 1,
        archived    INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `,
  },
  {
    id: 3,
    name: 'tags',
    sql: `
      CREATE TABLE IF NOT EXISTS tags (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `,
  },
  {
    id: 4,
    name: 'time_entries',
    sql: `
      CREATE TABLE IF NOT EXISTS time_entries (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        description TEXT,
        started_at  TEXT NOT NULL,
        stopped_at  TEXT,
        billable    INTEGER NOT NULL DEFAULT 1,
        source      TEXT NOT NULL DEFAULT 'manual',
        created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `,
  },
  {
    id: 5,
    name: 'time_entry_tags',
    sql: `
      CREATE TABLE IF NOT EXISTS time_entry_tags (
        time_entry_id INTEGER NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
        tag_id        INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (time_entry_id, tag_id)
      );
    `,
  },
  {
    id: 6,
    name: 'window_rules',
    sql: `
      CREATE TABLE IF NOT EXISTS window_rules (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword    TEXT NOT NULL,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        priority   INTEGER DEFAULT 0
      );
    `,
  },
  {
    id: 7,
    name: 'bank_accounts',
    sql: `
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        name         TEXT NOT NULL,
        iban         TEXT,
        bic          TEXT,
        bank_name    TEXT,
        bank_address TEXT,
        currency     TEXT NOT NULL DEFAULT 'USD',
        is_default   INTEGER NOT NULL DEFAULT 0,
        created_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `,
  },
  {
    id: 8,
    name: 'invoices',
    sql: `
      CREATE TABLE IF NOT EXISTS invoices (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number  TEXT NOT NULL,
        invoice_date    TEXT NOT NULL,
        due_date        TEXT,
        purchase_order  TEXT,
        payment_terms   TEXT,
        billed_to       TEXT,
        bank_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
        currency        TEXT NOT NULL DEFAULT 'USD',
        items           TEXT NOT NULL DEFAULT '[]',
        tax_label       TEXT,
        tax_rate        REAL,
        notes           TEXT,
        status          TEXT NOT NULL DEFAULT 'draft',
        created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `,
  },
  {
    id: 9,
    name: 'project_tracking',
    sql: `
      ALTER TABLE projects ADD COLUMN tracking_mode TEXT NOT NULL DEFAULT 'monthly';
      ALTER TABLE projects ADD COLUMN budget_amount REAL;
    `,
  },
  {
    id: 10,
    name: 'project_reset',
    sql: `ALTER TABLE projects ADD COLUMN last_reset_at TEXT;`,
  },
  {
    id: 11,
    name: 'exchange_rates',
    sql: `
      CREATE TABLE IF NOT EXISTS exchange_rates (
        base       TEXT NOT NULL,
        rates      TEXT NOT NULL,
        fetched_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `,
  },
  {
    id: 12,
    name: 'project_currency',
    sql: `ALTER TABLE projects ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR';`,
  },
  {
    id: 13,
    name: 'project_invoice_settings',
    sql: `
      ALTER TABLE projects ADD COLUMN invoice_template TEXT NOT NULL DEFAULT 'standard';
      ALTER TABLE projects ADD COLUMN invoice_lang TEXT NOT NULL DEFAULT 'en';
      ALTER TABLE projects ADD COLUMN invoice_from_name TEXT;
      ALTER TABLE projects ADD COLUMN invoice_billed_to TEXT;
      ALTER TABLE projects ADD COLUMN invoice_fixed_amount REAL;
      ALTER TABLE projects ADD COLUMN invoice_auto_gen INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    id: 14,
    name: 'invoice_template_fields',
    sql: `
      ALTER TABLE invoices ADD COLUMN template TEXT NOT NULL DEFAULT 'standard';
      ALTER TABLE invoices ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';
      ALTER TABLE invoices ADD COLUMN from_name TEXT;
      ALTER TABLE invoices ADD COLUMN period_start TEXT;
      ALTER TABLE invoices ADD COLUMN period_end TEXT;
    `,
  },
  {
    id: 15,
    name: 'project_invoice_bank_account',
    sql: `ALTER TABLE projects ADD COLUMN invoice_bank_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL;`,
  },
  {
    id: 16,
    name: 'project_budget_vs_display_currency',
    // Split the single `currency` field into:
    //   - budget_currency:  the anchor; everything stored on the project (budget_amount,
    //     hourly_rate, invoice_fixed_amount) is denominated in this and never silently converted.
    //   - display_currency: view-only; switching it converts amounts on the fly via FX rates,
    //     it does NOT mutate any stored value.
    // The legacy `currency` column is kept and mirrored to budget_currency for back-compat.
    sql: `
      ALTER TABLE projects ADD COLUMN budget_currency  TEXT;
      ALTER TABLE projects ADD COLUMN display_currency TEXT;
      UPDATE projects
         SET budget_currency  = COALESCE(budget_currency,  currency, 'EUR'),
             display_currency = COALESCE(display_currency, currency, 'EUR');
    `,
  },
  {
    id: 17,
    name: 'invoice_fx_snapshot',
    // When an invoice is issued in a currency different from the project's budget_currency,
    // we lock the FX rate AT CREATION TIME so the historical record stays audit-correct
    // regardless of how rates move afterwards.
    //   - source_currency: typically the project's budget_currency at the time of issue
    //   - source_amount:   the invoice total expressed in source_currency
    //   - fx_rate:         1 source_currency  ==  fx_rate  *  invoice currency
    //   - fx_fetched_at:   when that rate was captured
    sql: `
      ALTER TABLE invoices ADD COLUMN source_currency TEXT;
      ALTER TABLE invoices ADD COLUMN source_amount   REAL;
      ALTER TABLE invoices ADD COLUMN fx_rate         REAL;
      ALTER TABLE invoices ADD COLUMN fx_fetched_at   TEXT;
    `,
  },
  {
    id: 18,
    name: 'project_daily_target',
    sql: `ALTER TABLE projects ADD COLUMN daily_target_hours REAL;`,
  },
  {
    id: 19,
    name: 'templates',
    sql: `
      CREATE TABLE IF NOT EXISTS templates (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        description TEXT,
        billable    INTEGER NOT NULL DEFAULT 1,
        created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
    `,
  },
]

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'kronos.db')
  db = new Database(dbPath)

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `)

  // Run pending migrations
  const applied = new Set(
    db.prepare('SELECT id FROM _migrations').all().map((r) => r.id)
  )

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue

    db.exec(migration.sql)
    db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)').run(
      migration.id,
      migration.name
    )
  }

  return db
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}
