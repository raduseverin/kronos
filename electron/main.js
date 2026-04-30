import { app, BrowserWindow, ipcMain, globalShortcut, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/database.js'
import { registerTimerHandlers } from './ipc/timerHandlers.js'
import { registerProjectHandlers } from './ipc/projectHandlers.js'
import { registerClientHandlers } from './ipc/clientHandlers.js'
import { registerTagHandlers } from './ipc/tagHandlers.js'
import { registerRuleHandlers } from './ipc/ruleHandlers.js'
import { registerReportHandlers } from './ipc/reportHandlers.js'
import { registerAIHandlers } from './ipc/aiHandlers.js'
import { registerInvoiceHandlers } from './ipc/invoiceHandlers.js'
import { registerCurrencyHandlers } from './ipc/currencyHandlers.js'
import { registerSecretsHandlers } from './ipc/secretsHandlers.js'
import { registerTemplateHandlers } from './ipc/templateHandlers.js'
import { timerService } from './services/timerService.js'
import { maybeCreateForCompletedEntry } from './services/autoInvoiceService.js'
import { getDb } from './db/database.js'
import { startWindowDetector, stopWindowDetector, configureWindowDetector } from './windowDetector.js'
import { startIdleDetector, stopIdleDetector, configureIdleDetector, getIdlePausedContext, clearIdlePausedContext } from './idleDetector.js'
import { createTray, stopTick } from './tray.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function appIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app-icon.png')
    : path.join(__dirname, '../../resources/app-icon.png')
}

let mainWindow
let tray
let activeShortcut = null

function registerShortcut(key) {
  if (activeShortcut) {
    globalShortcut.unregister(activeShortcut)
    activeShortcut = null
  }
  if (!key) return true
  const ok = globalShortcut.register(key, handleShortcutToggle)
  if (ok) activeShortcut = key
  return ok
}

function handleShortcutToggle() {
  const active = timerService.getActive()
  if (active) {
    const entry = timerService.stop()
    if (entry) {
      const auto = maybeCreateForCompletedEntry(getDb(), entry)
      if (auto) mainWindow?.webContents?.send('invoice:auto-created', auto)
    }
    mainWindow?.webContents?.send('timer-stopped')
  } else {
    // Re-start with last used project
    const last = getDb().prepare(
      `SELECT project_id FROM time_entries WHERE stopped_at IS NOT NULL ORDER BY stopped_at DESC LIMIT 1`
    ).get()
    timerService.start({ projectId: last?.project_id || null, description: '' })
    const started = timerService.getActive()
    mainWindow?.webContents?.send('timer-started', started)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('close', (e) => {
    // Keep app alive in tray instead of quitting
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
}

app.whenReady().then(() => {
  if (app.dock) app.dock.setIcon(nativeImage.createFromPath(appIconPath()))
  initDatabase()
  // Stop any timer left running from a previous session
  timerService.stop()

  createWindow()

  registerTimerHandlers(ipcMain, (channel, data) => mainWindow?.webContents?.send(channel, data))
  registerProjectHandlers(ipcMain)
  registerClientHandlers(ipcMain)
  registerTagHandlers(ipcMain)
  registerRuleHandlers(ipcMain)
  registerReportHandlers(ipcMain)
  registerAIHandlers(ipcMain)
  registerInvoiceHandlers(ipcMain)
  registerCurrencyHandlers(ipcMain)
  registerSecretsHandlers(ipcMain)
  registerTemplateHandlers(ipcMain)

  // Global shortcut — register default; renderer will reconfigure from persisted settings
  registerShortcut('CmdOrCtrl+Shift+Space')
  ipcMain.handle('shortcut:configure', (_, key) => {
    const ok = registerShortcut(key)
    return { ok }
  })

  tray = createTray(mainWindow)

  startWindowDetector((projectId, windowInfo) => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('auto-track-switched', { projectId, windowInfo })
    }
  })

  startIdleDetector(
    (data) => {
      mainWindow?.webContents?.send('idle-detected', data)
      // Reuse the timer-stopped event so TimerPage refreshes its entries list
      mainWindow?.webContents?.send('timer-stopped')
    },
    (data) => mainWindow?.webContents?.send('activity-resumed', data)
  )

  ipcMain.handle('idle:configure', (_, config) => configureIdleDetector(config))
  ipcMain.handle('autoTrack:configure', (_, config) => configureWindowDetector(config))

  ipcMain.handle('idle:resume', () => {
    const ctx = getIdlePausedContext()
    if (!ctx) return null
    clearIdlePausedContext()
    // If window-detector already resumed tracking, don't override it
    const existing = timerService.getActive()
    if (existing) return existing
    timerService.start(ctx)
    const active = timerService.getActive()
    mainWindow?.webContents?.send('idle-timer-resumed', { entry: active })
    return active
  })
})

app.on('before-quit', () => {
  app.isQuitting = true
  globalShortcut.unregisterAll()
  stopWindowDetector()
  stopIdleDetector()
  stopTick()
})

// Keep running when all windows are closed (macOS tray app)
app.on('window-all-closed', (e) => {
  e.preventDefault()
})

app.on('activate', () => {
  // Re-show window when clicking dock icon
  if (mainWindow) {
    mainWindow.show()
  }
})
