import React from 'react'
import { roundUpHours } from './utils'

/**
 * Inline panel under the line-items table for pulling billable hours from
 * the time-tracking database into a new line item.
 */
export default function TimeImportPanel({
  importFrom,    setImportFrom,
  importTo,      setImportTo,
  importProject, setImportProject,
  importRate,    setImportRate,
  importSummary,
  invoiceRounding,
  projects,
  currency,
  onPreview,
  onApply,
  onCancel,
}) {
  return (
    <div className="mt-4 border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Import from Time Tracking
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <input
            type="date"
            value={importFrom}
            onChange={(e) => setImportFrom(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 transition-colors bg-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <input
            type="date"
            value={importTo}
            onChange={(e) => setImportTo(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 transition-colors bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Project (optional)</label>
          <select
            value={importProject}
            onChange={(e) => setImportProject(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 transition-colors bg-white text-gray-800"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Hourly rate ({currency})</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={importRate}
            onChange={(e) => setImportRate(e.target.value)}
            placeholder="50.00"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 transition-colors bg-white placeholder:text-gray-300"
          />
        </div>
      </div>

      {importSummary && (() => {
        const raw     = importSummary.totalHours
        const billed  = roundUpHours(raw, invoiceRounding)
        const rounded = invoiceRounding && invoiceRounding !== 'none' && billed !== raw
        return (
          <div className="text-sm text-gray-700 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3">
            <span className="font-medium">{raw.toFixed(2)}h</span> tracked
            {rounded && (
              <span className="ml-1 text-violet-600 font-medium">→ {billed.toFixed(2)}h billed</span>
            )}
            {importSummary.entryCount > 0 && (
              <span className="text-gray-500"> ({importSummary.entryCount} entries)</span>
            )}
            {importRate && (
              <span className="ml-2 font-medium text-violet-700">
                = {(billed * Number(importRate)).toFixed(2)} {currency}
              </span>
            )}
          </div>
        )
      })()}

      <div className="flex items-center gap-2">
        <button
          onClick={onPreview}
          className="px-4 py-2 text-sm border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors bg-white"
        >
          Preview
        </button>
        <button
          onClick={onApply}
          disabled={!importSummary || importSummary.totalHours <= 0}
          className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-40 font-medium"
        >
          Add Line Item
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
