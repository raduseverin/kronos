import initSqlJs from 'sql.js'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * WASM SQLite (sql.js) — same SQL semantics as better-sqlite3 but runs under
 * plain Node during Vitest (no native-module ABI mismatch with Electron).
 */
let sqlPromise = null

function loadSqlJs() {
  if (!sqlPromise) {
    const wasmPath = join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
    sqlPromise = initSqlJs({ wasmBinary: readFileSync(wasmPath) })
  }
  return sqlPromise
}

const SCHEMA = `
  CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#9333ea',
    hourly_rate REAL,
    billable INTEGER NOT NULL DEFAULT 1,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT '2026-01-01 10:00:00',
    updated_at TEXT NOT NULL DEFAULT '2026-01-01 10:00:00',
    tracking_mode TEXT NOT NULL DEFAULT 'monthly',
    budget_amount REAL,
    last_reset_at TEXT,
    currency TEXT NOT NULL DEFAULT 'EUR',
    budget_currency TEXT,
    display_currency TEXT,
    invoice_template TEXT NOT NULL DEFAULT 'standard',
    invoice_lang TEXT NOT NULL DEFAULT 'en',
    invoice_from_name TEXT,
    invoice_billed_to TEXT,
    invoice_fixed_amount REAL,
    invoice_auto_gen INTEGER NOT NULL DEFAULT 0,
    invoice_bank_account_id INTEGER
  );

  CREATE TABLE time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    description TEXT,
    started_at TEXT NOT NULL,
    stopped_at TEXT,
    billable INTEGER NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT '2026-01-01 10:00:00',
    updated_at TEXT NOT NULL DEFAULT '2026-01-01 10:00:00'
  );

  CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    due_date TEXT,
    purchase_order TEXT,
    payment_terms TEXT,
    billed_to TEXT,
    bank_account_id INTEGER,
    currency TEXT NOT NULL DEFAULT 'EUR',
    items TEXT NOT NULL DEFAULT '[]',
    tax_label TEXT,
    tax_rate REAL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT '2026-01-01 10:00:00',
    updated_at TEXT NOT NULL DEFAULT '2026-01-01 10:00:00',
    template TEXT NOT NULL DEFAULT 'standard',
    lang TEXT NOT NULL DEFAULT 'en',
    from_name TEXT,
    period_start TEXT,
    period_end TEXT
  );
`

class Stmt {
  /** @param {import('sql.js').Database} db */
  constructor(db, sql) {
    this._db = db
    this._sql = sql
  }

  get(...params) {
    const stmt = this._db.prepare(this._sql)
    if (params.length) stmt.bind(params)
    if (!stmt.step()) {
      stmt.free()
      return undefined
    }
    const raw = stmt.getAsObject()
    stmt.free()
    const row = {}
    for (const [k, v] of Object.entries(raw)) {
      row[String(k).toLowerCase()] = v
    }
    return row
  }

  run(...params) {
    const stmt = this._db.prepare(this._sql)
    if (params.length) stmt.bind(params)
    stmt.step()
    stmt.free()
    const r = this._db.exec('SELECT last_insert_rowid() AS id')
    const id = Number(r[0].values[0][0])
    return { lastInsertRowid: id }
  }

  all(...params) {
    const stmt = this._db.prepare(this._sql)
    if (params.length) stmt.bind(params)
    const out = []
    while (stmt.step()) {
      const raw = stmt.getAsObject()
      const row = {}
      for (const [k, v] of Object.entries(raw)) {
        row[String(k).toLowerCase()] = v
      }
      out.push(row)
    }
    stmt.free()
    return out
  }
}

class DbShim {
  /** @param {import('sql.js').Database} raw */
  constructor(raw) {
    this._raw = raw
  }

  prepare(sql) {
    return new Stmt(this._raw, sql)
  }

  pragma() { /* sql.js: PRAGMA set via .run in createMemoryDb */ }

  exec(sql) {
    this._raw.exec(sql)
  }

  close() {
    this._raw.close()
  }
}

/**
 * Opens an empty in-memory DB with the Kronos tables needed for service tests.
 */
export async function createMemoryDb() {
  const SQL = await loadSqlJs()
  const raw = new SQL.Database()
  raw.run('PRAGMA foreign_keys = ON')
  raw.exec(SCHEMA)
  return new DbShim(raw)
}
