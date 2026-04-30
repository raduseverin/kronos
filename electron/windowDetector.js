import { autoTrackService } from './services/autoTrackService.js'
import { timerService } from './services/timerService.js'

const POLL_INTERVAL_MS = 5000

let timeoutId = null
let running = false
let enabled = true
let inFlight = false
let lastProjectId = null
let onSwitchCb = null

export function configureWindowDetector({ enabled: nextEnabled } = {}) {
  if (nextEnabled !== undefined) enabled = !!nextEnabled
}

export function startWindowDetector(onSwitch) {
  if (running) return
  running = true
  onSwitchCb = onSwitch
  scheduleTick(0)
}

export function stopWindowDetector() {
  running = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

function scheduleTick(delay) {
  if (!running) return
  timeoutId = setTimeout(tick, delay)
}

async function tick() {
  // Skip when disabled or another tick is still in flight (avoids overlap if
  // get-windows ever stalls under macOS pressure).
  if (!enabled || inFlight) {
    scheduleTick(POLL_INTERVAL_MS)
    return
  }
  inFlight = true
  try {
    const { activeWindow } = await import('get-windows')
    const win = await activeWindow()
    if (!win) return

    const windowInfo = `${win.owner.name} | ${win.title}`
    const projectId = await autoTrackService.matchProject(windowInfo)

    if (projectId && projectId !== lastProjectId) {
      await timerService.switchProject(projectId, windowInfo, 'auto')
      lastProjectId = projectId
      onSwitchCb?.(projectId, windowInfo)
    }
  } catch {
    // Window detection is best-effort — silently ignore errors.
  } finally {
    inFlight = false
    scheduleTick(POLL_INTERVAL_MS)
  }
}
