/**
 * Duration helpers — single source of truth for any time math involving
 * `time_entries` rows or seconds-based numbers.
 *
 * All entry helpers expect a row shaped like `{ started_at, stopped_at }` with
 * SQLite-style strings. They return `0` if `stopped_at` is missing (running
 * timer), so callers can sum freely without null guards.
 */

export const MS_PER_SEC   = 1000
export const SECS_PER_HOUR = 3600
export const MS_PER_HOUR   = SECS_PER_HOUR * MS_PER_SEC
export const SECS_PER_DAY  = 24 * SECS_PER_HOUR
export const MS_PER_DAY    = SECS_PER_DAY * MS_PER_SEC

/** Duration of a single time entry in seconds. Returns 0 if not yet stopped. */
export function entryDurationSeconds(entry) {
  if (!entry?.started_at || !entry?.stopped_at) return 0
  return (new Date(entry.stopped_at) - new Date(entry.started_at)) / MS_PER_SEC
}

/** Duration of a single time entry in fractional hours. Returns 0 if not yet stopped. */
export function entryDurationHours(entry) {
  return entryDurationSeconds(entry) / SECS_PER_HOUR
}

/** Convert seconds to fractional hours. Useful in chart data mappers. */
export const secondsToHours = (secs) => (secs || 0) / SECS_PER_HOUR

/** "01:23:45" — used by the timer/tray displays. */
export function formatHHMMSS(secs) {
  const s = Math.max(0, Math.floor(secs || 0))
  const h = Math.floor(s / SECS_PER_HOUR).toString().padStart(2, '0')
  const m = Math.floor((s % SECS_PER_HOUR) / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${h}:${m}:${sec}`
}

/** "1.5h" — single-decimal short label, used in summary cards. */
export const formatHoursLabel = (secs) => `${secondsToHours(secs).toFixed(1)}h`

/** "2h 5m" / "5m" / "30s" — compact, omits empty parts; great for entry rows. */
export function formatHumanShort(secs) {
  const s = Math.max(0, Math.floor(secs || 0))
  const h = Math.floor(s / SECS_PER_HOUR)
  const m = Math.floor((s % SECS_PER_HOUR) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${Math.max(1, s)}s`
}
