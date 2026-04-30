import React, { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { timer } from '../../api'

const R    = 18
const CX   = 24
const CY   = 24
const CIRC = 2 * Math.PI * R

// mode: 'idle' | 'focus' | 'break' | 'done'
export default function PomodoroTimer({ onEntryChanged }) {
  const { pomodoroWork, pomodoroBreak } = useSettingsStore()
  const [mode,      setMode]      = useState('idle')
  const [remaining, setRemaining] = useState(0)
  const [total,     setTotal]     = useState(0)

  // Countdown tick — runs only while a session is active
  useEffect(() => {
    if (mode !== 'focus' && mode !== 'break') return
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [mode])

  // Session transition when remaining reaches 0
  const prevRef = useRef(0)
  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = remaining
    if (remaining !== 0 || prev === 0) return

    if (mode === 'focus') {
      timer.pause().then(() => onEntryChanged?.()).catch(() => {})
      const secs = pomodoroBreak * 60
      setMode('break')
      setRemaining(secs)
      setTotal(secs)
    } else if (mode === 'break') {
      setMode('done')
    }
  }, [remaining, mode, pomodoroBreak])

  function startFocus() {
    const secs = pomodoroWork * 60
    prevRef.current = secs
    setMode('focus')
    setRemaining(secs)
    setTotal(secs)
  }

  function reset() {
    setMode('idle')
    setRemaining(0)
    setTotal(0)
    prevRef.current = 0
  }

  function skipToBreak() {
    const secs = pomodoroBreak * 60
    prevRef.current = secs
    setMode('break')
    setRemaining(secs)
    setTotal(secs)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (mode === 'idle') {
    return (
      <button
        onClick={startFocus}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors duration-fast px-2 py-1 rounded-md hover:bg-slate-800/60"
      >
        🍅 Start focus · {pomodoroWork} min
      </button>
    )
  }

  if (mode === 'done') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 card-elevated text-sm">
        <span className="text-emerald-400 font-medium">Break over — ready to focus!</span>
        <button
          onClick={startFocus}
          className="px-2.5 py-1 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast font-medium"
        >
          Start focus
        </button>
        <button
          onClick={reset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-fast"
        >
          Dismiss
        </button>
      </div>
    )
  }

  const progress  = total > 0 ? (total - remaining) / total : 0
  const offset    = CIRC * (1 - progress)
  const isFocus   = mode === 'focus'
  const arcColor  = isFocus ? '#7c3aed' : '#10b981'
  const mm        = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss        = String(remaining % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-3 px-3 py-2 card-elevated">
      {/* Progress arc */}
      <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={arcColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      </svg>

      <div className="min-w-0">
        <div className={`text-[10px] font-semibold uppercase tracking-wider ${isFocus ? 'text-violet-400' : 'text-emerald-400'}`}>
          {isFocus ? 'Focus' : 'Break'}
        </div>
        <div className="text-xl font-mono tabular-nums text-slate-100 leading-none mt-0.5">
          {mm}:{ss}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {isFocus && (
          <button
            onClick={skipToBreak}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-md transition-colors duration-fast"
          >
            Skip
          </button>
        )}
        <button
          onClick={reset}
          className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded-md transition-colors duration-fast"
        >
          Stop
        </button>
      </div>
    </div>
  )
}
