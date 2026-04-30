import { timerService } from '../services/timerService.js'
import { getDb } from '../db/database.js'
import { maybeCreateForCompletedEntry } from '../services/autoInvoiceService.js'
import { MS_PER_HOUR } from '../utils/duration.js'

export function registerTimerHandlers(ipcMain, sendEvent) {
  ipcMain.handle('timer:start', (_e, data) => timerService.start(data))

  ipcMain.handle('timer:stop', () => {
    const entry = timerService.stop()
    if (entry) {
      const auto = maybeCreateForCompletedEntry(getDb(), entry)
      if (auto) sendEvent?.('invoice:auto-created', auto)
    }
    return entry
  })

  ipcMain.handle('timer:getActive',       ()             => timerService.getActive())
  ipcMain.handle('timer:getWeek',         (_e, from, to) => timerService.getWeekEntries(from, to))
  ipcMain.handle('timer:getDailySeconds', (_e, projectId) => {
    const db = getDb()
    const pad = (n) => String(n).padStart(2, '0')
    const d   = new Date()
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const rows = projectId
      ? db.prepare(
          `SELECT started_at, stopped_at FROM time_entries WHERE date(started_at) = ? AND project_id = ?`
        ).all(today, projectId)
      : db.prepare(
          `SELECT started_at, stopped_at FROM time_entries WHERE date(started_at) = ?`
        ).all(today)
    const now = Date.now()
    let total = 0
    for (const row of rows) {
      const start = new Date(row.started_at).getTime()
      const end   = row.stopped_at ? new Date(row.stopped_at).getTime() : now
      total += Math.max(0, end - start)
    }
    return Math.round(total / 1000)
  })
  ipcMain.handle('timer:pause', () => {
    const entry = timerService.pause()
    if (entry) sendEvent?.('timer-paused', { savedCtx: timerService.isPaused() })
    sendEvent?.('timer-stopped')
    return entry
  })

  ipcMain.handle('timer:resume', () => {
    const entry = timerService.resume()
    if (entry) sendEvent?.('timer-started', entry)
    return entry
  })

  ipcMain.handle('timer:isPaused', () => timerService.isPaused())

  ipcMain.handle('timer:update',    (_e, id, data)      => timerService.update(id, data))
  ipcMain.handle('timer:delete',    (_e, id)            => timerService.delete(id))

  // Create a completed manual entry with explicit start date/time and duration.
  // Crosses midnight cleanly: 22:00 + 4h becomes next day 02:00, not same-day 02:00.
  ipcMain.handle('timer:add-manual', (_e, { projectId, description, date, startTime = '09:00', hours }) => {
    const db = getDb()
    const startedAt = formatLocalSql(parseLocalDateTime(date, startTime))
    const stoppedAt = formatLocalSql(parseLocalDateTime(date, startTime, parseFloat(hours)))

    const result = db.prepare(`
      INSERT INTO time_entries (project_id, description, started_at, stopped_at, billable, source)
      VALUES (?, ?, ?, ?, 1, 'manual')
    `).run(projectId, description || null, startedAt, stoppedAt)

    return db.prepare(`
      SELECT te.*, p.name as project_name, p.color as project_color
      FROM time_entries te LEFT JOIN projects p ON p.id = te.project_id
      WHERE te.id = ?
    `).get(result.lastInsertRowid)
  })
}

// ── helpers ────────────────────────────────────────────────────────────────

function parseLocalDateTime(date, time, addHours = 0) {
  // `date` is `YYYY-MM-DD`, `time` is `HH:MM`. No timezone marker → JS parses as local.
  const ms = new Date(`${date}T${time}:00`).getTime() + addHours * MS_PER_HOUR
  return new Date(ms)
}

function formatLocalSql(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
