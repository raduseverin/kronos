import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useChartColors } from '../shared/useThemeMode'
import { secondsToHours } from '../../utils/duration'

export default function ProjectDonut({ byProject }) {
  const c = useChartColors()
  const data = Object.entries(byProject || {}).map(([name, { seconds, color }]) => ({
    name,
    value: +secondsToHours(seconds).toFixed(2),
    color,
  }))

  if (!data.length) return null

  return (
    <div className="card-elevated p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">By project</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${v}h`]}
          />
          <Legend
            formatter={(value) => <span style={{ color: c.legend, fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
