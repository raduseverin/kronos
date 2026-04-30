import React from 'react'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function makeIcon(viewBox, paths, override = {}) {
  return function Icon({ size = 16, className, style, title, ...rest }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        className={className}
        style={style}
        role={title ? 'img' : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        {...base}
        {...override}
        {...rest}
      >
        {paths}
      </svg>
    )
  }
}

// ── Navigation & layout ──────────────────────────────────────────────────────

// Modern clepsydra (hourglass) — the Kronos brand mark.
//
// The path mirrors the bell-curved silhouette rendered procedurally for the
// macOS tray icon (electron/utils/imageUtils.js). Each side is a quadratic
// Bezier whose control point lies outside the straight diagonal so the cup
// walls flare gently outward, producing a soft belly that meets the opposite
// side in a clean X at the neck (12, 12). Stroke linecap/linejoin are 'round'
// from the icon module defaults — keeps the bar caps and crossing crisp at
// any size.
export const HourglassIcon = makeIcon('0 0 24 24', (
  <path d="M 4 4 L 20 4 Q 18.4 8 12 12 Q 18.4 16 20 20 L 4 20 Q 5.6 16 12 12 Q 5.6 8 4 4 Z" />
))

export const TimerIcon = makeIcon('0 0 24 24', (
  <>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 15" />
  </>
))

export const GridIcon = makeIcon('0 0 24 24', (
  <>
    <rect x="3"  y="3"  width="7" height="7" />
    <rect x="14" y="3"  width="7" height="7" />
    <rect x="3"  y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </>
))

export const ChartIcon = makeIcon('0 0 24 24', (
  <>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="14" />
    <line x1="2"  y1="20" x2="22" y2="20" />
  </>
))

export const FolderIcon = makeIcon('0 0 24 24', (
  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
))

export const InvoiceIcon = makeIcon('0 0 24 24', (
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </>
))

export const CurrencyIcon = makeIcon('0 0 24 24', (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
    <line x1="12" y1="6"  x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="18" />
  </>
))

export const GearIcon = makeIcon('0 0 24 24', (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>
))

// ── Player ───────────────────────────────────────────────────────────────────

export const PlayIcon = makeIcon('0 0 24 24', (
  <polygon points="5 3 19 12 5 21 5 3" />
), { fill: 'currentColor', stroke: 'none' })

export const StopIcon = makeIcon('0 0 24 24', (
  <rect x="5" y="5" width="14" height="14" rx="2" />
), { fill: 'currentColor', stroke: 'none' })

export const BookmarkIcon = makeIcon('0 0 24 24', (
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
))

export const PauseIcon = makeIcon('0 0 24 24', (
  <>
    <rect x="6"  y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </>
), { fill: 'currentColor', stroke: 'none' })

// ── Glyphs ───────────────────────────────────────────────────────────────────

export const SparkleIcon = makeIcon('0 0 24 24', (
  <>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
  </>
))

export const SpinnerIcon = function SpinnerIcon({ size = 16, className = '', ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      aria-hidden="true"
      {...base}
      {...rest}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export const RefreshIcon = function RefreshIcon({ spinning = false, size = 13, className = '', ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`${spinning ? 'animate-spin' : ''} ${className}`}
      aria-hidden="true"
      {...base}
      {...rest}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  )
}

export const ChevronLeftIcon = makeIcon('0 0 24 24', (
  <polyline points="15 18 9 12 15 6" />
))

export const ChevronRightIcon = makeIcon('0 0 24 24', (
  <polyline points="9 18 15 12 9 6" />
))

export const ChevronDownIcon = makeIcon('0 0 24 24', (
  <polyline points="6 9 12 15 18 9" />
))

export const PencilIcon = makeIcon('0 0 24 24', (
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
))

export const TrashIcon = makeIcon('0 0 24 24', (
  <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </>
))

export const XIcon = makeIcon('0 0 24 24', (
  <>
    <line x1="18" y1="6"  x2="6"  y2="18" />
    <line x1="6"  y1="6"  x2="18" y2="18" />
  </>
), { strokeWidth: 2.25 })

export const CheckIcon = makeIcon('0 0 24 24', (
  <polyline points="20 6 9 17 4 12" />
))

export const PlusIcon = makeIcon('0 0 24 24', (
  <>
    <line x1="12" y1="5"  x2="12" y2="19" />
    <line x1="5"  y1="12" x2="19" y2="12" />
  </>
))

export const MinusIcon = makeIcon('0 0 24 24', (
  <line x1="5" y1="12" x2="19" y2="12" />
))

export const AlertTriangleIcon = makeIcon('0 0 24 24', (
  <>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9"  x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>
))

export const ResetIcon = makeIcon('0 0 24 24', (
  <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
  </>
))

export const SearchIcon = makeIcon('0 0 24 24', (
  <>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
))

// ── Theme picker ─────────────────────────────────────────────────────────────

export const SunIcon = makeIcon('0 0 24 24', (
  <>
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2"    x2="12"   y2="4" />
    <line x1="12" y1="20"   x2="12"   y2="22" />
    <line x1="4.93"  y1="4.93"  x2="6.34"  y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
    <line x1="2"  y1="12"   x2="4"    y2="12" />
    <line x1="20" y1="12"   x2="22"   y2="12" />
    <line x1="4.93"  y1="19.07" x2="6.34"  y2="17.66" />
    <line x1="17.66" y1="6.34"  x2="19.07" y2="4.93" />
  </>
))

export const MoonIcon = makeIcon('0 0 24 24', (
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
))

export const MonitorIcon = makeIcon('0 0 24 24', (
  <>
    <rect x="2" y="4" width="20" height="13" rx="2" />
    <line x1="8" y1="21"  x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>
))

