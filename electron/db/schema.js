/**
 * Kysely table type definitions for type-safe query building.
 * These mirror the SQLite schema defined in database.js.
 *
 * Usage:
 *   import { Kysely, SqliteDialect } from 'kysely'
 *   import BetterSqlite3 from 'better-sqlite3'
 *   import { getDb } from './database.js'
 *
 *   const kyselyDb = new Kysely({ dialect: new SqliteDialect({ database: getDb() }) })
 */

/**
 * @typedef {Object} ClientTable
 * @property {number} id
 * @property {string} name
 * @property {string|null} email
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ProjectTable
 * @property {number} id
 * @property {number|null} client_id
 * @property {string} name
 * @property {string} color
 * @property {number|null} hourly_rate
 * @property {0|1} billable
 * @property {0|1} archived
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} TagTable
 * @property {number} id
 * @property {string} name
 * @property {string} created_at
 */

/**
 * @typedef {Object} TimeEntryTable
 * @property {number} id
 * @property {number|null} project_id
 * @property {string|null} description
 * @property {string} started_at
 * @property {string|null} stopped_at
 * @property {0|1} billable
 * @property {'manual'|'auto'|'ai'} source
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} TimeEntryTagTable
 * @property {number} time_entry_id
 * @property {number} tag_id
 */

/**
 * @typedef {Object} WindowRuleTable
 * @property {number} id
 * @property {string} keyword
 * @property {number} project_id
 * @property {number} priority
 */

/**
 * @typedef {Object} Database
 * @property {ClientTable} clients
 * @property {ProjectTable} projects
 * @property {TagTable} tags
 * @property {TimeEntryTable} time_entries
 * @property {TimeEntryTagTable} time_entry_tags
 * @property {WindowRuleTable} window_rules
 */
