import React from 'react'

/**
 * Settings page section — uppercase title above a `card-surface` container
 * with hairline dividers between rows.
 */
export default function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="card-surface px-4 py-2 divide-y divide-slate-700/40">
        {children}
      </div>
    </div>
  )
}
