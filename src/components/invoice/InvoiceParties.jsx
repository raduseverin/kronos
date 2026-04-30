import React from 'react'
import { format } from 'date-fns'
import { formatMoney } from '../shared/useFx'
import { COMMON_CURRENCIES } from '../../constants/currencies'

/**
 * Two-column block: Billed-to text + Pay-to (bank account) + currency
 * picker + FX banner (when invoice currency differs from the project's
 * budget currency).
 */
export default function InvoiceParties({
  billedTo,    setBilledTo,
  currency,    setCurrency,
  bankAccountId,
  selectedBank,
  payToText,
  onOpenBankModal,
  // FX
  sourceCurrency, fxIsActive,
  effFxRate, fxRateLocked, setFxRateLocked,
  fxFetchedAt,
  sourceTotal,
}) {
  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Billed to */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Billed to:</div>
        <textarea
          value={billedTo}
          onChange={(e) => setBilledTo(e.target.value)}
          placeholder="Client name, address…"
          rows={5}
          className="w-full text-sm text-gray-700 bg-transparent outline-none border border-gray-200 rounded-lg px-3 py-2 resize-none focus:border-violet-400 placeholder:text-gray-300 transition-colors"
        />
      </div>

      {/* Pay to + currency + FX */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Pay to:</div>
          <button
            onClick={onOpenBankModal}
            className="text-xs text-violet-600 hover:text-violet-500 transition-colors"
          >
            {bankAccountId ? 'Change' : 'Select account'}
          </button>
        </div>

        {selectedBank ? (
          <div className="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 min-h-[110px] whitespace-pre-wrap leading-relaxed">
            {payToText}
          </div>
        ) : (
          <button
            onClick={onOpenBankModal}
            className="w-full min-h-[110px] border border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
          >
            + Select or add a bank account
          </button>
        )}

        <div className="mt-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Invoice currency</div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className="w-32 text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-violet-400 transition-colors bg-white"
          >
            {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {fxIsActive && (
          <FxBanner
            sourceCurrency={sourceCurrency}
            currency={currency}
            effFxRate={effFxRate}
            fxRateLocked={fxRateLocked}
            setFxRateLocked={setFxRateLocked}
            fxFetchedAt={fxFetchedAt}
            sourceTotal={sourceTotal}
          />
        )}
      </div>
    </div>
  )
}

/** Inline FX context appearing under the currency picker. Editable rate, lockable. */
function FxBanner({
  sourceCurrency, currency,
  effFxRate, fxRateLocked, setFxRateLocked,
  fxFetchedAt, sourceTotal,
}) {
  const formattedRate = effFxRate
    ? Number(effFxRate).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
    : ''

  return (
    <div className="mt-3 p-3 rounded-lg border border-violet-200 bg-violet-50 text-xs space-y-1.5">
      <div className="font-bold uppercase tracking-wider text-violet-700">
        FX · {sourceCurrency} → {currency}
      </div>
      <div className="text-violet-900">
        Project budget currency: <b>{sourceCurrency}</b> · Invoice currency: <b>{currency}</b>
      </div>
      <div className="flex items-center gap-2 text-violet-800">
        <span>Rate</span>
        <span className="font-mono">1 {sourceCurrency} =</span>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={formattedRate}
          onChange={(e) => setFxRateLocked(e.target.value ? Number(e.target.value) : null)}
          className="w-24 text-sm border border-violet-300 rounded px-2 py-0.5 bg-white outline-none focus:border-violet-500 font-mono"
        />
        <span className="font-mono">{currency}</span>
        {fxRateLocked != null
          ? <span className="text-violet-600">· locked {fxFetchedAt ? format(new Date(fxFetchedAt), 'MMM d') : ''}</span>
          : (
            <button
              type="button"
              onClick={() => setFxRateLocked(null)}
              className="text-violet-600 hover:text-violet-800 underline"
            >
              live rate
            </button>
          )}
      </div>
      <div className="text-violet-700">
        Total in source: <b>{formatMoney(sourceTotal, sourceCurrency)}</b>
      </div>
    </div>
  )
}
