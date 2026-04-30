import React from 'react'
import { ChevronLeftIcon } from '../shared/icons'

/** Header strip above the invoice document — back link, status, Save, Export. */
export default function InvoiceToolbar({
  onBack,
  status, onStatusChange,
  onSave,    saving,
  onExport,  exporting,
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
      >
        <ChevronLeftIcon size={14} /> All Invoices
      </button>
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-violet-500"
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onExport}
          disabled={exporting}
          className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
    </div>
  )
}
