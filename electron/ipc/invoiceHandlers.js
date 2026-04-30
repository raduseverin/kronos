import { dialog, BrowserWindow } from 'electron'
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs'
import path from 'path'
import os from 'os'
import { getDb } from '../db/database.js'
import { formatDateFr, formatDateEn, buildDescription } from '../utils/dateUtils.js'
import { invoicePrefixFor } from '../services/projectService.js'
import { nextInvoiceNumber } from '../services/autoInvoiceService.js'
import { entryDurationSeconds, secondsToHours } from '../utils/duration.js'

export function registerInvoiceHandlers(ipcMain) {
  // ── Bank accounts ──────────────────────────────────────────────────────────

  ipcMain.handle('bank-accounts:list', () =>
    getDb().prepare('SELECT * FROM bank_accounts ORDER BY is_default DESC, name ASC').all()
  )

  ipcMain.handle('bank-accounts:create', (_e, data) => {
    const db = getDb()
    if (data.isDefault) db.prepare('UPDATE bank_accounts SET is_default = 0').run()
    const r = db.prepare(`
      INSERT INTO bank_accounts (name, iban, bic, bank_name, bank_address, currency, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.name, data.iban || null, data.bic || null, data.bankName || null,
           data.bankAddress || null, data.currency || 'USD', data.isDefault ? 1 : 0)
    return db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(r.lastInsertRowid)
  })

  ipcMain.handle('bank-accounts:update', (_e, id, data) => {
    const db = getDb()
    if (data.isDefault) db.prepare('UPDATE bank_accounts SET is_default = 0').run()
    const fields = [], values = []
    const map = { name: 'name', iban: 'iban', bic: 'bic', bankName: 'bank_name',
                  bankAddress: 'bank_address', currency: 'currency' }
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) { fields.push(`${col} = ?`); values.push(data[k]) }
    }
    if (data.isDefault !== undefined) { fields.push('is_default = ?'); values.push(data.isDefault ? 1 : 0) }
    if (!fields.length) return null
    fields.push("updated_at = datetime('now', 'localtime')")
    values.push(id)
    db.prepare(`UPDATE bank_accounts SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(id)
  })

  ipcMain.handle('bank-accounts:delete', (_e, id) =>
    getDb().prepare('DELETE FROM bank_accounts WHERE id = ?').run(id)
  )

  // ── Invoices ───────────────────────────────────────────────────────────────

  ipcMain.handle('invoices:list', () =>
    getDb().prepare(`
      SELECT i.*, ba.name as bank_account_name
      FROM invoices i
      LEFT JOIN bank_accounts ba ON ba.id = i.bank_account_id
      ORDER BY i.invoice_date DESC, i.created_at DESC
    `).all().map(r => ({ ...r, items: JSON.parse(r.items || '[]') }))
  )

  ipcMain.handle('invoices:list-for-project', (_e, projectName) => {
    const prefix = invoicePrefixFor(projectName)
    return getDb().prepare(`
      SELECT i.*, ba.name as bank_account_name
      FROM invoices i
      LEFT JOIN bank_accounts ba ON ba.id = i.bank_account_id
      WHERE i.invoice_number LIKE ?
      ORDER BY i.invoice_date DESC, i.created_at DESC
    `).all(prefix + '%').map(r => ({ ...r, items: JSON.parse(r.items || '[]') }))
  })

  ipcMain.handle('invoices:next-number', (_e, projectName) => {
    const db = getDb()
    if (projectName) return nextInvoiceNumber(db, projectName)
    const { count } = db.prepare('SELECT COUNT(*) as count FROM invoices').get()
    return `inv-${String(count + 1).padStart(5, '0')}`
  })

  ipcMain.handle('invoices:create', (_e, data) => {
    const db = getDb()
    const r = db.prepare(`
      INSERT INTO invoices
        (invoice_number, invoice_date, due_date, purchase_order, payment_terms,
         billed_to, bank_account_id, currency, items, tax_label, tax_rate, notes, status,
         template, lang, from_name, period_start, period_end,
         source_currency, source_amount, fx_rate, fx_fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.invoiceNumber, data.invoiceDate, data.dueDate || null,
      data.purchaseOrder || null, data.paymentTerms || null,
      data.billedTo || null, data.bankAccountId || null,
      data.currency || 'USD', JSON.stringify(data.items || []),
      data.taxLabel || null, data.taxRate ?? null, data.notes || null, data.status || 'draft',
      data.template || 'standard', data.lang || 'en',
      data.fromName || null, data.periodStart || null, data.periodEnd || null,
      data.sourceCurrency || null, data.sourceAmount ?? null,
      data.fxRate ?? null, data.fxFetchedAt || null,
    )
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(r.lastInsertRowid)
    return { ...row, items: JSON.parse(row.items || '[]') }
  })

  ipcMain.handle('invoices:update', (_e, id, data) => {
    const db = getDb()
    const fields = [], values = []
    const strMap = {
      invoiceNumber: 'invoice_number', invoiceDate: 'invoice_date',
      dueDate: 'due_date', purchaseOrder: 'purchase_order',
      paymentTerms: 'payment_terms', billedTo: 'billed_to',
      currency: 'currency', taxLabel: 'tax_label', notes: 'notes', status: 'status',
    }
    for (const [k, col] of Object.entries(strMap)) {
      if (data[k] !== undefined) { fields.push(`${col} = ?`); values.push(data[k]) }
    }
    if (data.bankAccountId !== undefined) { fields.push('bank_account_id = ?'); values.push(data.bankAccountId) }
    if (data.taxRate !== undefined) { fields.push('tax_rate = ?'); values.push(data.taxRate) }
    if (data.items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(data.items)) }
    if (data.template !== undefined) { fields.push('template = ?'); values.push(data.template) }
    if (data.lang !== undefined) { fields.push('lang = ?'); values.push(data.lang) }
    if (data.fromName !== undefined) { fields.push('from_name = ?'); values.push(data.fromName) }
    if (data.periodStart !== undefined) { fields.push('period_start = ?'); values.push(data.periodStart) }
    if (data.periodEnd !== undefined) { fields.push('period_end = ?'); values.push(data.periodEnd) }
    // FX snapshot fields are only writable on update if the invoice is still a draft —
    // once an invoice has been sent/paid, the historical rate must be immutable.
    if (data.sourceCurrency !== undefined) { fields.push('source_currency = ?'); values.push(data.sourceCurrency) }
    if (data.sourceAmount   !== undefined) { fields.push('source_amount = ?');   values.push(data.sourceAmount) }
    if (data.fxRate         !== undefined) { fields.push('fx_rate = ?');         values.push(data.fxRate) }
    if (data.fxFetchedAt    !== undefined) { fields.push('fx_fetched_at = ?');   values.push(data.fxFetchedAt) }
    if (!fields.length) return null
    fields.push("updated_at = datetime('now', 'localtime')")
    values.push(id)
    db.prepare(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)
    return { ...row, items: JSON.parse(row.items || '[]') }
  })

  ipcMain.handle('invoices:delete', (_e, id) =>
    getDb().prepare('DELETE FROM invoices WHERE id = ?').run(id)
  )

  ipcMain.handle('invoices:time-summary', (_e, from, to, projectId) => {
    const db = getDb()
    let sql = `
      SELECT te.*, p.hourly_rate
      FROM time_entries te
      LEFT JOIN projects p ON p.id = te.project_id
      WHERE date(te.started_at) BETWEEN ? AND ?
        AND te.stopped_at IS NOT NULL
        AND te.billable = 1
    `
    const params = [from, to]
    if (projectId) { sql += ' AND te.project_id = ?'; params.push(projectId) }
    const entries = db.prepare(sql).all(...params)

    let totalSeconds = 0, totalAmount = 0
    for (const e of entries) {
      const secs = entryDurationSeconds(e)
      totalSeconds += secs
      if (e.hourly_rate) totalAmount += secondsToHours(secs) * e.hourly_rate
    }
    return { totalHours: secondsToHours(totalSeconds), totalAmount, entryCount: entries.length }
  })

  ipcMain.handle('invoices:export-pdf', async (_e, invoiceData) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `invoice-${invoiceData.invoiceNumber || 'draft'}-${invoiceData.invoiceDate || 'unknown'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (canceled || !filePath) return { success: false }

    const html = invoiceData.template === 'facture'
      ? buildFactureHtml(invoiceData)
      : buildInvoiceHtml(invoiceData)
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'kronos-'))
    const tmpFile = path.join(tmpDir, 'invoice.html')
    writeFileSync(tmpFile, html, 'utf8')

    const win = new BrowserWindow({ show: false, webPreferences: { javascript: false } })
    try {
      await win.loadFile(tmpFile)
      const pdfBuf = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'none' },
      })
      writeFileSync(filePath, pdfBuf)
      return { success: true, filePath }
    } finally {
      win.destroy()
      try { unlinkSync(tmpFile) } catch {}
    }
  })
}

