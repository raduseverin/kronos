/**
 * Light date helpers used across pages for default values / quick formatting.
 * Wraps date-fns; everything is timezone-LOCAL (matches how the database
 * stores `started_at` / `stopped_at`).
 */
import { format, addDays } from 'date-fns'

const ISO_DATE = 'yyyy-MM-dd'

/** ISO date for "today" in the local timezone, e.g. '2026-04-29'. */
export const todayIso = () => format(new Date(), ISO_DATE)

/** ISO date `n` days from now (positive or negative). */
export const inDaysIso = (n) => format(addDays(new Date(), n), ISO_DATE)

/** ISO date for the first day of the current month. */
export function firstOfMonthIso() {
  const d = new Date()
  return format(new Date(d.getFullYear(), d.getMonth(), 1), ISO_DATE)
}

/** ISO date for the last day of the current month. */
export function lastOfMonthIso() {
  const d = new Date()
  return format(new Date(d.getFullYear(), d.getMonth() + 1, 0), ISO_DATE)
}
