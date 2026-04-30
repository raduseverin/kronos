import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useChartColors } from '../shared/useThemeMode'
import { secondsToHours } from '../../utils/duration'

export default function DurationByDay({ byDay }) {
  const c = useChartColors()
  const data = Object.entries(byDay || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { total, billable }]) => ({
      date,
      label: format(parseISO(date), 'EEE d'),
      total:    +secondsToHours(total).toFixed(2),
      billable: +secondsToHours(billable).toFixed(2),
    }))

  if (!data.length) return null

  return (
    <div className="card-elevated p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Hours per day</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={20}>
          <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} unit="h" width={28} />
          <Tooltip
            cursor={{ fill: c.tooltipBorder, opacity: 0.2 }}
            contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: c.label }}
            formatter={(v, name) => [`${v}h`, name === 'billable' ? 'Billable' : 'Total']}
          />
          <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="billable" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
