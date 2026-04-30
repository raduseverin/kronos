import { getDb } from '../db/database.js'

export function registerClientHandlers(ipcMain) {
  ipcMain.handle('clients:list', () => {
    return getDb().prepare('SELECT * FROM clients ORDER BY name ASC').all()
  })

  ipcMain.handle('clients:create', (_e, { name, email = null }) => {
    const db = getDb()
    const result = db.prepare('INSERT INTO clients (name, email) VALUES (?, ?)').run(name, email)
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid)
  })

  ipcMain.handle('clients:update', (_e, id, { name, email }) => {
    const db = getDb()
    const fields = []
    const values = []

    if (name  !== undefined) { fields.push('name = ?');  values.push(name) }
    if (email !== undefined) { fields.push('email = ?'); values.push(email) }

    if (!fields.length) return null
    fields.push("updated_at = datetime('now', 'localtime')")
    values.push(id)

    db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
  })

  ipcMain.handle('clients:delete', (_e, id) => {
    return getDb().prepare('DELETE FROM clients WHERE id = ?').run(id)
  })
}
