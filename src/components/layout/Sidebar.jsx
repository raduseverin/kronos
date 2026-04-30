import React, { useEffect, useState } from 'react'
import {
  TimerIcon,
  ChartIcon,
  FolderIcon,
  InvoiceIcon,
  CurrencyIcon,
  GearIcon,
} from '../shared/icons'
import { timer, events } from '../../api'

const R = 12
const CX = 16
const CY = 16
const CIRCUMFERENCE = 2 * Math.PI * R

function DailyProgress() {
  const [active,  setActive]  = useState(null)  // active timer entry
  const [seconds, setSeconds] = useState(0)

  async function refreshActive() {
    try {
      const entry = await timer.getActive()
      setActive(entry || null)
      if (entry?.project_daily_target > 0) {
        const s = await timer.getDailySeconds(entry.project_id)
        setSeconds(s || 0)
      }
    } catch {
      // IPC not ready yet
    }
  }

  async function refreshSeconds() {
    if (!active?.project_id || !active?.project_daily_target) return
    try {
      const s = await timer.getDailySeconds(active.project_id)
      setSeconds(s || 0)
    } catch {}
  }

  useEffect(() => {
    refreshActive()
    const id = setInterval(refreshSeconds, 30_000)
    events.on('timer-stopped', refreshActive)
    events.on('timer-started', refreshActive)
    return () => {
      clearInterval(id)
      events.off('timer-stopped', refreshActive)
      events.off('timer-started', refreshActive)
    }
  }, [])

  // Keep refreshSeconds closure fresh when `active` changes
  useEffect(() => {
    const id = setInterval(refreshSeconds, 30_000)
    return () => clearInterval(id)
  }, [active])

  const targetHours = active?.project_daily_target
  if (!targetHours) return null

  const hours    = seconds / 3600
  const progress = Math.min(hours / targetHours, 1)
  const done     = progress >= 1
  const offset   = CIRCUMFERENCE * (1 - progress)
  const arcColor = done ? '#22c55e' : '#7c3aed'

  return (
    <div className="relative group flex items-center justify-center w-10 h-10">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={arcColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-12 bottom-0
                   opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0
                   transition-all duration-base ease-out
                   whitespace-nowrap text-xs px-2 py-1 rounded-md
                   bg-slate-800 border border-slate-700 text-slate-200 z-30 shadow-xl"
      >
        {hours.toFixed(1)}h / {targetHours}h today
      </span>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'timer',      label: 'Timer',      icon: TimerIcon },
  { id: 'reports',    label: 'Reports',    icon: ChartIcon },
  { id: 'projects',   label: 'Projects',   icon: FolderIcon },
  { id: 'invoices',   label: 'Invoices',   icon: InvoiceIcon },
  { id: 'currencies', label: 'Currencies', icon: CurrencyIcon },
  { id: 'settings',   label: 'Settings',   icon: GearIcon },
]

export default function Sidebar({ activePage, onNavigate }) {
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem('kronos-sidebar-expanded') === 'true' } catch { return false }
  })

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem('kronos-sidebar-expanded', String(next)) } catch {}
  }

  return (
    <nav
      aria-label="Primary"
      className={`flex flex-col items-center pt-9 pb-4 gap-1 bg-slate-950 border-r border-slate-800 shrink-0 select-none relative transition-all duration-200 ${
        expanded ? 'w-44 items-stretch px-2' : 'w-16'
      }`}
    >
      {/* Drag-region strip behind the macOS traffic lights */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-7"
        style={{ WebkitAppRegion: 'drag' }}
      />


      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activePage === id
        return (
          <div key={id} className={`relative ${expanded ? '' : 'group'}`}>
            <button
              type="button"
              onClick={() => onNavigate(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`rounded-lg flex items-center transition-colors duration-fast ${
                expanded
                  ? `w-full h-9 gap-3 px-2 ${active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`
                  : `w-10 h-10 justify-center ${active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {expanded && (
                <span className="text-sm truncate">{label}</span>
              )}
            </button>
            {/* Tooltip only when collapsed */}
            {!expanded && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2
                           opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0
                           transition-all duration-base ease-out
                           whitespace-nowrap text-xs px-2 py-1 rounded-md
                           bg-slate-800 border border-slate-700 text-slate-200 z-30 shadow-xl"
              >
                {label}
              </span>
            )}
          </div>
        )
      })}

      <div className={`mt-auto flex ${expanded ? 'flex-row items-center justify-between w-full px-1' : 'flex-col items-center gap-1'}`}>
        <DailyProgress />
        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="text-slate-600 hover:text-slate-300 transition-colors duration-fast p-1 rounded-md text-xs font-mono"
        >
          {expanded ? '«' : '»'}
        </button>
      </div>
    </nav>
  )
}
