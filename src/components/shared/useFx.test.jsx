// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFx, resetFxCacheForTests, formatMoney } from './useFx.js'

const { getRates } = vi.hoisted(() => ({
  getRates: vi.fn(),
}))

vi.mock('../../api', () => ({
  currencies: {
    getRates,
    refresh: vi.fn(),
  },
}))

describe('formatMoney', () => {
  it('returns an em-dash style placeholder when amount is invalid', () => {
    expect(formatMoney(null, 'EUR')).toMatch(/^—/)
    expect(formatMoney(NaN, 'EUR')).toMatch(/^—/)
  })

  it('formats numeric amount and suffixes the currency code', () => {
    const s = formatMoney(1234.5, 'USD', { decimals: 2 })
    expect(s).toContain('USD')
    expect(s).toMatch(/1[,.]234/)
  })
})

describe('useFx', () => {
  beforeEach(() => {
    resetFxCacheForTests()
    getRates.mockResolvedValue({
      base: 'USD',
      rates: { USD: 1, EUR: 0.92 },
      fetchedAt: '2026-01-01T00:00:00Z',
    })
  })

  afterEach(() => {
    resetFxCacheForTests()
  })

  it('loads FX on mount via currencies.getRates and exposes convert / rateBetween', async () => {
    const { result } = renderHook(() => useFx())

    await waitFor(() => {
      expect(result.current.ready).toBe(true)
    })

    expect(getRates).toHaveBeenCalled()
    expect(result.current.convert(100, 'USD', 'EUR')).toBeCloseTo(92, 5)
    expect(result.current.rateBetween('USD', 'EUR')).toBeCloseTo(0.92, 5)
  })
})
