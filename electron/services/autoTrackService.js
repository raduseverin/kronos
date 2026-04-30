import { getDb } from '../db/database.js'
import { aiService } from './ai/index.js'

const AMBIGUOUS_APPS = ['google chrome', 'safari', 'arc', 'firefox', 'slack', 'terminal']

export const autoTrackService = {
  async matchProject(windowInfo) {
    const db = getDb()
    const windowLower = windowInfo.toLowerCase()

    // 1. Rule-based matching (ordered by priority DESC)
    const rules = db.prepare(`
      SELECT keyword, project_id
      FROM window_rules
      ORDER BY priority DESC
    `).all()

    for (const rule of rules) {
      if (windowLower.includes(rule.keyword.toLowerCase())) {
        return rule.project_id
      }
    }

    // 2. AI fallback for ambiguous apps (browser, Slack, Terminal)
    const isAmbiguous = AMBIGUOUS_APPS.some(app => windowLower.startsWith(app))
    if (!isAmbiguous) return null

    const available = await aiService.isAvailable()
    if (!available) return null

    const projects = db.prepare('SELECT id, name FROM projects WHERE archived = 0').all()
    if (!projects.length) return null

    const matched = await aiService.classifyWindow(windowInfo, projects.map((p) => p.name))
    if (!matched) return null

    return projects.find(p => p.name === matched)?.id ?? null
  },
}
