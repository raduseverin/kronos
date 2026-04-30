import { getDb } from '../db/database.js'

export function registerRuleHandlers(ipcMain) {
  ipcMain.handle('rules:list', () => {
    return getDb().prepare(`
      SELECT wr.*, p.name as project_name, p.color as project_color
      FROM window_rules wr
      JOIN projects p ON p.id = wr.project_id
      ORDER BY wr.priority DESC, wr.keyword ASC
    `).all()
  })

  ipcMain.handle('rules:create', (_e, { keyword, projectId, priority = 0 }) => {
    const db = getDb()
    const result = db
      .prepare('INSERT INTO window_rules (keyword, project_id, priority) VALUES (?, ?, ?)')
      .run(keyword, projectId, priority)
    return db.prepare('SELECT * FROM window_rules WHERE id = ?').get(result.lastInsertRowid)
  })

  ipcMain.handle('rules:delete', (_e, id) => {
    return getDb().prepare('DELETE FROM window_rules WHERE id = ?').run(id)
  })
}
