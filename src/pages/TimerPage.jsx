import React, { useEffect, useState } from 'react'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { useTimerStore } from '../store/timerStore'
import { useSettingsStore } from '../store/settingsStore'
import TimerBar from '../components/timer/TimerBar'
import TimerClock from '../components/timer/TimerClock'
import TemplateBar from '../components/timer/TemplateBar'
import PomodoroTimer from '../components/timer/PomodoroTimer'
import ListView from '../components/timer/ListView'
import CalendarView from '../components/timer/CalendarView'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/shared/icons'
import { SkeletonRow } from '../components/shared/Skeleton'
import { timer, events } from '../api'

export default function TimerPage() {
  const { setActiveEntry, setAutoTrackedProject, setPaused } = useTimerStore()
  const { weekStartsOn, pomodoroEnabled, templatesEnabled } = useSettingsStore()
  const [entries, setEntries] = useState(null) // null = loading
  const [view, setView] = useState('list')
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn })
  const weekEnd = endOfWeek(weekStart, { weekStartsOn })

  useEffect(() => {
    timer.getActive().then(setActiveEntry)
    timer.isPaused().then((paused) => { if (paused) setPaused(true) })

    function onAutoSwitch() {
      timer.getActive().then((entry) => {
        setActiveEntry(entry)
        if (entry) setAutoTrackedProject({ id: entry.project_id, name: entry.project_name })
      })
      loadEntries()
    }
    function onTimerStopped() {
      setActiveEntry(null)
      loadEntries()
    }
    function onTimerPaused() {
      setActiveEntry(null)
      setPaused(true)
      loadEntries()
    }
    function onTimerStarted(entry) {
      setActiveEntry(entry)
      setPaused(false)
      loadEntries()
    }
    function onIdleTimerResumed({ entry }) {
      setActiveEntry(entry)
      loadEntries()
    }

    events.on('auto-track-switched', onAutoSwitch)
    events.on('timer-stopped',       onTimerStopped)
    events.on('timer-paused',        onTimerPaused)
    events.on('timer-started',       onTimerStarted)
    events.on('idle-timer-resumed',  onIdleTimerResumed)

    return () => {
      events.off('auto-track-switched', onAutoSwitch)
      events.off('timer-stopped',       onTimerStopped)
      events.off('timer-paused',        onTimerPaused)
      events.off('timer-started',       onTimerStarted)
      events.off('idle-timer-resumed',  onIdleTimerResumed)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [weekOffset])

  async function loadEntries() {
    const from = format(weekStart, 'yyyy-MM-dd')
    const to = format(weekEnd, 'yyyy-MM-dd')
    const data = await timer.getWeek(from, to)
    setEntries(data)
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <TimerBar onEntryChanged={loadEntries} />
      {templatesEnabled && (
        <TemplateBar onStart={async () => {
          const active = await timer.getActive()
          setActiveEntry(active)
          setPaused(false)
          loadEntries()
        }} />
      )}
      {pomodoroEnabled && <PomodoroTimer onEntryChanged={loadEntries} />}
      <TimerClock />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="text-slate-400 hover:text-slate-100 transition-colors duration-fast p-1 rounded-md"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <span className="text-sm text-slate-300 w-32 text-center">
            {weekOffset === 0 ? 'This week' : format(weekStart, 'MMM d, yyyy')}
          </span>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
            disabled={weekOffset === 0}
            className="text-slate-400 hover:text-slate-100 disabled:opacity-30 transition-colors duration-fast p-1 rounded-md"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>

        <div role="tablist" aria-label="Entries view" className="flex gap-1 bg-slate-800 rounded-md p-0.5">
          {['list', 'calendar'].map((v) => {
            const active = view === v
            return (
              <button
                key={v}
                role="tab"
                aria-selected={active}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs rounded capitalize transition-colors duration-fast ${
                  active ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {v}
              </button>
            )
          })}
        </div>
      </div>

      {entries === null ? (
        <div className="space-y-1.5">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : view === 'list' ? (
        <ListView entries={entries} onEntryChanged={loadEntries} />
      ) : (
        <CalendarView entries={entries} weekStart={weekStart} />
      )}
    </div>
  )
}
