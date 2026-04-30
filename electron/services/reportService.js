import { getDb } from '../db/database.js'
import { entryDurationSeconds, entryDurationHours, secondsToHours } from '../utils/duration.js'

export const reportService = {
  summary(from, to, filters = {}) {
    const db = getDb()

    const entries = db.prepare(`
      SELECT te.*, p.name as project_name, p.color as project_color,
             p.hourly_rate, c.name as client_name
      FROM time_entries te
      LEFT JOIN projects p ON p.id = te.project_id
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE te.started_at >= ? AND te.started_at <= ?
        AND te.stopped_at IS NOT NULL
    `).all(from, to)

    const totalSeconds = entries.reduce((sum, e) => sum + entryDurationSeconds(e), 0)

    const billableSeconds = entries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + entryDurationSeconds(e), 0)

    const amount = entries
      .filter((e) => e.billable && e.hourly_rate)
      .reduce((sum, e) => sum + entryDurationHours(e) * e.hourly_rate, 0)

    // Group by day for bar chart
    const byDay = {}
    for (const e of entries) {
      const day = e.started_at.substring(0, 10)
      if (!byDay[day]) byDay[day] = { total: 0, billable: 0 }
      const secs = entryDurationSeconds(e)
      byDay[day].total += secs
      if (e.billable) byDay[day].billable += secs
    }

    // Group by project for donut chart
    const byProject = {}
    for (const e of entries) {
      const key = e.project_name || 'No project'
      if (!byProject[key]) byProject[key] = { seconds: 0, color: e.project_color || '#6b7280' }
      byProject[key].seconds += entryDurationSeconds(e)
    }

    const dayCount = Object.keys(byDay).length

    return {
      totalSeconds,
      billableSeconds,
      amount: Math.round(amount * 100) / 100,
      avgDailyHours: dayCount ? secondsToHours(totalSeconds) / dayCount : 0,
      byDay,
      byProject,
      entries,
    }
  },

  exportCsv(from, to) {
    const { entries } = this.summary(from, to)
    const rows = [
      ['Date', 'Start', 'Stop', 'Duration (h)', 'Project', 'Client', 'Description', 'Billable', 'Amount'],
    ]

    for (const e of entries) {
      const hours = entryDurationHours(e)
      const amount = e.billable && e.hourly_rate ? (hours * e.hourly_rate).toFixed(2) : ''
      rows.push([
        e.started_at.substring(0, 10),
        e.started_at.substring(11, 16),
        e.stopped_at.substring(11, 16),
        hours.toFixed(2),
        e.project_name || '',
        e.client_name || '',
        e.description || '',
        e.billable ? 'Yes' : 'No',
        amount,
      ])
    }

    return rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  },
}
