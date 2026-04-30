import { getDb } from '../db/database.js'

const WITH_PROJECT = `
  SELECT t.*, p.name as project_name, p.color as project_color
  FROM templates t
  LEFT JOIN projects p ON p.id = t.project_id
`

export function registerTemplateHandlers(ipcMain) {
  ipcMain.handle('templates:list', () =>
    getDb().prepare(`${WITH_PROJECT} ORDER BY t.id ASC`).all()
  )

  ipcMain.handle('templates:create', (_e, { projectId, description, billable }) => {
    const db  = getDb()
    const res = db.prepare(
      `INSERT INTO templates (project_id, description, billable) VALUES (?, ?, ?)`
    ).run(projectId || null, description || null, billable ? 1 : 0)
    return db.prepare(`${WITH_PROJECT} WHERE t.id = ?`).get(res.lastInsertRowid)
  })

  ipcMain.handle('templates:delete', (_e, id) =>
    getDb().prepare('DELETE FROM templates WHERE id = ?').run(id)
  )
}
