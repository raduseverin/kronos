import { getDb } from '../db/database.js'
import { MS_PER_HOUR } from '../utils/duration.js'

const STALE_HOURS = 6

export function registerCurrencyHandlers(ipcMain) {
  ipcMain.handle('currencies:getRates', async (_e, base = 'EUR') => {
    return getOrFetch(base)
  })

  ipcMain.handle('currencies:refresh', async (_e, base = 'EUR') => {
    return fetchAndStore(base)
  })
}

async function getOrFetch(base) {
  const db  = getDb()
  const row = db.prepare('SELECT * FROM exchange_rates WHERE base = ? ORDER BY fetched_at DESC LIMIT 1').get(base)
  if (row) {
    const ageHours = (Date.now() - new Date(row.fetched_at).getTime()) / MS_PER_HOUR
    if (ageHours < STALE_HOURS) {
      return { rates: JSON.parse(row.rates), base, fetchedAt: row.fetched_at, cached: true }
    }
  }
  try {
    return await fetchAndStore(base)
  } catch {
    if (row) return { rates: JSON.parse(row.rates), base, fetchedAt: row.fetched_at, cached: true, stale: true }
    throw new Error('No rates available and network request failed.')
  }
}

async function fetchAndStore(base) {
  const res  = await fetch(`https://open.er-api.com/v6/latest/${base}`)
  const data = await res.json()
  if (data.result !== 'success') throw new Error('Exchange rate API error')

  const db = getDb()
  db.prepare('DELETE FROM exchange_rates WHERE base = ?').run(base)
  db.prepare("INSERT INTO exchange_rates (base, rates, fetched_at) VALUES (?, ?, datetime('now','localtime'))")
    .run(base, JSON.stringify(data.rates))

  return { rates: data.rates, base, fetchedAt: new Date().toISOString(), cached: false }
}
