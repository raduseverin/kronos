import React from 'react'
import { TrashIcon } from '../shared/icons'

/** Subtotal + (toggleable) tax + grand total block, right-aligned at the bottom of the doc. */
export default function InvoiceTotals({
  subtotal, taxAmount, total, fmt,
  taxOn,    setTaxOn,
  taxLabel, setTaxLabel,
  taxRate,  setTaxRate,
}) {
  return (
    <div className="flex justify-end">
      <div className="w-64 space-y-2">
        <div className="flex justify-between text-sm text-gray-500 uppercase tracking-wider text-xs font-bold border-t border-gray-200 pt-3">
          <span>Subtotal</span>
          <span className="font-normal text-gray-700 text-sm normal-case tracking-normal">{fmt(subtotal)}</span>
        </div>

        {taxOn ? (
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                className="w-16 text-sm text-gray-600 bg-transparent outline-none border-b border-gray-200 focus:border-violet-400 py-0.5"
              />
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-16 text-sm text-gray-600 bg-transparent outline-none border-b border-gray-200 focus:border-violet-400 text-right py-0.5"
              />
              <span className="text-gray-500 text-xs">%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">{fmt(taxAmount)}</span>
              <button
                onClick={() => setTaxOn(false)}
                className="text-gray-300 hover:text-red-400 transition-colors"
                aria-label="Remove tax"
              >
                <TrashIcon size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setTaxOn(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-base leading-none">+</span> Add tax
          </button>
        )}

        <div className="flex justify-between items-center border-t-2 border-gray-900 pt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total</span>
          <span className="text-xl font-bold text-gray-900">{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}
