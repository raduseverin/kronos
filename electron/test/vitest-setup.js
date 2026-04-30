import { vi } from 'vitest'

/** Prevent `better-sqlite3` → `database.js` → real `electron` binary during Vitest. */
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/kronos-vitest'),
  },
}))
