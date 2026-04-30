import { describe, it, expect } from 'vitest'
import { convertWithRates } from './fxConvert.js'

/** Sample USD-pivot map: 1 USD == r[code] units of code. */
const SAMPLE = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150 }

describe('convertWithRates', () => {
  it('returns the same amount when currencies match', () => {
    expect(convertWithRates(SAMPLE, 42, 'EUR', 'EUR')).toBe(42)
  })

  it('returns the amount unchanged when a rate is missing', () => {
    expect(convertWithRates(SAMPLE, 100, 'EUR', 'CHF')).toBe(100)
  })

  it('converts USD → EUR via pivot (100 USD → 92 EUR at these rates)', () => {
    expect(convertWithRates(SAMPLE, 100, 'USD', 'EUR')).toBeCloseTo(92, 10)
  })

  it('converts EUR → USD (inverse)', () => {
    const usd = convertWithRates(SAMPLE, 92, 'EUR', 'USD')
    expect(usd).toBeCloseTo(100, 10)
  })

  it('handles cross rates EUR → JPY without going through caller math', () => {
    // 100 EUR → USD → JPY : 100 / 0.92 * 150
    const jpy = convertWithRates(SAMPLE, 100, 'EUR', 'JPY')
    expect(jpy).toBeCloseTo((100 / 0.92) * 150, 5)
  })

  it('preserves NaN / null passthrough contract', () => {
    expect(convertWithRates(SAMPLE, null, 'USD', 'EUR')).toBeNull()
    expect(convertWithRates(SAMPLE, NaN, 'USD', 'EUR')).toBeNaN()
  })
})
