/**
 * Duration helpers (main-process twin of `src/utils/duration.js`).
 * Same API; the duplication exists only because main and renderer are
 * separate bundles. Keep the two files in sync.
 */

export const MS_PER_SEC    = 1000
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

/** Convert seconds to fractional hours. */
export const secondsToHours = (secs) => (secs || 0) / SECS_PER_HOUR

/** "01:23:45" — used by the tray title display. */
export function formatHHMMSS(secs) {
  const s = Math.max(0, Math.floor(secs || 0))
  const h = Math.floor(s / SECS_PER_HOUR).toString().padStart(2, '0')
  const m = Math.floor((s % SECS_PER_HOUR) / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${h}:${m}:${sec}`
}
