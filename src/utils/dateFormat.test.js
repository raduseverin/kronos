import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { todayIso, inDaysIso, firstOfMonthIso, lastOfMonthIso } from './dateFormat.js'

describe('dateFormat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T14:30:00+02:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('todayIso matches the faked local calendar day', () => {
    expect(todayIso()).toBe('2026-04-15')
  })

  it('inDaysIso adds calendar days in local time', () => {
    expect(inDaysIso(30)).toBe('2026-05-15')
    expect(inDaysIso(-14)).toBe('2026-04-01')
  })

  it('firstOfMonthIso / lastOfMonthIso for April 2026', () => {
    expect(firstOfMonthIso()).toBe('2026-04-01')
    expect(lastOfMonthIso()).toBe('2026-04-30')
  })
})
