import { powerMonitor } from 'electron'
import { timerService } from './services/timerService.js'

let intervalId = null
let wasIdle = false
let idlePausedContext = null
let idleStartedAt = null
let idleEnabled = true
let idleThresholdSeconds = 300

export function configureIdleDetector({ enabled, thresholdSeconds } = {}) {
  if (enabled !== undefined) idleEnabled = enabled
  if (thresholdSeconds !== undefined) idleThresholdSeconds = thresholdSeconds
}

export function getIdlePausedContext() {
  return idlePausedContext
}

export function clearIdlePausedContext() {
  idlePausedContext = null
  idleStartedAt = null
}

function formatLocalTimestamp(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function startIdleDetector(onIdle, onResume) {
  intervalId = setInterval(() => {
    if (!idleEnabled) {
      if (wasIdle) {
        wasIdle = false
        idleStartedAt = null
      }
      return
    }

    const idleSeconds = powerMonitor.getSystemIdleTime()

    if (!wasIdle && idleSeconds >= idleThresholdSeconds) {
      wasIdle = true
      const active = timerService.getActive()
      if (!active) return

      const idleStartDate = new Date(Date.now() - idleSeconds * 1000)
      idleStartedAt = idleStartDate.getTime()

      idlePausedContext = {
        projectId: active.project_id,
        projectName: active.project_name,
        projectColor: active.project_color,
        description: active.description,
        billable: active.billable === 1 || active.billable === true,
        source: active.source || 'manual',
      }

      timerService.stopAtTime(formatLocalTimestamp(idleStartDate))
      onIdle({ savedCtx: { ...idlePausedContext }, idleStartedAt })

    } else if (wasIdle && idleSeconds < 30) {
      wasIdle = false
      const ctx = idlePausedContext
      const startedAt = idleStartedAt
      onResume({ savedCtx: ctx, idleStartedAt: startedAt })
    }
  }, 5000)
}

export function stopIdleDetector() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
