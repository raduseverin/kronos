import { getDb } from '../db/database.js'

let pauseContext = null

export function getPauseContext()    { return pauseContext }
export function clearPauseContext()  { pauseContext = null }

export const timerService = {
  start({ projectId = null, description = '', billable = true, source = 'manual' }) {
    const db = getDb()
    this.stop()

    return db.prepare(`
      INSERT INTO time_entries (project_id, description, started_at, billable, source)
      VALUES (?, ?, datetime('now', 'localtime'), ?, ?)
    `).run(projectId, description, billable ? 1 : 0, source)
  },

  stop() {
    const db = getDb()
    const active = this.getActive()
    if (!active) return null

    db.prepare(`
      UPDATE time_entries
      SET stopped_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(active.id)

    return active
  },

  getActive() {
    const db = getDb()
    return db.prepare(`
      SELECT te.*, p.name as project_name, p.color as project_color,
             p.daily_target_hours as project_daily_target
      FROM time_entries te
      LEFT JOIN projects p ON p.id = te.project_id
      WHERE te.stopped_at IS NULL
      ORDER BY te.started_at DESC
      LIMIT 1
    `).get()
  },

  switchProject(projectId, windowInfo, source = 'auto') {
    const active = this.getActive()
    if (active && active.project_id === projectId) return active

    this.stop()
    return this.start({
      projectId,
      description: `Auto: ${windowInfo.substring(0, 80)}`,
      source,
    })
  },

  getWeekEntries(from, to) {
    const db = getDb()
    return db.prepare(`
      SELECT te.*, p.name as project_name, p.color as project_color,
             c.name as client_name
      FROM time_entries te
      LEFT JOIN projects p ON p.id = te.project_id
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE date(te.started_at) BETWEEN ? AND ?
      ORDER BY te.started_at ASC
    `).all(from, to)
  },

  update(id, { projectId, description, startedAt, stoppedAt, billable }) {
    const db = getDb()
    const fields = []
    const values = []

    if (projectId !== undefined) { fields.push('project_id = ?'); values.push(projectId) }
    if (description !== undefined) { fields.push('description = ?'); values.push(description) }
    if (startedAt !== undefined) { fields.push('started_at = ?'); values.push(startedAt) }
    if (stoppedAt !== undefined) { fields.push('stopped_at = ?'); values.push(stoppedAt) }
    if (billable !== undefined) { fields.push('billable = ?'); values.push(billable ? 1 : 0) }

    if (!fields.length) return null

    fields.push("updated_at = datetime('now', 'localtime')")
    values.push(id)

    return db.prepare(`UPDATE time_entries SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  },

  pause() {
    const active = this.getActive()
    if (!active) return null
    pauseContext = {
      projectId:    active.project_id,
      description:  active.description || '',
      billable:     !!active.billable,
      preElapsedMs: Date.now() - new Date(active.started_at).getTime(),
    }
    return this.stop()
  },

  resume() {
    if (!pauseContext) return null
    const { preElapsedMs, ...ctx } = pauseContext
    pauseContext = null
    this.start(ctx)
    const entry = this.getActive()
    if (entry && preElapsedMs > 0) {
      // Backdate started_at so the elapsed clock continues from before the pause
      const backdated = new Date(Date.now() - preElapsedMs)
      const pad = (n) => String(n).padStart(2, '0')
      const sqlTs = `${backdated.getFullYear()}-${pad(backdated.getMonth() + 1)}-${pad(backdated.getDate())} ` +
                    `${pad(backdated.getHours())}:${pad(backdated.getMinutes())}:${pad(backdated.getSeconds())}`
      getDb().prepare(`UPDATE time_entries SET started_at = ? WHERE id = ?`).run(sqlTs, entry.id)
      return this.getActive()
    }
    return entry
  },

  isPaused() { return !!pauseContext },

  stopAtTime(localTimestamp) {
    const db = getDb()
    const active = this.getActive()
    if (!active) return null
    // If idle started before this entry did, just delete the zero-duration entry
    if (localTimestamp <= active.started_at) {
      db.prepare('DELETE FROM time_entries WHERE id = ?').run(active.id)
      return null
    }
    db.prepare(`
      UPDATE time_entries
      SET stopped_at = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(localTimestamp, active.id)
    return active
  },

  delete(id) {
    return getDb().prepare('DELETE FROM time_entries WHERE id = ?').run(id)
  },
}
