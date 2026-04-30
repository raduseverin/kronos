import React from 'react'

/**
 * Standard page chrome — every top-level page should render this as its first
 * element. Centralizes title typography, subtitle slot, and primary action row.
 */
export default function PageHeader({ title, subtitle, actions, leading }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {leading}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-100 truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
