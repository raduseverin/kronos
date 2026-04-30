import React, { useState, useEffect, useRef } from 'react'
import { useTimerStore } from '../../store/timerStore'
import { useSettingsStore } from '../../store/settingsStore'
import ProjectSelector from '../shared/ProjectSelector'
import { PlayIcon, StopIcon, PauseIcon, BookmarkIcon, SparkleIcon, SpinnerIcon } from '../shared/icons'
import { ai, timer, templates as templatesApi } from '../../api'

export default function TimerBar({ onEntryChanged }) {
  const { activeEntry, setActiveEntry, isPaused, setPaused } = useTimerStore()
  const { defaultBillable } = useSettingsStore()

  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState(null)
  const [billable, setBillable] = useState(defaultBillable)
  const [suggesting, setSuggesting] = useState(false)
  const descRef = useRef(null)

  useEffect(() => {
    if (activeEntry) {
      setDescription(activeEntry.description || '')
      setProjectId(activeEntry.project_id)
      setBillable(!!activeEntry.billable)
    }
  }, [activeEntry?.id])

  async function handleToggle() {
    if (activeEntry) {
      await timer.stop()
      setActiveEntry(null)
      setDescription('')
      setProjectId(null)
      setBillable(defaultBillable)
    } else if (isPaused) {
      const entry = await timer.resume()
      setActiveEntry(entry)
      setPaused(false)
    } else {
      await timer.start({ description, projectId, billable })
      const active = await timer.getActive()
      setActiveEntry(active)
    }
    onEntryChanged?.()
  }

  async function handlePause() {
    await timer.pause()
    setActiveEntry(null)
    setPaused(true)
    onEntryChanged?.()
  }

  const [savedTemplate, setSavedTemplate] = useState(false)
  async function handleSaveTemplate() {
    if (!activeEntry) return
    await templatesApi.create({
      description: activeEntry.description || description,
      projectId:   activeEntry.project_id,
      billable:    !!activeEntry.billable,
    })
    setSavedTemplate(true)
    setTimeout(() => setSavedTemplate(false), 2000)
  }

  async function handleDescriptionBlur() {
    if (!activeEntry || !description.trim()) return
    await timer.update(activeEntry.id, { description })
  }

  async function handleAISuggest() {
    if (!description.trim()) return
    setSuggesting(true)
    try {
      const suggested = await ai.suggestDescription(description)
      if (suggested) {
        setDescription(suggested)
        // Save immediately so stopping the timer doesn't lose the AI-updated description
        if (activeEntry) {
          await timer.update(activeEntry.id, { description: suggested })
        }
      }
    } finally {
      setSuggesting(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleToggle()
  }

  return (
    <div className="flex items-center gap-3 p-3 card-elevated">
      {/* Description input + AI sparkle inside */}
      <div className="relative flex-1 min-w-0">
        <input
          ref={descRef}
          type="text"
          placeholder="What are you working on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          onKeyDown={handleKeyDown}
          tabIndex={1}
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm outline-none pr-8"
        />
        <button
          type="button"
          title="AI: improve description (⌘.)"
          onClick={handleAISuggest}
          disabled={suggesting || !description.trim()}
          tabIndex={5}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-400 disabled:opacity-30 transition-colors duration-fast p-1 -m-1 rounded-md"
        >
          {suggesting ? <SpinnerIcon size={15} /> : <SparkleIcon size={15} />}
        </button>
      </div>

      {/* Project selector */}
      <span tabIndex={-1}>
        <ProjectSelector
          value={projectId}
          tabIndex={2}
          onChange={async (id) => {
            setProjectId(id)
            if (activeEntry) {
              await timer.update(activeEntry.id, { projectId: id })
              onEntryChanged?.()
            }
          }}
        />
      </span>

      {/* Billable toggle */}
      <button
        type="button"
        title={billable ? 'Billable' : 'Non-billable'}
        aria-pressed={billable}
        onClick={() => setBillable((b) => !b)}
        tabIndex={3}
        className={`text-xs font-medium px-2 py-1 rounded-md transition-colors duration-fast shrink-0 ${
          billable
            ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-800'
            : 'bg-slate-700 text-slate-500 border border-slate-600'
        }`}
      >
        $
      </button>

      {/* Save as template (only while running) */}
      {activeEntry && (
        <button
          type="button"
          onClick={handleSaveTemplate}
          title={savedTemplate ? 'Saved!' : 'Save as quick-start template'}
          className={`shrink-0 transition-colors duration-fast p-1.5 rounded-md ${
            savedTemplate ? 'text-violet-400' : 'text-slate-500 hover:text-violet-400'
          }`}
        >
          <BookmarkIcon size={14} />
        </button>
      )}

      {/* Pause (only while running) */}
      {activeEntry && (
        <button
          type="button"
          onClick={handlePause}
          tabIndex={4}
          aria-label="Pause timer"
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-fast bg-amber-600 hover:bg-amber-500 text-white"
        >
          <PauseIcon size={14} />
        </button>
      )}

      {/* Start / Stop / Resume */}
      <button
        type="button"
        onClick={handleToggle}
        tabIndex={5}
        aria-label={activeEntry ? 'Stop timer' : isPaused ? 'Resume timer' : 'Start timer'}
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-fast ${
          activeEntry
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : isPaused
            ? 'bg-amber-600 hover:bg-amber-500 text-white'
            : 'bg-violet-600 hover:bg-violet-500 text-white'
        }`}
      >
        {activeEntry ? <StopIcon size={14} /> : <PlayIcon size={14} />}
      </button>
    </div>
  )
}