// ── HTML template for PDF ──────────────────────────────────────────────────

function buildInvoiceHtml(inv) {
  const { invoiceNumber, invoiceDate, dueDate, purchaseOrder, paymentTerms,
          billedTo, currency = 'USD', items = [], taxLabel, taxRate, notes, bankAccount } = inv

  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const taxAmt   = taxRate ? subtotal * taxRate / 100 : 0
  const total    = subtotal + taxAmt
  const fmt      = n => `${Number(n).toFixed(2)} ${currency}`

  const metaRows = [
    ['Invoice ID:', invoiceNumber || ''],
    ['Invoice Date:', invoiceDate || ''],
    dueDate         ? ['Due date:',       dueDate]         : null,
    purchaseOrder   ? ['Purchase order:', purchaseOrder]   : null,
    paymentTerms    ? ['Payment terms:',  paymentTerms]    : null,
  ].filter(Boolean)

  const bankLines = bankAccount ? [
    bankAccount.iban        ? `IBAN\n${bankAccount.iban}`                        : '',
    bankAccount.bic         ? `\nBIC / SWIFT code\n${bankAccount.bic}`           : '',
    bankAccount.bankName    ? `\nBank Name and Address\n${bankAccount.bankName}` : '',
    bankAccount.bankAddress ? `\n${bankAccount.bankAddress}`                     : '',
  ].join('').trim() : ''

  const itemRows = items.map(it => `
    <tr>
      <td>${esc(it.description || '')}</td>
      <td class="r">${Number(it.quantity || 0).toFixed(2)}</td>
      <td class="r">${fmt(it.amount || 0)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Helvetica,Arial,sans-serif;color:#111;font-size:13px;line-height:1.5;padding:52px}
h1{font-size:42px;font-weight:700;margin-bottom:28px}
.meta td{padding:2px 16px 2px 0;vertical-align:top}
.meta td:first-child{font-weight:600;white-space:nowrap}
.parties{display:flex;flex-direction:column;gap:20px;margin-top:36px}
.party-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#888;margin-bottom:6px}
.party-content{white-space:pre-wrap}
table.items{width:100%;border-collapse:collapse;margin-top:32px}
table.items th{border-top:2px solid #ccc;border-bottom:1px solid #ccc;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#888;text-align:left}
table.items th.r,table.items td.r{text-align:right}
table.items td{padding:9px 10px;border-bottom:1px solid #f0f0f0}
.totals{margin-top:12px;margin-left:auto;width:260px}
.trow{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f4f4f4}
.subtot{border-top:2px solid #ccc;padding-top:8px;margin-top:4px;border-bottom:none;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#888}
.totfin{border-top:2px solid #111;margin-top:8px;padding-top:10px;font-size:18px;font-weight:700;border-bottom:none}
.notes{margin-top:40px;padding:16px;border:1px solid #ddd;border-radius:4px;color:#555;white-space:pre-wrap;font-size:12px}
</style></head><body>
<h1>Invoice</h1>
<table class="meta">${metaRows.map(([l,v])=>`<tr><td>${esc(l)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
<div class="parties">
  <div class="party"><div class="party-label">Billed to:</div><div class="party-content">${esc(billedTo||'')}</div></div>
  ${bankLines?`<div class="party"><div class="party-label">Pay to:</div><div class="party-content">${esc(bankLines)}</div></div>`:''}
  <div class="party"><div class="party-label">Currency</div><div>${esc(currency)}</div></div>
</div>
<table class="items">
<thead><tr><th>Description</th><th class="r">Quantity (h)</th><th class="r">Amount</th></tr></thead>
<tbody>${itemRows}</tbody>
</table>
<div class="totals">
  <div class="trow subtot"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
  ${taxRate?`<div class="trow"><span>${esc(taxLabel||'Tax')} (${taxRate}%)</span><span>${fmt(taxAmt)}</span></div>`:''}
  <div class="trow totfin"><span>Total</span><span>${fmt(total)}</span></div>
</div>
${notes?`<div class="notes">${esc(notes)}</div>`:''}
</body></html>`
}

// ── FACTURE (French/simple) template ──────────────────────────────────────

function buildFactureHtml(inv) {
  const { invoiceNumber, invoiceDate, billedTo, currency = 'EUR',
          items = [], bankAccount, fromName, lang = 'fr', periodStart, periodEnd } = inv

  const total = (inv.fixedAmount != null)
    ? Number(inv.fixedAmount)
    : items.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  // Description: use first item's description or auto-generate from period
  let description = items[0]?.description || ''
  if (!description && periodStart && periodEnd && fromName) {
    description = buildDescription(lang, fromName, periodStart, periodEnd)
  }

  const payLabel = lang === 'fr'
    ? 'Payable à réception sur le compte suivant :'
    : 'Payable upon receipt to the following account:'

  let paymentLines = ''
  if (bankAccount) {
    const beneficiaryLabel = lang === 'fr' ? 'Euro Beneficiary:' : 'Beneficiary:'
    paymentLines = [
      `${payLabel}`,
      bankAccount.iban ? `${beneficiaryLabel} <b>${esc(fromName || '')}</b>` : '',
      bankAccount.iban ? `IBAN <b>${esc(bankAccount.iban)}</b>` : '',
      bankAccount.bic  ? `BIC / SWIFT code <b>${esc(bankAccount.bic)}</b>` : '',
    ].filter(Boolean).join('<br>')
  }

  const invDateFmt = invoiceDate
    ? (lang === 'fr' ? formatDateFr(invoiceDate) : formatDateEn(invoiceDate))
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Times New Roman",Times,serif;color:#000;font-size:13px;line-height:1.6;padding:72px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:130px}
.from{font-size:13px}
.to{font-size:13px;text-align:right;white-space:pre-wrap}
.title-wrap{text-align:center;margin-bottom:130px}
.title{font-size:30px;font-weight:bold;text-decoration:underline;letter-spacing:3px}
.inv-ref{font-size:11px;color:#555;margin-top:8px}
.description{margin-bottom:80px;font-size:13px;line-height:1.8}
.total-row{display:flex;justify-content:space-between;font-size:14px;font-weight:bold;padding:12px 0;margin-bottom:100px}
.total-amount u{text-decoration:underline}
.payment{font-size:12px;line-height:2.2}
</style></head><body>
<div class="header">
  <div class="from">${esc(fromName || '')}</div>
  <div class="to">${esc(billedTo || '')}</div>
</div>
<div class="title-wrap">
  <div class="title">FACTURE</div>
  ${invoiceNumber ? `<div class="inv-ref">N° ${esc(invoiceNumber)}${invDateFmt ? ' &nbsp;·&nbsp; ' + esc(invDateFmt) : ''}</div>` : ''}
</div>
<div class="description">${esc(description)}</div>
<div class="total-row">
  <span>Total</span>
  <span class="total-amount">${Number(total).toFixed(2)} <u>${esc(currency)}</u></span>
</div>
${paymentLines ? `<div class="payment">${paymentLines}</div>` : ''}
</body></html>`
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
