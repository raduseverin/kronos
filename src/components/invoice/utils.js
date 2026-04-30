/**
 * Invoice-editor local helpers. Date constants are evaluated at module load
 * (close enough for default values; the user can override before saving).
 *
 * Calendar/duration math is centralised in `src/utils/dateFormat.js` and
 * `src/utils/duration.js`.
 */
import { todayIso, inDaysIso, firstOfMonthIso, lastOfMonthIso } from '../../utils/dateFormat'

export const today = todayIso()
export const in30  = inDaysIso(30)

export const firstOfMonth = firstOfMonthIso
export const lastOfMonth  = lastOfMonthIso

/**
 * Round `hours` up to the nearest interval.
 * @param {number} hours
 * @param {string} intervalMinutes — '6'|'15'|'30'|'60'|'none'
 */
export function roundUpHours(hours, intervalMinutes) {
  if (!intervalMinutes || intervalMinutes === 'none') return hours
  const interval = Number(intervalMinutes) / 60
  return Math.ceil(hours / interval) * interval
}

export function newItem(overrides = {}) {
  return {
    id:          Date.now() + Math.random(),
    description: '',
    quantity:    1,
    rate:        0,
    amount:      0,
    ...overrides,
  }
}
