import React from 'react'
import { useTimerStore } from '../../store/timerStore'

export default function TimerClock() {
  const { activeEntry, formatElapsed } = useTimerStore()

  if (!activeEntry) return null

  const projectColor = activeEntry.project_color || '#9333ea'

  return (
    <div className="flex items-center justify-center py-6">
      <div className="text-center">
        <div
          className="text-6xl font-mono font-light tabular-nums tracking-tight transition-colors duration-base"
          // Slightly desaturated tint of the project color so it stays legible.
          style={{ color: projectColor, filter: 'saturate(0.9)' }}
        >
          {formatElapsed()}
        </div>
        {activeEntry.project_name && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: projectColor }}
            />
            <span className="text-sm text-slate-400">{activeEntry.project_name}</span>
          </div>
        )}
        {activeEntry.description && (
          <p className="mt-1 text-xs text-slate-500 max-w-xs truncate">
            {activeEntry.description}
          </p>
        )}
      </div>
    </div>
  )
}
