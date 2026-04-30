import React from 'react'
import { newItem } from './utils'

/**
 * FACTURE-template body. Replaces the line-items table on the simpler
 * French invoice format: from/lang + period + free-text description +
 * one fixed amount.
 */
export default function FactureBody({
  fromName,    setFromName,
  lang,        setLang,
  periodStart, setPeriodStart,
  periodEnd,   setPeriodEnd,
  items,       setItems,
  fixedAmount, setFixedAmount,
  currency,
  subtotal,
}) {
  const description = items[0]?.description || ''

  function setDescription(text) {
    setItems((prev) => {
      if (prev.length === 0) return [newItem({ description: text })]
      return prev.map((it, i) => (i === 0 ? { ...it, description: text } : it))
    })
  }

  function setAmount(rawValue) {
    setFixedAmount(rawValue)
    const amt = parseFloat(rawValue) || 0
    setItems((prev) => {
      if (prev.length === 0) return [newItem({ amount: amt, rate: amt, quantity: 1 })]
      return prev.map((it, i) =>
        i === 0 ? { ...it, amount: amt, rate: amt, quantity: 1 } : it
      )
    })
  }

  return (
    <>
      {/* From + period grid */}
      <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">From (sender)</div>
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Your name"
            className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Language</div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Period start</div>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Period end</div>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400"
          />
        </div>
      </div>

      {/* Description + total */}
      <div className="space-y-4 border-t border-gray-100 pt-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={lang === 'fr'
              ? `Travail de bureau en tant que développeur, ${fromName || 'Radu Severin'}, du 1er avril 2026 au 30 avril 2026.`
              : `Development work, ${fromName || 'Your Name'}, from April 1 to April 30, 2026.`}
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-violet-400 placeholder:text-gray-300"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total amount</div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fixedAmount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500.00"
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400"
            />
          </div>
          <div className="shrink-0 text-2xl font-bold text-gray-900 mt-5">
            {(parseFloat(fixedAmount) || subtotal).toFixed(2)} {currency}
          </div>
        </div>
      </div>
    </>
  )
}
