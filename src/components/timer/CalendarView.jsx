import React, { useMemo } from 'react'
import { format, addDays, isSameDay } from 'date-fns'

const HOUR_HEIGHT = 60     // px per hour — matches design spec
const MIN_BLOCK = 18       // minimum visible block height in px
const DAY_START = 6        // first hour rendered
const DAY_END = 22         // last hour rendered (inclusive)

const DAYS = Array.from({ length: 7 }, (_, i) => i)

export default function CalendarView({ entries, weekStart }) {
  const days = DAYS.map((d) => addDays(weekStart, d))
  const visibleHours = useMemo(
    () => Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i),
    []
  )

  // Group entries by day index.
  const entriesByDay = useMemo(() => {
    const buckets = days.map(() => [])
    for (const entry of entries) {
      const idx = days.findIndex((d) => isSameDay(d, new Date(entry.started_at)))
      if (idx === -1) continue
      buckets[idx].push(entry)
    }
    return buckets
  }, [entries, days])

  return (
    <div className="overflow-auto card-surface p-3">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-px mb-2">
          <div />
          {days.map((day) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()} className="text-center pb-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-sm font-medium mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-violet-600 text-white' : 'text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Hours + day columns */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-px">
          {/* Hour gutter */}
          <div className="flex flex-col">
            {visibleHours.map((hour, idx) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="text-right pr-2 text-[11px] text-slate-600 leading-none"
              >
                {idx === 0 ? '' : `${String(hour).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => (
            <DayColumn
              key={di}
              day={day}
              entries={entriesByDay[di]}
              hourCount={visibleHours.length}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DayColumn({ day, entries, hourCount }) {
  const isToday = isSameDay(day, new Date())
  const totalHeight = hourCount * HOUR_HEIGHT

  // Now indicator (only for today)
  const now = new Date()
  const nowOffset = isToday
    ? (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_HEIGHT
    : null
  const showNow = nowOffset !== null && nowOffset >= 0 && nowOffset <= totalHeight

  return (
    <div className="relative bg-slate-900/40 rounded" style={{ height: totalHeight }}>
      {/* Hour grid lines */}
      {Array.from({ length: hourCount }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-slate-800/80"
          style={{ top: i * HOUR_HEIGHT }}
        />
      ))}

      {/* Now indicator */}
      {showNow && (
        <div
          className="absolute left-0 right-0 z-10"
          style={{ top: nowOffset }}
          aria-hidden="true"
        >
          <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
          <div className="border-t border-red-500/80" />
        </div>
      )}

      {/* Entry blocks */}
      {entries.map((entry) => (
        <EntryBlock key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

function EntryBlock({ entry }) {
  const start = new Date(entry.started_at)
  const stop = entry.stopped_at ? new Date(entry.stopped_at) : new Date()

  const startHour = start.getHours() + start.getMinutes() / 60
  const stopHour = stop.getHours() + stop.getMinutes() / 60

  // Clip to visible window
  const clampedStart = Math.max(startHour, DAY_START)
  const clampedStop = Math.min(stopHour, DAY_END + 1)
  if (clampedStop <= clampedStart) return null

  const top = (clampedStart - DAY_START) * HOUR_HEIGHT
  const height = Math.max((clampedStop - clampedStart) * HOUR_HEIGHT, MIN_BLOCK)

  const projectColor = entry.project_color || '#7c3aed'
  const fg = readableForeground(projectColor)

  return (
    <div
      title={entry.description || entry.project_name || ''}
      className="absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden cursor-default"
      style={{
        top,
        height,
        backgroundColor: projectColor,
        color: fg,
      }}
    >
      <div className="text-[11px] font-medium leading-tight truncate">
        {entry.project_name || entry.description || '–'}
      </div>
      {height >= 32 && entry.description && entry.project_name && (
        <div className="text-[10px] opacity-80 leading-tight truncate">
          {entry.description}
        </div>
      )}
    </div>
  )
}

/**
 * Pick a readable text color (white or near-black) against the given hex
 * background using the YIQ luminance formula. Avoids unreadable white-on-yellow.
 */
function readableForeground(hex) {
  if (!hex) return '#fff'
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (full.length !== 6) return '#fff'
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 160 ? '#0f172a' : '#ffffff'
}
