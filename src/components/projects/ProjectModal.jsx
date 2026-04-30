import React, { useEffect, useState } from 'react'
import Modal from '../shared/Modal'
import { bankAccounts as bankAccountsApi, projects as projectsApi } from '../../api'
import { COLORS, COMMON_CURRENCIES, budgetCurOf, displayCurOf } from './utils'

/**
 * Create / edit form for a project. Largest sub-component because it owns
 * the budget-vs-display currency UX, the budget-currency lock guard, and all
 * the per-project invoice settings.
 */
export default function ProjectModal({ project, clients, onSave, onClose }) {
  const [name,               setName]               = useState(project?.name                 || '')
  const [clientId,           setClientId]           = useState(project?.client_id            || '')
  const [color,              setColor]              = useState(project?.color                || COLORS[0])
  const [hourlyRate,         setHourlyRate]         = useState(project?.hourly_rate          || '')
  // Currency is split: budget = anchor (immutable after first use), display = view-only.
  const [budgetCurrency,     setBudgetCurrency]     = useState(budgetCurOf(project))
  const [displayCurrency,    setDisplayCurrency]    = useState(displayCurOf(project))
  const [billable,           setBillable]           = useState(project?.billable !== undefined ? !!project.billable : true)
  const [trackingMode,       setTrackingMode]       = useState(project?.tracking_mode        || 'monthly')
  const [budgetAmount,       setBudgetAmount]       = useState(project?.budget_amount        || '')
  // Invoice settings
  const [invoiceTemplate,    setInvoiceTemplate]    = useState(project?.invoice_template     || 'standard')
  const [invoiceLang,        setInvoiceLang]        = useState(project?.invoice_lang         || 'en')
  const [invoiceFromName,    setInvoiceFromName]    = useState(project?.invoice_from_name    || '')
  const [invoiceBilledTo,    setInvoiceBilledTo]    = useState(project?.invoice_billed_to    || '')
  const [invoiceFixedAmount, setInvoiceFixedAmount] = useState(project?.invoice_fixed_amount || '')
  const [invoiceAutoGen,        setInvoiceAutoGen]        = useState(!!project?.invoice_auto_gen)
  const [invoiceBankAccountId,  setInvoiceBankAccountId]  = useState(project?.invoice_bank_account_id || '')
  const [dailyTargetHours,      setDailyTargetHours]      = useState(project?.daily_target_hours || '')
  const [bankAccounts,          setBankAccounts]          = useState([])
  // Whether the budget currency is locked (project has historical entries or invoices).
  const [budgetLocked,          setBudgetLocked]          = useState(false)

  useEffect(() => { bankAccountsApi.list().then(setBankAccounts) }, [])

  useEffect(() => {
    if (!project?.id) { setBudgetLocked(false); return }
    projectsApi.budgetLocked(project.id).then(setBudgetLocked).catch(() => {})
  }, [project?.id])

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(), clientId: clientId || null, color,
      hourlyRate:          hourlyRate          ? parseFloat(hourlyRate)          : null,
      billable, trackingMode,
      budgetCurrency, displayCurrency,
      budgetAmount:        budgetAmount        ? parseFloat(budgetAmount)        : null,
      invoiceTemplate, invoiceLang,
      invoiceFromName:     invoiceFromName     || null,
      invoiceBilledTo:     invoiceBilledTo     || null,
      invoiceFixedAmount:  invoiceFixedAmount  ? parseFloat(invoiceFixedAmount)  : null,
      invoiceAutoGen,
      invoiceBankAccountId: invoiceBankAccountId ? Number(invoiceBankAccountId) : null,
      dailyTargetHours:     dailyTargetHours     ? parseFloat(dailyTargetHours) : null,
    })
  }

  return (
    <Modal title={project ? 'Edit Project' : 'New Project'} onClose={onClose}>
      <label className="block mb-3">
        <span className="text-xs text-slate-400">Name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="mt-1 w-full bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>

      <label className="block mb-3">
        <span className="text-xs text-slate-400">Client</span>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="mt-1 w-full bg-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">No client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <div className="mb-3">
        <span className="text-xs text-slate-400">Color</span>
        <div className="flex gap-2 mt-1 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* ── Money & currency block ────────────────────────────────────────────
          Budget currency is the anchor for everything stored on this project.
          Display currency is purely for viewing — switching it converts on
          read but never mutates the underlying numbers. */}
      <div className="mb-4 border border-slate-700 rounded-lg p-3 space-y-3 bg-slate-800/40">
        <div className="text-xs font-semibold text-slate-300">Budget &amp; currency</div>

        {/* Tracking mode */}
        <div>
          <span className="text-xs text-slate-400 block mb-2">Tracking mode</span>
          <div className="flex gap-2">
            {['monthly', 'budget'].map((m) => (
              <button
                key={m}
                onClick={() => setTrackingMode(m)}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors capitalize ${
                  trackingMode === m
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                {m === 'monthly' ? 'Monthly' : 'Per budget'}
              </button>
            ))}
          </div>
          {trackingMode === 'monthly' && (
            <p className="text-xs text-slate-500 mt-1.5">Hours reset at the start of each month.</p>
          )}
        </div>

        {/* Budget amount + currency */}
        <div className="grid grid-cols-[1fr_140px] gap-2">
          <label className="block">
            <span className="text-xs text-slate-400">
              {trackingMode === 'budget' ? 'Budget amount' : 'Budget amount (optional)'}
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="mt-1 w-full bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Budget currency</span>
            <select
              value={budgetCurrency}
              onChange={(e) => {
                const v = e.target.value
                setBudgetCurrency(v)
                // Keep display currency in lockstep until the user explicitly diverges it.
                if (displayCurrency === budgetCurrency) setDisplayCurrency(v)
              }}
              disabled={budgetLocked}
              title={budgetLocked ? 'Locked: project already has time entries or invoices' : ''}
              className="mt-1 w-full bg-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        {budgetLocked && (
          <p className="text-[11px] text-amber-400/80 -mt-1">
            Budget currency is locked because this project has time entries or invoices.
            Reset the project or create a new one to switch its anchor currency.
          </p>
        )}
        {trackingMode === 'budget' && (
          <p className="text-xs text-slate-500 -mt-1">
            Invoice is generated for this amount. Counter resets after each invoice.
          </p>
        )}

        {/* Hourly rate — implicitly in budget currency, never converted. */}
        <label className="block">
          <span className="text-xs text-slate-400">
            Hourly rate <span className="text-slate-500">(in {budgetCurrency})</span>
          </span>
          <div className="relative mt-1">
            <input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-700 text-slate-100 text-sm rounded-lg pl-3 pr-14 py-2 outline-none focus:ring-1 focus:ring-violet-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
              {budgetCurrency}/hr
            </span>
          </div>
        </label>

        {/* Display currency — view-only conversion, freely editable. */}
        <label className="block">
          <span className="text-xs text-slate-400">Display currency</span>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="mt-1 w-full bg-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
          >
            {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Used to <span className="text-slate-400">view</span> amounts only. Budget and rate stay anchored in {budgetCurrency}; switching this never changes any stored value.
          </p>
        </label>
      </div>

      {/* Daily target */}
      <div className="mb-4 border border-slate-700 rounded-lg p-3 bg-slate-800/40">
        <div className="text-xs font-semibold text-slate-300 mb-2">Daily target</div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={dailyTargetHours}
            onChange={(e) => setDailyTargetHours(e.target.value)}
            placeholder="e.g. 8"
            className="w-28 bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
          />
          <span className="text-sm text-slate-400">hours / day</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5">
          Shows a progress ring in the sidebar while this project's timer is running. Leave blank to disable.
        </p>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={billable}
          onChange={(e) => setBillable(e.target.checked)}
          className="accent-violet-500"
        />
        <span className="text-sm text-slate-300">Billable by default</span>
      </label>

      {/* Invoice settings */}
      <div className="mb-4 border-t border-slate-700 pt-4 space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Settings</div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">Template</span>
            <select
              value={invoiceTemplate}
              onChange={(e) => {
                setInvoiceTemplate(e.target.value)
                if (e.target.value === 'facture') setInvoiceLang('fr')
                else setInvoiceLang('en')
              }}
              className="mt-1 w-full bg-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="standard">Standard</option>
              <option value="facture">French FACTURE</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Language</span>
            <select
              value={invoiceLang}
              onChange={(e) => setInvoiceLang(e.target.value)}
              className="mt-1 w-full bg-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-slate-400">From (your name on invoice)</span>
          <input
            type="text"
            value={invoiceFromName}
            onChange={(e) => setInvoiceFromName(e.target.value)}
            placeholder="e.g. Radu Severin"
            className="mt-1 w-full bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-500"
          />
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">Billed to (recipient address)</span>
          <textarea
            value={invoiceBilledTo}
            onChange={(e) => setInvoiceBilledTo(e.target.value)}
            rows={3}
            placeholder={'Client name\nStreet address\nCity'}
            className="mt-1 w-full bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-500 resize-none"
          />
        </label>

        {trackingMode === 'monthly' && (
          <label className="block">
            <span className="text-xs text-slate-400">Monthly invoice amount ({budgetCurrency})</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={invoiceFixedAmount}
              onChange={(e) => setInvoiceFixedAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="mt-1 w-full bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">Overrides hours × rate on auto-generated invoices.</p>
          </label>
        )}

        <label className="block">
          <span className="text-xs text-slate-400">Default bank account</span>
          <select
            value={invoiceBankAccountId}
            onChange={(e) => setInvoiceBankAccountId(e.target.value)}
            className="mt-1 w-full bg-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">— none —</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}{b.iban ? ` · ${b.iban.slice(-8)}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={invoiceAutoGen}
            onChange={(e) => setInvoiceAutoGen(e.target.checked)}
            className="accent-violet-500"
          />
          <span className="text-sm text-slate-300">Auto-create draft invoice when budget is reached</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors">
          Save
        </button>
      </div>
    </Modal>
  )
}
