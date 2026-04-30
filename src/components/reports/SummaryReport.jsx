import React from 'react'
import { formatHoursLabel } from '../../utils/duration'

const fmtHours = formatHoursLabel

export default function SummaryReport({ data }) {
  if (!data) return null

  const billablePct = data.totalSeconds > 0
    ? Math.round((data.billableSeconds / data.totalSeconds) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Total" value={fmtHours(data.totalSeconds)} />
      <StatCard label="Billable" value={fmtHours(data.billableSeconds)} sub={`${billablePct}%`} />
      <StatCard label="Earnings" value={`$${data.amount.toFixed(2)}`} />
      <StatCard label="Avg / day" value={`${data.avgDailyHours.toFixed(1)}h`} />
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-slate-800 rounded-xl px-4 py-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-semibold text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}
