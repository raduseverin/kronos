import React, { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useFx, formatMoney } from '../shared/useFx'
import StatusPill from '../shared/StatusPill'
import { ChevronLeftIcon, ResetIcon, TrashIcon } from '../shared/icons'
import { projects as projectsApi, invoices as invoicesApi, timer as timerApi } from '../../api'
import { entryDurationHours } from '../../utils/duration'
import { budgetCurOf, displayCurOf } from './utils'
import AddHoursModal from './AddHoursModal'

/**
 * Project detail view — replaces the projects list while focused on one
 * project. Shows period summary, progress, entries, and invoice history.
 */
export default function ProjectDetail({ project, onBack, onNavigate, onEdit }) {
  const fx = useFx()
  const [summary,      setSummary]      = useState(null)
  const [entries,      setEntries]      = useState([])
  const [invoices,     setInvoices]     = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { loadAll() }, [project.id])

  async function loadAll() {
    const [s, inv] = await Promise.all([
      projectsApi.periodSummary(project.id),
      invoicesApi.listForProject(project.name).catch(() => []),
    ])
    setSummary(s)
    setInvoices(inv || [])
    if (s) {
      const e = await projectsApi.entries(project.id, s.periodStart)
      setEntries(e)
    }
  }

  async function handleReset() {
    if (!confirm("Reset the hour count for this period?\n\nExisting entries are kept but won't count toward the current period.")) return
    const s = await projectsApi.resetPeriod(project.id)
    setSummary(s)
    const e = await projectsApi.entries(project.id, s.periodStart)
    setEntries(e)
  }

  async function handleDeleteEntry(id) {
    await timerApi.delete(id)
    loadAll()
  }

  const mode        = summary?.trackingMode || 'monthly'
  const budget      = summary?.budgetAmount || 0
  const usedHours   = summary?.usedHours    || 0
  const usedAmount  = summary?.usedAmount   || 0
  const pct         = mode === 'budget' && budget > 0 ? Math.min(usedHours ? usedAmount / budget : 0, 1) : null
  const budgetAlert = pct !== null && pct >= 0.9

  const bCur = budgetCurOf(project)
  const dCur = displayCurOf(project)
  const showConverted   = bCur !== dCur
  const usedAmountDisp  = fx.convert(usedAmount, bCur, dCur)
  const budgetDisp      = fx.convert(budget,     bCur, dCur)

  const barColor = pct === null ? 'bg-violet-500'
    : pct >= 1   ? 'bg-red-500'
    : pct >= 0.9 ? 'bg-amber-400'
    : pct >= 0.7 ? 'bg-violet-500'
    : 'bg-emerald-500'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors duration-fast"
        >
          <ChevronLeftIcon size={14} /> All Projects
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors duration-fast"
          >
            Edit Project
          </button>
          {budgetAlert && (
            <button
              onClick={() => onNavigate?.('invoices', { preProject: project })}
              className="text-xs px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors duration-fast font-medium"
            >
              Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="bg-slate-800 rounded-xl px-6 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          <h2 className="text-lg font-semibold text-slate-100">{project.name}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${mode === 'budget' ? 'bg-violet-900/50 text-violet-300' : 'bg-slate-700 text-slate-400'}`}>
            {mode === 'budget' ? `Budget · ${formatMoney(budget, bCur, { decimals: 0 })}` : 'Monthly'}
          </span>
          {showConverted && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400" title="Display currency">
              View · {dCur}
            </span>
          )}
          {project.client_name && (
            <span className="text-xs text-slate-500">{project.client_name}</span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Hours tracked" value={usedHours.toFixed(2) + 'h'} />
          {project.hourly_rate
            ? <Stat
                label="Amount earned"
                value={formatMoney(usedAmountDisp, dCur)}
                hint={showConverted ? `≈ ${formatMoney(usedAmount, bCur)}` : null}
                highlight={budgetAlert} />
            : <Stat label="Hourly rate" value="Not set" dim />
          }
          {mode === 'budget'
            ? <Stat label="Budget used" value={pct !== null ? `${Math.round(pct * 100)}%` : '—'} highlight={budgetAlert} />
            : <Stat label="Period" value={summary?.periodStart ? format(parseISO(summary.periodStart), 'MMM yyyy') : '—'} />
          }
        </div>

        {/* Progress bar */}
        {summary && (
          <div className="space-y-1">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              {mode === 'budget' && budget > 0 ? (
                <div className={`h-full rounded-full transition-all ${barColor}`}
                     style={{ width: `${Math.min((pct || 0) * 100, 100)}%` }} />
              ) : (
                <div className="h-full rounded-full bg-violet-500 transition-all"
                     style={{ width: `${Math.min((usedHours / 160) * 100, 100)}%` }} />
              )}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                Since {summary.periodStart ? format(parseISO(summary.periodStart), 'MMM d, yyyy') : '—'}
              </span>
              {mode === 'budget' && (
                <span>
                  {formatMoney(usedAmountDisp, dCur)} / {formatMoney(budgetDisp, dCur, { decimals: 0 })}
                  {showConverted && (
                    <span className="ml-2 text-slate-600">
                      · {formatMoney(budget, bCur, { decimals: 0 })} budget
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reset + Add */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-amber-400 transition-colors duration-fast flex items-center gap-1.5"
          >
            <ResetIcon size={12} /> Reset count
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors duration-fast font-medium"
          >
            + Add Hours
          </button>
        </div>
      </div>

      {/* Entries list */}
      <div className="space-y-1">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No entries in this period.</p>
        ) : (
          entries.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
              hourlyRate={project.hourly_rate}
              budgetCurrency={bCur}
              displayCurrency={dCur}
              onDelete={() => handleDeleteEntry(e.id)}
            />
          ))
        )}
      </div>

      {/* Invoice history */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Invoice History</div>
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">No invoices generated yet.</p>
        ) : (
          invoices.map((inv) => (
            <InvoiceHistoryRow
              key={inv.id}
              invoice={inv}
              onView={() => onNavigate?.('invoices', { editInvoice: inv })}
            />
          ))
        )}
      </div>

      {showAddModal && (
        <AddHoursModal
          onSave={async (data) => {
            await timerApi.addManual({ ...data, projectId: project.id })
            setShowAddModal(false)
            loadAll()
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

function Stat({ label, value, hint, highlight, dim }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold ${dim ? 'text-slate-600' : highlight ? 'text-amber-400' : 'text-slate-100'}`}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
    </div>
  )
}

function EntryRow({ entry, hourlyRate, budgetCurrency, displayCurrency, onDelete }) {
  const fx     = useFx()
  const hours  = entryDurationHours(entry)
  // hourlyRate is denominated in the project's budget currency.
  const amount = hourlyRate ? hours * hourlyRate : null
  const amountDisplay = amount !== null
    ? fx.convert(amount, budgetCurrency, displayCurrency)
    : null

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors">
      <div className="text-xs text-slate-500 w-20 shrink-0">
        {format(parseISO(entry.started_at), 'MMM d')}
      </div>
      <div className="text-xs text-slate-500 w-28 shrink-0 font-mono">
        {format(parseISO(entry.started_at), 'HH:mm')} – {format(parseISO(entry.stopped_at), 'HH:mm')}
      </div>
      <div className="flex-1 min-w-0 text-sm text-slate-300 truncate">
        {entry.description || <span className="text-slate-600 italic">No description</span>}
      </div>
      <div className="text-sm font-medium text-slate-300 shrink-0 w-14 text-right">
        {hours.toFixed(2)}h
      </div>
      {amount !== null && (
        <div
          className="text-sm text-slate-400 shrink-0 w-24 text-right"
          title={budgetCurrency !== displayCurrency
            ? `${formatMoney(amount, budgetCurrency)} (project budget currency)`
            : undefined}
        >
          {formatMoney(amountDisplay, displayCurrency)}
        </div>
      )}
      <button
        onClick={onDelete}
        aria-label="Delete entry"
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity duration-fast shrink-0 p-1 rounded-md"
      >
        <TrashIcon size={12} />
      </button>
    </div>
  )
}

function InvoiceHistoryRow({ invoice: inv, onView }) {
  const subtotal = (inv.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const taxAmt   = inv.tax_rate ? subtotal * inv.tax_rate / 100 : 0
  const total    = subtotal + taxAmt

  return (
    <div
      className="group flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors duration-fast cursor-pointer"
      onClick={onView}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200">#{inv.invoice_number}</div>
        {inv.billed_to && (
          <div className="text-xs text-slate-500 truncate">{inv.billed_to.split('\n')[0]}</div>
        )}
      </div>
      <div className="text-xs text-slate-500 shrink-0">
        {inv.invoice_date ? format(new Date(inv.invoice_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
      </div>
      <div className="text-sm font-medium text-slate-300 shrink-0 w-24 text-right tabular-nums">
        {total.toFixed(2)} {inv.currency || 'USD'}
      </div>
      <StatusPill status={inv.status} />
      <div className="opacity-0 group-hover:opacity-100 text-xs text-violet-400 hover:text-violet-300 shrink-0 transition-opacity duration-fast">
        View →
      </div>
    </div>
  )
}
