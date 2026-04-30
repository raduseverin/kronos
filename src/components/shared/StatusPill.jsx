import React from 'react'

/**
 * Single source of truth for invoice + entry status colors.
 * Tones are subtle, surface-tinted; text carries the meaning.
 */
const TONES = {
  draft:   'bg-slate-700/60   text-slate-300   border-slate-600',
  sent:    'bg-blue-900/40    text-blue-300    border-blue-800',
  paid:    'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  overdue: 'bg-red-900/40     text-red-300     border-red-800',

  success: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  info:    'bg-blue-900/40    text-blue-300    border-blue-800',
  warning: 'bg-amber-900/40   text-amber-300   border-amber-800',
  danger:  'bg-red-900/40     text-red-300     border-red-800',
  neutral: 'bg-slate-700/60   text-slate-300   border-slate-600',
  accent:  'bg-violet-900/50  text-violet-300  border-violet-800',
}

export default function StatusPill({ status = 'neutral', children, size = 'md', className = '' }) {
  const tone = TONES[status] || TONES.neutral
  const sizeClasses =
    size === 'sm' ? 'text-[10px] px-2 py-0.5' :
    size === 'lg' ? 'text-xs px-3 py-1'       :
                    'text-xs px-2.5 py-0.5'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium capitalize ${sizeClasses} ${tone} ${className}`}
    >
      {children ?? status}
    </span>
  )
}

/** Status select that looks like a pill (used in invoice list). */
export function StatusSelect({ status, onChange, options = ['draft', 'sent', 'paid'], className = '' }) {
  const tone = TONES[status] || TONES.neutral
  return (
    <select
      value={status}
      onChange={(e) => onChange?.(e.target.value)}
      className={`text-xs rounded-full px-2.5 py-1 border outline-none cursor-pointer font-medium capitalize transition-colors duration-fast ${tone} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}
