import { useEffect, useState, useCallback, useMemo } from 'react'
import { currencies } from '../../api'
import { convertWithRates } from '../../utils/fxConvert'

// Module-level cache so every component shares the same rate snapshot
// without firing duplicate IPC calls.
let cache = null            // { base, rates, fetchedAt, stale }
let inflight = null         // Promise<rates> deduplication
const subscribers = new Set()

const BASE = 'USD'          // open.er-api.com is a USD-pivot service; we always pivot via USD

async function loadRates({ force = false } = {}) {
  if (!force && cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const fn = force ? currencies.refresh : currencies.getRates
      const result = await fn(BASE)
      cache = {
        base:      result.base || BASE,
        rates:     result.rates || {},
        fetchedAt: result.fetchedAt || null,
        stale:     !!result.stale,
      }
      subscribers.forEach((cb) => cb(cache))
      return cache
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function useFx() {
  const [snap, setSnap] = useState(cache)

  useEffect(() => {
    if (!cache) loadRates().then(setSnap).catch(() => {})
    const cb = (s) => setSnap(s)
    subscribers.add(cb)
    return () => subscribers.delete(cb)
  }, [])

  const convert = useCallback((amount, from, to) => {
    if (!snap) return amount
    return convertWithRates(snap.rates, amount, from, to)
  }, [snap])

  const rateBetween = useCallback((from, to) => {
    if (!snap || !from || !to || from === to) return 1
    return convertWithRates(snap.rates, 1, from, to)
  }, [snap])

  const refresh = useCallback(() => loadRates({ force: true }).then(setSnap), [])

  return useMemo(() => ({
    ready:     !!snap,
    base:      snap?.base || BASE,
    fetchedAt: snap?.fetchedAt || null,
    stale:     !!snap?.stale,
    convert,
    rateBetween,
    refresh,
  }), [snap, convert, rateBetween, refresh])
}

/** Resets module-level FX cache — use between isolated Vitest cases. */
export function resetFxCacheForTests() {
  cache = null
  inflight = null
  subscribers.clear()
}

// Format an amount with a currency code, e.g. `1,234.56 EUR`.
// Renderer-friendly default: code-suffixed rather than locale symbol prefixed,
// because Kronos displays many currencies side by side.
export function formatMoney(amount, currency, { decimals = 2 } = {}) {
  if (amount == null || isNaN(amount)) return `— ${currency || ''}`.trim()
  const fixed = Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${fixed} ${currency || ''}`.trim()
}
