import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('kronos', {
  // Timer
  timer: {
    start:          (data)      => ipcRenderer.invoke('timer:start', data),
    stop:           ()          => ipcRenderer.invoke('timer:stop'),
    getActive:      ()          => ipcRenderer.invoke('timer:getActive'),
    getWeek:        (from, to)  => ipcRenderer.invoke('timer:getWeek', from, to),
    getDailySeconds: (pid)      => ipcRenderer.invoke('timer:getDailySeconds', pid),
    pause:          ()          => ipcRenderer.invoke('timer:pause'),
    resume:         ()          => ipcRenderer.invoke('timer:resume'),
    isPaused:       ()          => ipcRenderer.invoke('timer:isPaused'),
    update:         (id, d)     => ipcRenderer.invoke('timer:update', id, d),
    delete:         (id)        => ipcRenderer.invoke('timer:delete', id),
    addManual:      (data)      => ipcRenderer.invoke('timer:add-manual', data),
  },
  // Projects
  projects: {
    list:            ()           => ipcRenderer.invoke('projects:list'),
    create:          (data)       => ipcRenderer.invoke('projects:create', data),
    update:          (id, d)      => ipcRenderer.invoke('projects:update', id, d),
    delete:          (id)         => ipcRenderer.invoke('projects:delete', id),
    periodSummaries: ()           => ipcRenderer.invoke('projects:period-summaries'),
    periodSummary:   (id)         => ipcRenderer.invoke('projects:period-summary', id),
    entries:         (id, from)   => ipcRenderer.invoke('projects:entries', id, from),
    resetPeriod:     (id)         => ipcRenderer.invoke('projects:reset-period', id),
    budgetLocked:    (id)         => ipcRenderer.invoke('projects:budget-locked', id),
  },
  // Clients
  clients: {
    list:   ()       => ipcRenderer.invoke('clients:list'),
    create: (data)   => ipcRenderer.invoke('clients:create', data),
    update: (id, d)  => ipcRenderer.invoke('clients:update', id, d),
    delete: (id)     => ipcRenderer.invoke('clients:delete', id),
  },
  // Tags
  tags: {
    list:   ()       => ipcRenderer.invoke('tags:list'),
    create: (data)   => ipcRenderer.invoke('tags:create', data),
  },
  // Reports
  reports: {
    summary:   (from, to, filters) => ipcRenderer.invoke('reports:summary', from, to, filters),
    exportCsv: (from, to)          => ipcRenderer.invoke('reports:exportCsv', from, to),
  },
  // AI
  ai: {
    configure:          (config)      => ipcRenderer.invoke('ai:configure', config),
    suggestDescription: (text)        => ipcRenderer.invoke('ai:suggestDescription', text),
    classifyWindow:     (windowTitle) => ipcRenderer.invoke('ai:classifyWindow', windowTitle),
    isAvailable:        ()            => ipcRenderer.invoke('ai:isAvailable'),
  },
  // Window rules
  rules: {
    list:   ()       => ipcRenderer.invoke('rules:list'),
    create: (data)   => ipcRenderer.invoke('rules:create', data),
    delete: (id)     => ipcRenderer.invoke('rules:delete', id),
  },
  // Bank accounts
  bankAccounts: {
    list:   ()        => ipcRenderer.invoke('bank-accounts:list'),
    create: (data)    => ipcRenderer.invoke('bank-accounts:create', data),
    update: (id, d)   => ipcRenderer.invoke('bank-accounts:update', id, d),
    delete: (id)      => ipcRenderer.invoke('bank-accounts:delete', id),
  },
  // Invoices
  invoices: {
    list:           ()           => ipcRenderer.invoke('invoices:list'),
    listForProject: (name)       => ipcRenderer.invoke('invoices:list-for-project', name),
    nextNumber:  (projectName) => ipcRenderer.invoke('invoices:next-number', projectName),
    create:      (data)       => ipcRenderer.invoke('invoices:create', data),
    update:      (id, d)      => ipcRenderer.invoke('invoices:update', id, d),
    delete:      (id)         => ipcRenderer.invoke('invoices:delete', id),
    timeSummary: (f, t, pid)  => ipcRenderer.invoke('invoices:time-summary', f, t, pid),
    exportPdf:   (data)       => ipcRenderer.invoke('invoices:export-pdf', data),
  },
  // Currencies
  currencies: {
    getRates: (base) => ipcRenderer.invoke('currencies:getRates', base),
    refresh:  (base) => ipcRenderer.invoke('currencies:refresh', base),
  },
  // Idle detection
  idle: {
    configure: (config) => ipcRenderer.invoke('idle:configure', config),
    resume:    ()       => ipcRenderer.invoke('idle:resume'),
  },
  // Auto-tracking (active-window detector)
  autoTrack: {
    configure: (config) => ipcRenderer.invoke('autoTrack:configure', config),
  },
  // Quick-start templates
  templates: {
    list:   ()       => ipcRenderer.invoke('templates:list'),
    create: (data)   => ipcRenderer.invoke('templates:create', data),
    delete: (id)     => ipcRenderer.invoke('templates:delete', id),
  },
  // Global keyboard shortcut
  shortcut: {
    configure: (key) => ipcRenderer.invoke('shortcut:configure', key),
  },
  // Secrets (OS keychain via safeStorage)
  secrets: {
    get:       (key)         => ipcRenderer.invoke('secrets:get', key),
    set:       (key, value)  => ipcRenderer.invoke('secrets:set', key, value),
    setMany:   (entries)     => ipcRenderer.invoke('secrets:set-many', entries),
    available: ()            => ipcRenderer.invoke('secrets:available'),
  },
  // Events: main → renderer
  on:  (channel, callback) => ipcRenderer.on(channel, (_, ...args) => callback(...args)),
  off: (channel, callback) => ipcRenderer.removeListener(channel, callback),
})
