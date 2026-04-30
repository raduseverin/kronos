/**
 * Renderer-side API layer.
 *
 * Every page/component imports IPC functions from here, never from
 * `window.kronos.*` directly. This keeps the transport detail in one place,
 * provides a JSDoc-typed surface, and gives us a single seam for future
 * concerns (centralized error toasts, retries, mocking in tests).
 */
export { timer }        from './timer.js'
export { projects }     from './projects.js'
export { clients }      from './clients.js'
export { tags }         from './tags.js'
export { reports }      from './reports.js'
export { invoices }     from './invoices.js'
export { bankAccounts } from './bankAccounts.js'
export { ai }           from './ai.js'
export { rules }        from './rules.js'
export { currencies }   from './currencies.js'
export { secrets }      from './secrets.js'
export { idle }         from './idle.js'
export { autoTrack }    from './autoTrack.js'
export { shortcut }     from './shortcut.js'
export { templates }    from './templates.js'
export { events, useIpcEvent } from './events.js'
