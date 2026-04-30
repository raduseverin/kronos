import { getDb } from '../db/database.js'

/**
 * Project-domain logic, decoupled from the IPC layer so that:
 *   - other services (auto-invoice, reports) can call it without crossing IPC,
 *   - it can be unit-tested with a stub `db` once Vitest lands.
 *
 * Every function takes `db` explicitly when it queries — no hidden global access
 * inside a transaction.
 */

// ── Naming ────────────────────────────────────────────────────────────────

/**
 * Canonical invoice-number prefix derived from a project name.
 * Must match the format used historically so existing invoices keep
 * matching their projects.
 */
export function invoicePrefixFor(name) {
  return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') + '-inv-'
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * A project's budget currency is "locked" once it has any historical
 * attachments (time entries, even running ones, or any invoice generated for
 * it). Changing the anchor currency at that point would silently re-denominate
 * historical work, so we refuse the update.
 */
export function isProjectBudgetLocked(db, id, name) {
  const e = db.prepare('SELECT 1 FROM time_entries WHERE project_id = ? LIMIT 1').get(id)
  if (e) return true
  if (name) {
    const inv = db
      .prepare('SELECT 1 FROM invoices WHERE invoice_number LIKE ? LIMIT 1')
      .get(invoicePrefixFor(name) + '%')
    if (inv) return true
  }
  return false
}

export function createProject(db, input) {
  const {
    name,
    clientId             = null,
    color                = '#9333ea',
    hourlyRate           = null,
    billable             = true,
    trackingMode         = 'monthly',
    budgetAmount         = null,
    budgetCurrency,
    displayCurrency,
    currency             = 'EUR',
    invoiceTemplate      = 'standard',
    invoiceLang          = 'en',
    invoiceFromName      = null,
    invoiceBilledTo      = null,
    invoiceFixedAmount   = null,
    invoiceAutoGen       = false,
    invoiceBankAccountId = null,
    dailyTargetHours     = null,
  } = input

  // Back-compat: fall back to legacy `currency` if the new fields aren't supplied.
  const bCur = budgetCurrency  || currency || 'EUR'
  const dCur = displayCurrency || bCur

  const result = db.prepare(`
    INSERT INTO projects (
      name, client_id, color, hourly_rate, billable, tracking_mode, budget_amount,
      currency, budget_currency, display_currency,
      invoice_template, invoice_lang, invoice_from_name, invoice_billed_to,
      invoice_fixed_amount, invoice_auto_gen, invoice_bank_account_id,
      daily_target_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, clientId, color, hourlyRate, billable ? 1 : 0, trackingMode, budgetAmount,
    bCur, bCur, dCur,
    invoiceTemplate, invoiceLang, invoiceFromName, invoiceBilledTo,
    invoiceFixedAmount, invoiceAutoGen ? 1 : 0, invoiceBankAccountId,
    dailyTargetHours || null,
  )
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
}

/**
 * Build dynamic UPDATE for a project. Returns the refreshed row, or `null` if
 * no fields were provided.
 *
 * Throws if the caller tries to change `budgetCurrency` on a locked project.
 */
export function updateProject(db, id, input) {
  const fields = []
  const values = []

  // Lock guard: the budget currency anchors all historical numbers; changing it
  // after work has been logged or invoiced would silently re-denominate them.
  const requestedBudgetCur = input.budgetCurrency
  const legacyCurrency     = input.currency
  if (requestedBudgetCur !== undefined || legacyCurrency !== undefined) {
    const current = db.prepare('SELECT budget_currency, currency, name FROM projects WHERE id = ?').get(id)
    if (current) {
      const currentAnchor = current.budget_currency || current.currency
      const nextAnchor    = requestedBudgetCur ?? legacyCurrency
      if (currentAnchor && nextAnchor && currentAnchor !== nextAnchor) {
        if (isProjectBudgetLocked(db, id, current.name)) {
          throw new Error(
            'Cannot change budget currency: project already has time entries or invoices. ' +
            'Reset the project or create a new one to switch its anchor currency.'
          )
        }
      }
    }
  }

  const push = (sqlField, val) => { fields.push(`${sqlField} = ?`); values.push(val) }

  if (input.name               !== undefined) push('name',                input.name)
  if (input.clientId           !== undefined) push('client_id',           input.clientId)
  if (input.color              !== undefined) push('color',               input.color)
  if (input.hourlyRate         !== undefined) push('hourly_rate',         input.hourlyRate)
  if (input.billable           !== undefined) push('billable',            input.billable ? 1 : 0)
  if (input.archived           !== undefined) push('archived',            input.archived ? 1 : 0)
  if (input.trackingMode       !== undefined) push('tracking_mode',       input.trackingMode)
  if (input.budgetAmount       !== undefined) push('budget_amount',       input.budgetAmount)

  if (input.budgetCurrency !== undefined) {
    // Mirror to the legacy `currency` column to keep older readers happy.
    push('budget_currency', input.budgetCurrency)
    push('currency',        input.budgetCurrency)
  } else if (input.currency !== undefined) {
    // Legacy callers passing only `currency` — treat it as a budget-currency change too.
    push('currency',        input.currency)
    push('budget_currency', input.currency)
  }

  if (input.displayCurrency      !== undefined) push('display_currency',       input.displayCurrency)
  if (input.invoiceTemplate      !== undefined) push('invoice_template',       input.invoiceTemplate)
  if (input.invoiceLang          !== undefined) push('invoice_lang',           input.invoiceLang)
  if (input.invoiceFromName      !== undefined) push('invoice_from_name',      input.invoiceFromName)
  if (input.invoiceBilledTo      !== undefined) push('invoice_billed_to',      input.invoiceBilledTo)
  if (input.invoiceFixedAmount   !== undefined) push('invoice_fixed_amount',   input.invoiceFixedAmount)
  if (input.invoiceAutoGen       !== undefined) push('invoice_auto_gen',       input.invoiceAutoGen ? 1 : 0)
  if (input.invoiceBankAccountId !== undefined) push('invoice_bank_account_id', input.invoiceBankAccountId)
  if (input.dailyTargetHours    !== undefined) push('daily_target_hours',      input.dailyTargetHours || null)

  if (!fields.length) return null
  fields.push("updated_at = datetime('now', 'localtime')")
  values.push(id)

  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
}

export function resetProjectPeriod(db, id) {
  const today = new Date().toISOString().substring(0, 10)
  db.prepare(
    "UPDATE projects SET last_reset_at = ?, updated_at = datetime('now','localtime') WHERE id = ?"
  ).run(today, id)
  return periodSummaryFor(db, db.prepare('SELECT * FROM projects WHERE id = ?').get(id))
}

// ── Period summary ─────────────────────────────────────────────────────────

/**
 * Compute the running budget / hour totals for a project's current period.
 *
 * Periods:
 *   - 'monthly'        → 1st of the current month
 *   - 'budget'         → day after the last invoice; or project.created_at if none
 *   - manual reset     → overrides either, if more recent
 *
 * Returned amounts are always denominated in `budgetCurrency`. The renderer is
 * expected to convert into `displayCurrency` for presentation.
 */
export function periodSummaryFor(db, p) {
  const now        = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const mode       = p.tracking_mode || 'monthly'
  let periodStart  = monthStart

  if (mode === 'budget') {
    const last = db.prepare(
      'SELECT MAX(invoice_date) as d FROM invoices WHERE invoice_number LIKE ?'
    ).get(invoicePrefixFor(p.name) + '%')

    if (last?.d) {
      const d = new Date(last.d + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      periodStart = d.toISOString().substring(0, 10)
    } else {
      periodStart = p.created_at.substring(0, 10)
    }
  }

  // Manual reset overrides the computed start if more recent.
  if (p.last_reset_at && p.last_reset_at > periodStart) {
    periodStart = p.last_reset_at
  }

  const row = db.prepare(`
    SELECT
      COALESCE(SUM((julianday(stopped_at) - julianday(started_at)) * 24),     0) AS hours,
      COALESCE(SUM((julianday(stopped_at) - julianday(started_at)) * 24 * ?), 0) AS amount
    FROM time_entries
    WHERE project_id = ?
      AND stopped_at IS NOT NULL
      AND billable   = 1
      AND date(started_at) >= ?
  `).get(p.hourly_rate || 0, p.id, periodStart)

  return {
    projectId:       p.id,
    trackingMode:    mode,
    budgetAmount:    p.budget_amount || null,
    budgetCurrency:  p.budget_currency  || p.currency || 'EUR',
    displayCurrency: p.display_currency || p.budget_currency || p.currency || 'EUR',
    lastResetAt:     p.last_reset_at || null,
    periodStart,
    usedHours:       row?.hours  || 0,
    usedAmount:      row?.amount || 0,
  }
}

// ── Convenience ────────────────────────────────────────────────────────────

/** Convenience wrapper for callers that don't already have a db handle. */
export const projectService = {
  invoicePrefixFor,
  isProjectBudgetLocked: (id, name)  => isProjectBudgetLocked(getDb(), id, name),
  periodSummaryFor:      (project)   => periodSummaryFor(getDb(), project),
  resetProjectPeriod:    (id)        => resetProjectPeriod(getDb(), id),
  createProject:         (input)     => createProject(getDb(), input),
  updateProject:         (id, input) => updateProject(getDb(), id, input),
}
