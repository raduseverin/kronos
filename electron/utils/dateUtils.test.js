import { describe, it, expect } from 'vitest'
import {
  formatDateFr,
  firstDayOfMonth,
  lastDayOfMonth,
  buildDescription,
} from './dateUtils.js'

describe('formatDateFr', () => {
  it('uses "1er" for the first day of the month', () => {
    expect(formatDateFr('2026-03-01')).toBe('1er mars 2026')
  })

  it('uses a plain day number elsewhere', () => {
    expect(formatDateFr('2026-04-15')).toBe('15 avril 2026')
  })
})

describe('firstDayOfMonth / lastDayOfMonth', () => {
  it('firstDayOfMonth returns YYYY-MM-01', () => {
    expect(firstDayOfMonth('2026-07-20')).toBe('2026-07-01')
  })

  it('lastDayOfMonth returns a date in the same month (UTC quirk in prod uses toISOString)', () => {
    const feb2026 = lastDayOfMonth('2026-02-10')
    expect(feb2026).toMatch(/^2026-02-/)
    const day = parseInt(feb2026.slice(-2), 10)
    expect(day).toBeGreaterThanOrEqual(27)
    expect(day).toBeLessThanOrEqual(29)

    const feb2024 = lastDayOfMonth('2024-02-10')
    expect(feb2024).toMatch(/^2024-02-/)
    const dayLeap = parseInt(feb2024.slice(-2), 10)
    expect(dayLeap).toBeGreaterThanOrEqual(27)
    expect(dayLeap).toBeLessThanOrEqual(29)
  })
})

describe('buildDescription', () => {
  it('builds a French sentence with formatted dates', () => {
    const s = buildDescription('fr', 'Alice', '2026-04-01', '2026-04-30')
    expect(s).toContain('Alice')
    expect(s).toContain('avril')
    expect(s).toMatch(/^Travail de bureau/)
  })

  it('builds an English sentence when lang is not fr', () => {
    const s = buildDescription('en', 'Bob', '2026-04-01', '2026-04-30')
    expect(s).toContain('Bob')
    expect(s).toContain('Development work')
  })
})
