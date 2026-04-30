import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useSettingsStore } from '../../store/settingsStore'
import BankAccountsModal from './BankAccountsModal'
import { useFx } from '../shared/useFx'
import {
  bankAccounts as bankAccountsApi,
  invoices     as invoicesApi,
  projects     as projectsApi,
} from '../../api'
import { today, in30, firstOfMonth, lastOfMonth, newItem, roundUpHours } from './utils'
import InvoiceToolbar  from './InvoiceToolbar'
import InvoiceMeta     from './InvoiceMeta'
import InvoiceParties  from './InvoiceParties'
import FactureBody     from './FactureBody'
import LineItemsTable  from './LineItemsTable'
import TimeImportPanel from './TimeImportPanel'
import InvoiceTotals   from './InvoiceTotals'

/**
 * Top-level invoice editor / form. Owns all form state and side-effects;
 * delegates rendering to focused presentational sub-components.
 */
export default function InvoiceEditor({ invoice, preProject, onSave, onBack }) {
  const fx = useFx()
  const { invoiceRounding } = useSettingsStore()

  // ── Document fields ──────────────────────────────────────────────────────
  const [num,      setNum]      = useState(invoice?.invoice_number || '')
  const [iDate,    setIDate]    = useState(invoice?.invoice_date   || today)
  const [dDate,    setDDate]    = useState(invoice?.due_date       || in30)
  const [po,       setPo]       = useState(invoice?.purchase_order || '')
  const [terms,    setTerms]    = useState(invoice?.payment_terms  || '')
  const [billedTo, setBilledTo] = useState(invoice?.billed_to      || '')
  const [currency, setCurrency] = useState(invoice?.currency       || 'USD')
  const [items,    setItems]    = useState(invoice?.items?.length ? invoice.items : [])
  const [taxOn,    setTaxOn]    = useState(!!(invoice?.tax_rate))
  const [taxLabel, setTaxLabel] = useState(invoice?.tax_label || 'Tax')
  const [taxRate,  setTaxRate]  = useState(invoice?.tax_rate  || 0)
  const [notes,    setNotes]    = useState(invoice?.notes     || '')
  const [status,   setStatus]   = useState(invoice?.status    || 'draft')

  // ── FX snapshot ──────────────────────────────────────────────────────────
  // sourceCurrency = the project's budget currency at creation; ALWAYS persisted
  // alongside `currency` and `fxRate` so historical invoices remain audit-correct
  // even when live rates shift.
  const [sourceCurrency, setSourceCurrency] = useState(invoice?.source_currency || null)
  const [fxRateLocked,   setFxRateLocked]   = useState(invoice?.fx_rate     ?? null)
  const [fxFetchedAt,    setFxFetchedAt]    = useState(invoice?.fx_fetched_at || null)

  // ── Project context ──────────────────────────────────────────────────────
  const [projects,          setProjects]          = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(preProject?.id || null)

  // ── Bank account ─────────────────────────────────────────────────────────
  const [bankAccounts,  setBankAccounts]  = useState([])
  const [bankAccountId, setBankAccountId] = useState(invoice?.bank_account_id || null)
  const [showBankModal, setShowBankModal] = useState(false)

  // ── Time import ──────────────────────────────────────────────────────────
  const [showImport,    setShowImport]    = useState(false)
  const [importFrom,    setImportFrom]    = useState(firstOfMonth())
  const [importTo,      setImportTo]      = useState(today)
  const [importProject, setImportProject] = useState('')
  const [importRate,    setImportRate]    = useState('')
  const [importSummary, setImportSummary] = useState(null)

  // ── Template / FACTURE ───────────────────────────────────────────────────
  const [template,    setTemplate]    = useState(invoice?.template     || 'standard')
  const [lang,        setLang]        = useState(invoice?.lang         || 'en')
  const [fromName,    setFromName]    = useState(invoice?.from_name    || '')
  const [periodStart, setPeriodStart] = useState(invoice?.period_start || firstOfMonth())
  const [periodEnd,   setPeriodEnd]   = useState(invoice?.period_end   || lastOfMonth())
  const [fixedAmount, setFixedAmount] = useState('')

  // ── UI state ─────────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    bankAccountsApi.list().then(setBankAccounts)
    projectsApi.list().then(setProjects)
    if (!invoice) {
      invoicesApi.nextNumber(preProject?.name || '').then(setNum)
    }
  }, [])

  /** When user picks a project: regenerate invoice number, pre-fill template fields. */
  async function handleProjectChange(projectId) {
    setSelectedProjectId(projectId || null)
    const project = projects.find((p) => p.id === Number(projectId))

    if (!invoice?.id) {
      const nextNum = await invoicesApi.nextNumber(project?.name || '')
      setNum(nextNum)
    }

    if (!project) return

    if (project.invoice_template)  setTemplate(project.invoice_template)
    if (project.invoice_lang)      setLang(project.invoice_lang)
    if (project.invoice_from_name) setFromName(project.invoice_from_name)

    // Source currency = project's budget currency. Default invoice currency
    // to the same on a fresh draft; user can change it after.
    const projSource = project.budget_currency || project.currency || null
    if (projSource) {
      setSourceCurrency(projSource)
      if (!invoice?.id) setCurrency(projSource)
    }

    if (!invoice?.id) {
      if (project.invoice_billed_to)       setBilledTo(project.invoice_billed_to)
      if (project.invoice_fixed_amount)    setFixedAmount(String(project.invoice_fixed_amount))
      if (project.invoice_bank_account_id) setBankAccountId(project.invoice_bank_account_id)
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId) || null
  const subtotal     = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const taxAmount    = taxOn && taxRate ? subtotal * taxRate / 100 : 0
  const total        = subtotal + taxAmount
  const fmt          = (n) => `${Number(n || 0).toFixed(2)} ${currency}`

  // For an existing invoice we ALWAYS use the locked rate stored at creation
  // time; for a draft we use the current live rate from useFx until save snapshots it.
  const liveRate    = fx.rateBetween(sourceCurrency, currency)
  const fxIsActive  = !!sourceCurrency && sourceCurrency !== currency
  const effFxRate   = fxRateLocked != null ? fxRateLocked : (fxIsActive ? liveRate : 1)
  const sourceTotal = fxIsActive && effFxRate ? total / effFxRate : total

  const payToText = selectedBank ? [
    selectedBank.iban ? `IBAN\n${selectedBank.iban}` : '',
    selectedBank.bic  ? `\nBIC / SWIFT code\n${selectedBank.bic}` : '',
    selectedBank.bank_name ? `\nBank Name and Address\n${selectedBank.bank_name}` : '',
    selectedBank.bank_address ? `\n${selectedBank.bank_address}` : '',
  ].join('').trim() : ''

  // ── Item helpers ─────────────────────────────────────────────────────────
  function updateItem(id, field, value) {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it
      const updated = { ...it, [field]: value }
      if (field === 'quantity' || field === 'rate') {
        updated.amount = Number(updated.quantity || 0) * Number(updated.rate || 0)
      }
      return updated
    }))
  }
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id))
  const addItem    = ()   => setItems((prev) => [...prev, newItem()])

  // ── Time import ──────────────────────────────────────────────────────────
  async function loadImportSummary() {
    const summary = await invoicesApi.timeSummary(
      importFrom, importTo, importProject ? Number(importProject) : undefined,
    )
    setImportSummary(summary)
    if (!importRate && summary.totalHours > 0 && summary.totalAmount > 0) {
      setImportRate(String((summary.totalAmount / summary.totalHours).toFixed(2)))
    }
  }

  function applyImport() {
    if (!importSummary || importSummary.totalHours <= 0) return
    const rate      = Number(importRate) || 0
    const rawHours  = importSummary.totalHours
    const hours     = roundUpHours(rawHours, invoiceRounding)
    const fromLabel = format(new Date(importFrom + 'T00:00:00'), 'MMM d')
    const toLabel   = format(new Date(importTo   + 'T00:00:00'), 'MMM d, yyyy')
    setItems((prev) => [...prev, newItem({
      description: `Professional services — ${fromLabel} to ${toLabel}`,
      quantity:    Number(hours.toFixed(2)),
      rate,
      amount:      Number((hours * rate).toFixed(2)),
    })])
    setShowImport(false)
    setImportSummary(null)
  }

  // ── Save / Export ────────────────────────────────────────────────────────
  /**
   * Snapshot the FX rate at save time. Once an invoice has been written with a
   * locked rate, we keep that rate forever — even on subsequent edits — so the
   * PDF stays audit-correct.
   */
  function snapshotFx() {
    if (!sourceCurrency || sourceCurrency === currency) {
      return { rate: null, fetchedAt: null }
    }
    if (fxRateLocked != null) {
      return { rate: fxRateLocked, fetchedAt: fxFetchedAt || new Date().toISOString() }
    }
    const rate = liveRate || 1
    return { rate, fetchedAt: new Date().toISOString() }
  }

  function collectData(snap) {
    const srcAmount = (sourceCurrency && sourceCurrency !== currency && snap.rate)
      ? total / snap.rate
      : (sourceCurrency ? total : null)

    return {
      invoiceNumber: num,
      invoiceDate:   iDate,
      dueDate:       dDate,
      purchaseOrder: po,
      paymentTerms:  terms,
      billedTo,
      bankAccountId,
      currency,
      items,
      taxLabel: taxOn ? taxLabel        : null,
      taxRate:  taxOn ? Number(taxRate) : null,
      notes,
      status,
      template,
      lang,
      fromName: fromName || null,
      periodStart,
      periodEnd,
      fixedAmount:    fixedAmount ? parseFloat(fixedAmount) : null,
      sourceCurrency: sourceCurrency || null,
      sourceAmount:   srcAmount,
      fxRate:         snap.rate,
      fxFetchedAt:    snap.fetchedAt,
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const snap = snapshotFx()
      const data = collectData(snap)
      const saved = invoice?.id
        ? await invoicesApi.update(invoice.id, data)
        : await invoicesApi.create(data)
      if (snap.rate != null) {
        setFxRateLocked(snap.rate)
        setFxFetchedAt(snap.fetchedAt)
      }
      onSave(saved)
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const snap = snapshotFx()
      const data = collectData(snap)
      const result = await invoicesApi.exportPdf({
        ...data,
        bankAccount: selectedBank ? {
          iban:        selectedBank.iban,
          bic:         selectedBank.bic,
          bankName:    selectedBank.bank_name,
          bankAddress: selectedBank.bank_address,
          name:        selectedBank.name,
        } : null,
      })
      if (result.success) {
        if (!invoice?.id) {
          const saved = await invoicesApi.create(data)
          onSave(saved)
        } else {
          await invoicesApi.update(invoice.id, data)
        }
        if (snap.rate != null) {
          setFxRateLocked(snap.rate)
          setFxFetchedAt(snap.fetchedAt)
        }
      }
    } finally {
      setExporting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <InvoiceToolbar
        onBack={onBack}
        status={status}      onStatusChange={setStatus}
        onSave={handleSave}  saving={saving}
        onExport={handleExport} exporting={exporting}
      />

      {/* Template toggle */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-500">Template:</span>
        {['standard', 'facture'].map((t) => (
          <button
            key={t}
            onClick={() => { setTemplate(t); if (t === 'facture') setLang('fr') }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              template === t
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400'
            }`}
          >
            {t === 'standard' ? 'Standard' : 'French FACTURE'}
          </button>
        ))}
      </div>

      {/* Document */}
      <div className="bg-white text-gray-900 rounded-xl shadow-2xl p-10 space-y-8">
        <InvoiceMeta
          template={template}
          num={num}     setNum={setNum}
          iDate={iDate} setIDate={setIDate}
          dDate={dDate} setDDate={setDDate}
          po={po}       setPo={setPo}
          terms={terms} setTerms={setTerms}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onProjectChange={handleProjectChange}
        />

        <InvoiceParties
          billedTo={billedTo}    setBilledTo={setBilledTo}
          currency={currency}    setCurrency={setCurrency}
          bankAccountId={bankAccountId}
          selectedBank={selectedBank}
          payToText={payToText}
          onOpenBankModal={() => setShowBankModal(true)}
          sourceCurrency={sourceCurrency}
          fxIsActive={fxIsActive}
          effFxRate={effFxRate}
          fxRateLocked={fxRateLocked} setFxRateLocked={setFxRateLocked}
          fxFetchedAt={fxFetchedAt}
          sourceTotal={sourceTotal}
        />

        {template === 'facture' && (
          <FactureBody
            fromName={fromName}        setFromName={setFromName}
            lang={lang}                setLang={setLang}
            periodStart={periodStart}  setPeriodStart={setPeriodStart}
            periodEnd={periodEnd}      setPeriodEnd={setPeriodEnd}
            items={items}              setItems={setItems}
            fixedAmount={fixedAmount}  setFixedAmount={setFixedAmount}
            currency={currency}
            subtotal={subtotal}
          />
        )}

        {template !== 'facture' && (
          <>
            <LineItemsTable
              items={items}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onAddItem={addItem}
              onShowImport={() => setShowImport(true)}
            />
            {showImport && (
              <TimeImportPanel
                importFrom={importFrom}        setImportFrom={setImportFrom}
                importTo={importTo}            setImportTo={setImportTo}
                importProject={importProject}  setImportProject={setImportProject}
                importRate={importRate}        setImportRate={setImportRate}
                importSummary={importSummary}
                projects={projects}
                currency={currency}
                invoiceRounding={invoiceRounding}
                onPreview={loadImportSummary}
                onApply={applyImport}
                onCancel={() => { setShowImport(false); setImportSummary(null) }}
              />
            )}
            <InvoiceTotals
              subtotal={subtotal} taxAmount={taxAmount} total={total} fmt={fmt}
              taxOn={taxOn}       setTaxOn={setTaxOn}
              taxLabel={taxLabel} setTaxLabel={setTaxLabel}
              taxRate={taxRate}   setTaxRate={setTaxRate}
            />
          </>
        )}

        {/* Notes */}
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a custom message or payment details…"
            rows={4}
            className="w-full text-sm text-gray-700 bg-transparent outline-none border border-gray-200 rounded-lg px-4 py-3 resize-none focus:border-violet-400 placeholder:text-gray-300 transition-colors"
          />
        </div>
      </div>

      {showBankModal && (
        <BankAccountsModal
          onClose={() => { setShowBankModal(false); bankAccountsApi.list().then(setBankAccounts) }}
          onSelect={(acc) => { setBankAccountId(acc.id); setShowBankModal(false); bankAccountsApi.list().then(setBankAccounts) }}
        />
      )}
    </div>
  )
}
