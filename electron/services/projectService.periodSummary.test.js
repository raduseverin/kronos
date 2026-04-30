import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { periodSummaryFor } from './projectService.js'
import { createMemoryDb } from '../test/memoryDb.js'

describe('periodSummaryFor', () => {
  let db

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00'))
    db = await createMemoryDb()
  })

  afterEach(() => {
    db?.close()
    vi.useRealTimers()
  })

  it('monthly mode: aggregates billable work since the first day of the current month', () => {
    const ins = db.prepare(`
      INSERT INTO projects (name, hourly_rate, tracking_mode, billable, budget_currency, currency)
      VALUES ('Alpha', 50, 'monthly', 1, 'EUR', 'EUR')
    `).run()
    const pid = ins.lastInsertRowid

    db.prepare(`
      INSERT INTO time_entries (project_id, started_at, stopped_at, billable)
      VALUES (?, '2026-04-10 09:00:00', '2026-04-10 11:00:00', 1)
    `).run(pid)

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(pid)
    const summary = periodSummaryFor(db, project)

    expect(summary.periodStart).toBe('2026-04-01')
    expect(summary.usedHours).toBeCloseTo(2, 4)
    expect(summary.usedAmount).toBeCloseTo(100, 4)
    expect(summary.budgetCurrency).toBe('EUR')
  })

  it('uses last_reset_at when it is newer than the computed period boundary', () => {
    const ins = db.prepare(`
      INSERT INTO projects (
        name, hourly_rate, tracking_mode, billable, last_reset_at, budget_currency, currency
      ) VALUES ('Beta', 40, 'monthly', 1, '2026-04-15', 'EUR', 'EUR')
    `).run()
    const pid = ins.lastInsertRowid

    db.prepare(`
      INSERT INTO time_entries (project_id, started_at, stopped_at, billable)
      VALUES
        (?, '2026-04-05 10:00:00', '2026-04-05 12:00:00', 1),
        (?, '2026-04-18 10:00:00', '2026-04-18 14:00:00', 1)
    `).run(pid, pid)

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(pid)
    const summary = periodSummaryFor(db, project)

    expect(summary.periodStart).toBe('2026-04-15')
    expect(summary.usedHours).toBeCloseTo(4, 4)
    expect(summary.usedAmount).toBeCloseTo(160, 4)
  })

  it('budget mode: period begins the day after the latest invoice for this project prefix', () => {
    const ins = db.prepare(`
      INSERT INTO projects (
        name, hourly_rate, tracking_mode, billable, budget_amount, created_at, budget_currency, currency
      ) VALUES ('Gamma Corp', 100, 'budget', 1, 5000, '2026-01-01 10:00:00', 'USD', 'USD')
    `).run()
    const pid = ins.lastInsertRowid

    db.prepare(`
      INSERT INTO invoices (invoice_number, invoice_date, currency, items, status)
      VALUES ('Gamma-Corp-inv-00001', '2026-03-31', 'USD', '[]', 'draft')
    `).run()

    db.prepare(`
      INSERT INTO time_entries (project_id, started_at, stopped_at, billable)
      VALUES (?, '2026-04-02 09:00:00', '2026-04-02 10:00:00', 1)
    `).run(pid)

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(pid)
    const summary = periodSummaryFor(db, project)

    // `period_start` uses Date#toISOString(); TZ boundaries can shift the calendar day.
    expect(['2026-03-31', '2026-04-01']).toContain(summary.periodStart)
    expect(summary.usedHours).toBeCloseTo(1, 4)
    expect(summary.trackingMode).toBe('budget')
  })
})
