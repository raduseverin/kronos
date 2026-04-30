import React from 'react'

/**
 * Centered empty-state block for lists, tables, and pages with no data.
 * Use a meaningful illustration / icon, a tight title, optional body, and one
 * primary CTA.
 */
export default function EmptyState({ icon, title, body, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {icon && (
        <div className="text-slate-600 mb-3">
          {icon}
        </div>
      )}
      {title && (
        <p className="text-sm text-slate-300 font-medium">{title}</p>
      )}
      {body && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{body}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  )
}
