import { getDb } from '../db/database.js'
import {
  createProject,
  isProjectBudgetLocked,
  periodSummaryFor,
  resetProjectPeriod,
  updateProject,
} from '../services/projectService.js'

/**
 * IPC handlers for the project domain.
 *
 * Heavy lifting (validation, lock-guard, period math) lives in
 * `services/projectService.js`. These are thin shells that forward the
 * payload and serialise the result.
 */
export function registerProjectHandlers(ipcMain) {
  ipcMain.handle('projects:list', () => {
    return getDb().prepare(`
      SELECT p.*, c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      ORDER BY p.archived ASC, p.name ASC
    `).all()
  })

  ipcMain.handle('projects:create', (_e, input) => createProject(getDb(), input))
  ipcMain.handle('projects:update', (_e, id, input) => updateProject(getDb(), id, input))

  ipcMain.handle('projects:budget-locked', (_e, id) => {
    const db = getDb()
    const p = db.prepare('SELECT name FROM projects WHERE id = ?').get(id)
    if (!p) return false
    return isProjectBudgetLocked(db, id, p.name)
  })

  ipcMain.handle('projects:period-summaries', () => {
    const db = getDb()
    const projects = db.prepare('SELECT * FROM projects WHERE archived = 0').all()
    return projects.map((p) => periodSummaryFor(db, p))
  })

  ipcMain.handle('projects:period-summary', (_e, id) => {
    const db = getDb()
    const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    return p ? periodSummaryFor(db, p) : null
  })

  ipcMain.handle('projects:entries', (_e, projectId, from) => {
    return getDb().prepare(`
      SELECT te.*, p.name as project_name, p.color as project_color
      FROM time_entries te
      LEFT JOIN projects p ON p.id = te.project_id
      WHERE te.project_id = ?
        AND te.stopped_at IS NOT NULL
        AND date(te.started_at) >= ?
      ORDER BY te.started_at DESC
    `).all(projectId, from || '1970-01-01')
  })

  ipcMain.handle('projects:reset-period', (_e, id) => resetProjectPeriod(getDb(), id))

  ipcMain.handle('projects:delete', (_e, id) => {
    return getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
  })
}
