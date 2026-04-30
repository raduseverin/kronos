import React, { useEffect, useState } from 'react'
import { useTimerStore } from '../../store/timerStore'
import appIcon from '../../assets/app-icon.png'

export default function TopBar() {
  const { activeEntry, formatElapsed } = useTimerStore()
  const [, rerender] = useState(0)

  useEffect(() => {
    if (!activeEntry) return
    const id = setInterval(() => rerender((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [activeEntry])

  const projectColor = activeEntry?.project_color || '#9333ea'

  return (
    <header
      className="h-10 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800 shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div style={{ WebkitAppRegion: 'no-drag' }} className="flex items-center gap-2 min-w-0">
        {activeEntry ? (
          <>
            <span className="relative flex shrink-0" aria-hidden="true">
              <span
                className="absolute inset-0 rounded-full animate-pulse-soft"
                style={{ backgroundColor: projectColor, opacity: 0.45 }}
              />
              <span
                className="relative w-2 h-2 rounded-full"
                style={{ backgroundColor: projectColor }}
              />
            </span>
            <span
              className="text-xs font-medium truncate"
              style={{ color: projectColor }}
            >
              {activeEntry.project_name || 'No project'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">
              Running
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <img src={appIcon} alt="" aria-hidden="true" className="w-4 h-4 rounded-sm shrink-0" />
            Kronos
          </span>
        )}
      </div>

      <div style={{ WebkitAppRegion: 'no-drag' }}>
        {activeEntry && (
          <span
            className="text-sm font-mono tabular-nums"
            style={{ color: projectColor }}
          >
            {formatElapsed()}
          </span>
        )}
      </div>
    </header>
  )
}
