import { aiService } from '../services/ai/index.js'
import { getDb } from '../db/database.js'

export function registerAIHandlers(ipcMain) {
  ipcMain.handle('ai:configure',          (_e, config)      => aiService.configure(config))
  ipcMain.handle('ai:isAvailable',        ()                => aiService.isAvailable())
  ipcMain.handle('ai:suggestDescription', (_e, text)        => aiService.suggestDescription(text))

  ipcMain.handle('ai:classifyWindow', (_e, windowTitle) => {
    const projects = getDb()
      .prepare('SELECT name FROM projects WHERE archived = 0')
      .all()
      .map((p) => p.name)
    return aiService.classifyWindow(windowTitle, projects)
  })
}
