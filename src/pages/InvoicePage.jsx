import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import InvoiceEditor from '../components/invoice/InvoiceEditor'
import BankAccountsModal from '../components/invoice/BankAccountsModal'
import PageHeader from '../components/shared/PageHeader'
import EmptyState from '../components/shared/EmptyState'
import { StatusSelect } from '../components/shared/StatusPill'
import { Skeleton } from '../components/shared/Skeleton'
import { TrashIcon, InvoiceIcon } from '../components/shared/icons'
import { invoices } from '../api'

export default function InvoicePage({ navContext }) {
  const [invoices,      setInvoices]      = useState([])
  const [editing,       setEditing]       = useState(null)   // null | 'new' | invoice object
  const [preProject,    setPreProject]    = useState(null)
  const [showBankModal, setShowBankModal] = useState(false)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (navContext?.preProject) {
      setPreProject(navContext.preProject)
      setEditing('new')
    } else if (navContext?.editInvoice) {
      setEditing(navContext.editInvoice)
    }
  }, [navContext])

  async function load() {
    setLoading(true)
    try { setInvoices(await invoices.list()) }
    finally { setLoading(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this invoice?')) return
    await invoices.delete(id)
    load()
  }

  async function handleStatusChange(id, status) {
    await invoices.update(id, { status })
    load()
  }

  function handleSaved(invoice) {
    load()
    setEditing(invoice)
  }

  // ── Editor view ──────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <InvoiceEditor
        invoice={editing === 'new' ? null : editing}
        preProject={editing === 'new' ? preProject : null}
        onSave={handleSaved}
        onBack={() => { setEditing(null); setPreProject(null); load() }}
      />
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Create and manage client invoices"
        actions={(
          <>
            <button
              onClick={() => setShowBankModal(true)}
              className="px-3 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors duration-fast"
            >
              Bank Accounts
            </button>
            <button
              onClick={() => setEditing('new')}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast font-medium"
            >
              + New Invoice
            </button>
          </>
        )}
      />

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_104px_104px_120px_140px] gap-4 items-center px-4 py-3 rounded-lg bg-slate-800/40">
              <Skeleton w="55%" h={14} />
              <Skeleton w={80} h={12} />
              <Skeleton w={80} h={12} />
              <Skeleton w={90} h={12} />
              <Skeleton w={70} h={20} rounded="full" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<InvoiceIcon size={48} />}
          title="No invoices yet"
          body="Create an invoice manually, or set a project's auto-generate flag to draft one when its budget is reached."
          action={(
            <button
              onClick={() => setEditing('new')}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast font-medium"
            >
              Create your first invoice
            </button>
          )}
        />
      ) : (
        <div className="space-y-1">
          {/* Header — column widths fixed to match rows. */}
          <div className="grid grid-cols-[1fr_104px_104px_120px_140px] gap-4 px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Invoice</span>
            <span className="text-right">Date</span>
            <span className="text-right">Due</span>
            <span className="text-right">Total</span>
            <span className="text-center">Status</span>
          </div>

          {invoices.map((inv) => {
            const subtotal = (inv.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
            const taxAmt   = inv.tax_rate ? subtotal * inv.tax_rate / 100 : 0
            const total    = subtotal + taxAmt

            return (
              <div
                key={inv.id}
                className="group grid grid-cols-[1fr_104px_104px_120px_140px] gap-4 items-center px-4 py-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors duration-fast cursor-pointer"
                onClick={() => setEditing(inv)}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">
                    #{inv.invoice_number}
                  </div>
                  {inv.billed_to && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {inv.billed_to.split('\n')[0]}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500 text-right whitespace-nowrap tabular-nums">
                  {inv.invoice_date ? format(new Date(inv.invoice_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                </div>

                <div className="text-xs text-slate-500 text-right whitespace-nowrap tabular-nums">
                  {inv.due_date ? format(new Date(inv.due_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                </div>

                <div className="text-sm font-medium text-slate-200 text-right whitespace-nowrap tabular-nums">
                  {total.toFixed(2)} {inv.currency || 'USD'}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <StatusSelect
                    status={inv.status}
                    onChange={(next) => handleStatusChange(inv.id, next)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(inv.id) }}
                    aria-label="Delete invoice"
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity duration-fast shrink-0 p-1 rounded-md"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showBankModal && (
        <BankAccountsModal onClose={() => setShowBankModal(false)} />
      )}
    </div>
  )
}
