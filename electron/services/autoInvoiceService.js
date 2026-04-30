import {
  invoicePrefixFor,
  periodSummaryFor,
} from './projectService.js'
import { buildDescription, lastDayOfMonth } from '../utils/dateUtils.js'

/**
 * Auto-invoice generation triggered when a budget-mode project crosses its
 * cap. All side effects (db inserts, business decisions) live here so the
 * timer:stop IPC handler stays a one-liner.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Next invoice number for a given project. Uses the canonical project prefix.
 * Returns the prefix-numbered form, e.g. `acme-corp-inv-00007`.
 */
export function nextInvoiceNumber(db, projectName) {
  const prefix = invoicePrefixFor(projectName)
  const { count } = db.prepare(
    'SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?'
  ).get(prefix + '%')
  return `${prefix}${String(count + 1).padStart(5, '0')}`
}

function todayLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function shouldAutoInvoice(project, summary) {
  if (!project?.invoice_auto_gen) return false
  if (project.tracking_mode !== 'budget') return false
  const budget = project.budget_amount || 0
  if (budget <= 0) return false
  if (summary.usedAmount < budget) return false
  return true
}

/**
 * Returns true if an invoice for the same project + period already exists.
 *
 * Note: this still uses the project-name prefix to scope the lookup. If the
 * project is renamed between cycles, the prefix changes and a duplicate will
 * NOT be detected — known limitation tracked in the audit (issue #5). Fixing
 * properly requires an `invoices.project_id` FK + UNIQUE(project_id, period_start).
 */
function alreadyExistsForPeriod(db, projectName, periodStart) {
  const prefix = invoicePrefixFor(projectName)
  return !!db.prepare(
    'SELECT id FROM invoices WHERE invoice_number LIKE ? AND (period_start = ? OR invoice_date >= ?)'
  ).get(prefix + '%', periodStart, periodStart)
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * If the supplied just-stopped time entry pushed its (budget-mode) project
 * over budget, create a draft invoice and return it. Otherwise returns null.
 *
 * This function never throws; failures degrade to a no-op so timer:stop
 * stays robust.
 */
export function maybeCreateForCompletedEntry(db, entry) {
  if (!entry?.project_id) return null

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(entry.project_id)
  if (!project) return null

  const summary = periodSummaryFor(db, project)
  if (!shouldAutoInvoice(project, summary)) return null
  if (alreadyExistsForPeriod(db, project.name, summary.periodStart)) return null

  const invoiceDate = todayLocal()
  const periodEnd   = project.tracking_mode === 'monthly'
    ? lastDayOfMonth(invoiceDate)
    : invoiceDate

  const lang     = project.invoice_lang     || 'en'
  const fromName = project.invoice_from_name || ''
  const amount   = project.invoice_fixed_amount ?? project.budget_amount ?? summary.usedAmount

  const description = (summary.periodStart && periodEnd && fromName)
    ? buildDescription(lang, fromName, summary.periodStart, periodEnd)
    : ''

  const invoiceNumber = nextInvoiceNumber(db, project.name)
  const items = JSON.stringify([{
    id:          Date.now(),
    description,
    quantity:    Number(summary.usedHours.toFixed(2)),
    rate:        project.hourly_rate || 0,
    amount,
  }])

  // Budget currency is the canonical anchor on a project (post-migration 16),
  // with a fallback to the legacy `currency` column for older rows.
  const currency = project.budget_currency || project.currency || 'EUR'

  const r = db.prepare(`
    INSERT INTO invoices
      (invoice_number, invoice_date, billed_to, bank_account_id, currency, items, status,
       template, lang, from_name, period_start, period_end)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
  `).run(
    invoiceNumber, invoiceDate,
    project.invoice_billed_to        || null,
    project.invoice_bank_account_id  || null,
    currency,
    items,
    project.invoice_template         || 'standard',
    lang, fromName || null,
    summary.periodStart, periodEnd,
  )

  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(r.lastInsertRowid)
  return { ...row, items: JSON.parse(row.items || '[]') }
}
