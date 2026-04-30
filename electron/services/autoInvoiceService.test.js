import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { maybeCreateForCompletedEntry, nextInvoiceNumber } from './autoInvoiceService.js'
import { createMemoryDb } from '../test/memoryDb.js'

describe('nextInvoiceNumber', () => {
  it('pads the next sequence number based on COUNT of invoices sharing the prefix', async () => {
    const db = await createMemoryDb()
    db.prepare(`
      INSERT INTO invoices (invoice_number, invoice_date, currency, items, status)
      VALUES ('Acme-inv-00001', '2026-01-01', 'EUR', '[]', 'draft')
    `).run()
    db.prepare(`
      INSERT INTO invoices (invoice_number, invoice_date, currency, items, status)
      VALUES ('Acme-inv-00005', '2026-02-01', 'EUR', '[]', 'draft')
    `).run()

    expect(nextInvoiceNumber(db, 'Acme')).toBe('Acme-inv-00003')
    db.close()
  })
})

describe('maybeCreateForCompletedEntry', () => {
  let db

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-25T12:00:00'))
    db = await createMemoryDb()
  })

  afterEach(() => {
    db?.close()
    vi.useRealTimers()
  })

  it('inserts exactly one draft invoice when auto_gen + budget cap triggers; second call is a no-op', () => {
    const ins = db.prepare(`
      INSERT INTO projects (
        name, hourly_rate, tracking_mode, billable, budget_amount,
        invoice_auto_gen, budget_currency, currency, invoice_from_name, invoice_lang, created_at
      ) VALUES (
        'AutoCoZ', 50, 'budget', 1, 950, 1, 'EUR', 'EUR', 'Dev', 'en', '2026-04-01 10:00:00'
      )
    `).run()
    const pid = ins.lastInsertRowid

    db.prepare(`
      INSERT INTO time_entries (project_id, started_at, stopped_at, billable)
      VALUES (?, '2026-04-23 08:00:00', '2026-04-24 04:00:00', 1)
    `).run(pid)

    const first = maybeCreateForCompletedEntry(db, { project_id: pid })
    expect(first).not.toBeNull()
    expect(first.invoice_number).toMatch(/^AutoCoZ-inv-/)
    expect(first.status).toBe('draft')
    expect(Array.isArray(first.items)).toBe(true)
    expect(first.items.length).toBe(1)

    const second = maybeCreateForCompletedEntry(db, { project_id: pid })
    expect(second).toBeNull()

    const { n } = db.prepare(
      `SELECT COUNT(*) as n FROM invoices WHERE invoice_number LIKE ?`
    ).get('AutoCoZ-inv-%')
    expect(n).toBe(1)
  })

  it('returns null when invoice_auto_gen is off even if over budget', () => {
    const ins = db.prepare(`
      INSERT INTO projects (
        name, hourly_rate, tracking_mode, billable, budget_amount,
        invoice_auto_gen, budget_currency, currency, created_at
      ) VALUES (
        'NoAuto', 50, 'budget', 1, 100, 0, 'EUR', 'EUR', '2026-04-01 10:00:00'
      )
    `).run()
    const pid = ins.lastInsertRowid

    db.prepare(`
      INSERT INTO time_entries (project_id, started_at, stopped_at, billable)
      VALUES (?, '2026-04-10 08:00:00', '2026-04-10 10:00:00', 1)
    `).run(pid)

    expect(maybeCreateForCompletedEntry(db, { project_id: pid })).toBeNull()
  })
})
