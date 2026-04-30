import { getDb } from '../db/database.js'

export function registerTagHandlers(ipcMain) {
  ipcMain.handle('tags:list', () => {
    return getDb().prepare('SELECT * FROM tags ORDER BY name ASC').all()
  })

  ipcMain.handle('tags:create', (_e, { name }) => {
    const db = getDb()
    db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name)
    return db.prepare('SELECT * FROM tags WHERE name = ?').get(name)
  })
}
