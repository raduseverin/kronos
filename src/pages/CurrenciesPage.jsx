import React, { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import PageHeader from '../components/shared/PageHeader'
import { AlertTriangleIcon, RefreshIcon } from '../components/shared/icons'
import { currencies } from '../api'

const COMMON = ['EUR','USD','GBP','CHF','CAD','AUD','JPY','RON','NOK','SEK','DKK','PLN','CZK','HUF','SGD','HKD','NZD','CNY','ZAR','MXN','BRL','INR']

export default function CurrenciesPage() {
  const [rates, setRates]         = useState(null)
  const [base, setBase]           = useState('EUR')
  const [amount, setAmount]       = useState('1')
  const [search, setSearch]       = useState('')
  const [fetchedAt, setFetchedAt] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [stale, setStale]         = useState(false)

  useEffect(() => { loadRates(false) }, [base])

  async function loadRates(forceRefresh) {
    setLoading(true)
    setError(null)
    try {
      const result = forceRefresh
        ? await currencies.refresh(base)
        : await currencies.getRates(base)
      setRates(result.rates)
      setFetchedAt(result.fetchedAt)
      setStale(!!result.stale)
    } catch (e) {
      setError('Could not load exchange rates. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  const num = parseFloat(amount) || 0

  const allCurrencies = useMemo(() => {
    if (!rates) return []
    const all = Object.keys(rates)
    const query = search.trim().toLowerCase()
    if (!query) return all
    return all.filter((c) => c.toLowerCase().includes(query))
  }, [rates, search])

  const pinned = useMemo(() => {
    if (!rates) return []
    return COMMON.filter((c) => c !== base && rates[c] != null)
  }, [rates, base])

  const displayList = useMemo(() => {
    if (search.trim()) return allCurrencies.filter((c) => c !== base)
    return pinned
  }, [search, allCurrencies, pinned, base])

  function convert(toCurrency) {
    if (!rates || !rates[toCurrency]) return '—'
    return (num * rates[toCurrency]).toLocaleString('en-US', { maximumFractionDigits: 4 })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Currencies"
        subtitle={fetchedAt
          ? (
            <span className="inline-flex items-center gap-1.5">
              {stale && <AlertTriangleIcon size={12} className="text-amber-400" title="Rates may be stale" />}
              <span>Rates updated {format(new Date(fetchedAt), 'MMM d, HH:mm')}</span>
            </span>
          )
          : undefined}
        actions={(
          <button
            onClick={() => loadRates(true)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors duration-fast disabled:opacity-50"
          >
            <RefreshIcon spinning={loading} size={13} />
            {loading ? 'Refreshing…' : 'Refresh rates'}
          </button>
        )}
      />

      {error && (
        <div className="text-sm text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-4 py-3 flex items-center gap-2">
          <AlertTriangleIcon size={14} />
          {error}
        </div>
      )}

      {/* Converter */}
      <div className="card-elevated p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-700 text-slate-100 text-xl font-semibold rounded-md px-4 py-3 outline-none border border-slate-600 focus:border-violet-500 transition-colors duration-fast"
            />
          </div>
          <div className="shrink-0">
            <label className="text-xs text-slate-500 mb-1 block">Base currency</label>
            <select
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="bg-slate-700 text-slate-100 text-sm font-semibold rounded-md px-4 py-3 outline-none border border-slate-600 focus:border-violet-500 h-[52px] transition-colors duration-fast"
            >
              {COMMON.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search currencies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base"
        />
      </div>

      {/* Results */}
      {loading && !rates ? (
        <p className="text-sm text-slate-500 text-center py-8">Loading rates…</p>
      ) : (
        <div className="space-y-1">
          {!search && (
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1 pb-1">
              Common currencies
            </div>
          )}
          {displayList.map((c) => (
            <div
              key={c}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors duration-fast cursor-default"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-100 w-12">{c}</span>
                <span className="text-xs text-slate-500 tabular-nums">
                  1 {base} = {rates?.[c]?.toLocaleString('en-US', { maximumFractionDigits: 6 }) ?? '—'} {c}
                </span>
              </div>
              <div className="text-base font-semibold text-slate-100 tabular-nums">
                {convert(c)} <span className="text-xs font-normal text-slate-400">{c}</span>
              </div>
            </div>
          ))}
          {displayList.length === 0 && search && (
            <p className="text-sm text-slate-500 text-center py-6">No currencies match &quot;{search}&quot;.</p>
          )}
        </div>
      )}
    </div>
  )
}
