import React from 'react'
import { useFx, formatMoney } from '../shared/useFx'
import { TrashIcon } from '../shared/icons'
import { budgetCurOf, displayCurOf } from './utils'

/**
 * Compact project card used in the projects list. Shows the project name,
 * client, hourly rate, budget summary, and a progress bar. Highlights amber
 * when budget is ≥ 90 % consumed.
 */
export default function ProjectCard({
  project: p,
  summary,
  onClick,
  onEdit,
  onArchive,
  onDelete,
  onGenerateInvoice,
}) {
  const fx          = useFx()
  const mode        = p.tracking_mode || 'monthly'
  const budget      = p.budget_amount || 0
  const usedAmount  = summary?.usedAmount || 0
  const usedHours   = summary?.usedHours  || 0
  // Percentage is computed on the budget-currency values (no conversion needed since
  // both numerator and denominator share the same anchor currency).
  const pct         = mode === 'budget' && budget > 0 ? Math.min(usedAmount / budget, 1) : null
  const budgetAlert = pct !== null && pct >= 0.9

  const bCur = budgetCurOf(p)
  const dCur = displayCurOf(p)
  const showConverted = bCur !== dCur

  const usedDisplay   = fx.convert(usedAmount, bCur, dCur)
  const budgetDisplay = fx.convert(budget,     bCur, dCur)

  const barColor = pct === null ? 'bg-violet-500'
    : pct >= 1   ? 'bg-red-500'
    : pct >= 0.9 ? 'bg-amber-400'
    : pct >= 0.7 ? 'bg-violet-500'
    : 'bg-emerald-500'

  return (
    <div
      onClick={onClick}
      className={`group/card px-4 py-3 rounded-xl bg-slate-800 border border-slate-700/60 space-y-2 cursor-pointer hover:bg-slate-750 hover:border-slate-700 transition-colors duration-fast ${p.archived ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-100 truncate">{p.name}</div>
          <div className="text-xs text-slate-500">
            {p.client_name || 'No client'}
            {p.hourly_rate ? ` · ${p.hourly_rate} ${bCur}/hr` : ''}
            {p.billable ? '' : ' · Non-billable'}
            <span className={`ml-2 ${mode === 'budget' ? 'text-violet-400' : 'text-slate-600'}`}>
              {mode === 'budget' ? `Budget ${formatMoney(budget, bCur, { decimals: 0 })}` : 'Monthly'}
            </span>
            {showConverted && (
              <span className="ml-2 text-slate-600" title={`Display currency: ${dCur}`}>
                · view in {dCur}
              </span>
            )}
          </div>
        </div>

        {budgetAlert && onGenerateInvoice && (
          <button
            onClick={onGenerateInvoice}
            className="text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors duration-fast font-medium shrink-0"
          >
            Generate Invoice
          </button>
        )}
        <button onClick={onEdit}    className="btn-ghost opacity-0 group-hover/card:opacity-100 transition-opacity duration-fast">Edit</button>
        <button onClick={onArchive} className="btn-ghost opacity-0 group-hover/card:opacity-100 transition-opacity duration-fast">
          {p.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete project"
          className="text-slate-500 hover:text-red-400 transition-colors duration-fast opacity-0 group-hover/card:opacity-100 p-1 rounded-md"
        >
          <TrashIcon size={14} />
        </button>
      </div>

      {!p.archived && summary && (
        <div className="space-y-1">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            {mode === 'budget' && budget > 0 ? (
              <div className={`h-full rounded-full transition-all ${barColor}`}
                   style={{ width: `${Math.min((pct || 0) * 100, 100)}%` }} />
            ) : (
              <div className="h-full rounded-full bg-violet-500 transition-all"
                   style={{ width: `${Math.min((usedHours / 160) * 100, 100)}%` }} />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            {mode === 'budget' ? (
              <>
                <span>
                  <span className={budgetAlert ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                    {formatMoney(usedDisplay, dCur)}
                  </span>
                  {' '}/ {formatMoney(budgetDisplay, dCur, { decimals: 0 })}
                  {pct !== null && <span className="ml-1">({Math.round(pct * 100)}%)</span>}
                  {showConverted && (
                    <span className="ml-2 text-slate-600">
                      · {formatMoney(budget, bCur, { decimals: 0 })} budget
                    </span>
                  )}
                </span>
                <span>{usedHours.toFixed(1)}h tracked</span>
              </>
            ) : (
              <>
                <span>
                  <span className="text-slate-300">{usedHours.toFixed(1)}h</span> this month
                </span>
                {p.hourly_rate && <span>{formatMoney(usedDisplay, dCur)}</span>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
