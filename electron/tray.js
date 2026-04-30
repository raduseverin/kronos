import { Tray, Menu, nativeImage, app } from 'electron'
import { timerService, clearPauseContext } from './services/timerService.js'
import { maybeCreateForCompletedEntry } from './services/autoInvoiceService.js'
import { getDb } from './db/database.js'
import { hourglassBuffer, hourglassFilledBuffer } from './utils/imageUtils.js'
import { formatHHMMSS, MS_PER_SEC } from './utils/duration.js'

let tray = null
let tickInterval = null

// Outline clepsydra — template image adapts to light/dark menu bar
const IDLE_ICON = nativeImage.createFromBuffer(
  hourglassBuffer(22), { width: 22, height: 22 }
)
IDLE_ICON.setTemplateImage(true)

export function createTray(mainWindow) {
  tray = new Tray(IDLE_ICON)
  tray.setToolTip('Kronos')

  refreshTray(mainWindow)
  startTick(mainWindow)

  // Left-click shows the context menu; double-click opens the window
  tray.on('click', () => tray.popUpContextMenu())
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus() })

  return tray
}

export function refreshTray(mainWindow) {
  const active = timerService.getActive()

  const paused = timerService.isPaused()

  // ── Icon ────────────────────────────────────────────────────────────────
  if (active?.project_color) {
    const icon = nativeImage.createFromBuffer(
      hourglassFilledBuffer(active.project_color, 22), { width: 22, height: 22 }
    )
    tray.setImage(icon)
  } else {
    tray.setImage(IDLE_ICON)
  }

  // ── Title (shown inline in menu bar) ────────────────────────────────────
  if (active) {
    tray.setTitle(' ' + formatElapsed(active.started_at))
  } else if (paused) {
    tray.setTitle(' ⏸')
  } else {
    tray.setTitle('')
  }

  // ── Context menu ────────────────────────────────────────────────────────
  const menu = Menu.buildFromTemplate([
    {
      label: active
        ? `${active.project_name || 'No project'}  ·  ${formatElapsed(active.started_at)}`
        : paused ? 'Paused' : 'Not tracking',
      enabled: false,
    },
    { type: 'separator' },
    ...(active ? [
      {
        label: 'Pause timer',
        click: () => {
          timerService.pause()
          mainWindow?.webContents?.send('timer-paused')
          mainWindow?.webContents?.send('timer-stopped')
          refreshTray(mainWindow)
        },
      },
      {
        label: 'Stop timer',
        click: () => {
          const entry = timerService.stop()
          if (entry) {
            const auto = maybeCreateForCompletedEntry(getDb(), entry)
            if (auto) mainWindow?.webContents?.send('invoice:auto-created', auto)
          }
          mainWindow?.webContents?.send('timer-stopped')
          refreshTray(mainWindow)
        },
      },
    ] : paused ? [
      {
        label: 'Resume timer',
        click: () => {
          const entry = timerService.resume()
          if (entry) mainWindow?.webContents?.send('timer-started', entry)
          refreshTray(mainWindow)
        },
      },
      {
        label: 'Discard paused timer',
        click: () => {
          clearPauseContext()
          mainWindow?.webContents?.send('timer-stopped')
          refreshTray(mainWindow)
        },
      },
    ] : []),
    {
      label: 'Show Kronos',
      click: () => { mainWindow.show(); mainWindow.focus() },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { app.isQuitting = true; app.quit() },
    },
  ])

  tray.setContextMenu(menu)
}

function startTick(mainWindow) {
  if (tickInterval) clearInterval(tickInterval)
  tickInterval = setInterval(() => {
    if (tray) refreshTray(mainWindow)
  }, 1000)
}

export function stopTick() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

function formatElapsed(startedAt) {
  const secs = Math.floor((Date.now() - new Date(startedAt)) / MS_PER_SEC)
  return formatHHMMSS(secs)
}
