import React from 'react'
import { TrashIcon } from '../shared/icons'

/**
 * Editable line-items table for the standard invoice template, plus the
 * "Add custom charge" / "Import from time tracking" trigger row beneath.
 *
 * Pure presentational — all state lives in the parent.
 */
export default function LineItemsTable({
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onShowImport,
}) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-xs font-bold uppercase tracking-wider text-gray-400 pb-2">Description</th>
            <th className="text-right text-xs font-bold uppercase tracking-wider text-gray-400 pb-2 w-24">Hours</th>
            <th className="text-right text-xs font-bold uppercase tracking-wider text-gray-400 pb-2 w-28">Rate</th>
            <th className="text-right text-xs font-bold uppercase tracking-wider text-gray-400 pb-2 w-28">Amount</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 group">
              <td className="py-2 pr-3">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                  placeholder="Description…"
                  className="w-full text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-violet-400 transition-colors py-0.5 placeholder:text-gray-300"
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
                  className="w-full text-right text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-violet-400 transition-colors py-0.5"
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => onUpdateItem(item.id, 'rate', e.target.value)}
                  placeholder="0.00"
                  className="w-full text-right text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-violet-400 transition-colors py-0.5 placeholder:text-gray-300"
                />
              </td>
              <td className="py-2 text-right text-sm text-gray-800 whitespace-nowrap pr-1">
                {Number(item.amount || 0).toFixed(2)}
              </td>
              <td className="py-2">
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                  aria-label="Remove line item"
                >
                  <TrashIcon size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Action row */}
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add custom charge
        </button>
        <button
          onClick={onShowImport}
          className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-500 transition-colors"
        >
          <span className="text-base leading-none">⊕</span> Import from time tracking
        </button>
      </div>
    </div>
  )
}
