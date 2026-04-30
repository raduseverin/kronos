import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Modal from '../shared/Modal'
import EmptyState from '../shared/EmptyState'
import { TextField } from '../shared/Form'
import { PencilIcon, TrashIcon, TimerIcon, SparkleIcon, SpinnerIcon } from '../shared/icons'
import { ai, timer } from '../../api'
import { entryDurationSeconds, formatHumanShort, MS_PER_SEC } from '../../utils/duration'

export default function ListView({ entries, onEntryChanged }) {
  const groups = groupByDate(entries)

  if (!groups.length) {
    return (
      <EmptyState
        icon={<TimerIcon size={36} />}
        title="No entries this week"
        body="Start the timer above, or add a manual entry from a project page."
      />
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(({ date, items, totalSeconds }) => (
        <div key={date}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d')}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">{formatHumanShort(totalSeconds)}</span>
          </div>
          <div className="space-y-1">
            {items.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onChanged={onEntryChanged} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EntryRow({ entry, onChanged }) {
  const [editOpen, setEditOpen] = useState(false)
  const [now, setNow] = useState(Date.now())

  const isRunning = !entry.stopped_at

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isRunning])

  const duration = isRunning
    ? (now - new Date(entry.started_at)) / MS_PER_SEC
    : entryDurationSeconds(entry)

  const projectColor = entry.project_color || '#6b7280'

  async function deleteEntry() {
    await timer.delete(entry.id)
    onChanged?.()
  }

  return (
    <>
      <div
        className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg
                    bg-slate-800/60 hover:bg-slate-800 transition-colors duration-fast
                    ${isRunning ? 'pl-4 ring-1 ring-inset ring-slate-700/50' : ''}`}
        style={isRunning ? { boxShadow: `inset 2px 0 0 0 ${projectColor}` } : undefined}
      >
        <span className="relative flex shrink-0" aria-hidden="true">
          {isRunning && (
            <span
              className="absolute inset-0 rounded-full animate-pulse-soft"
              style={{ backgroundColor: projectColor, opacity: 0.45 }}
            />
          )}
          <span
            className="relative w-2 h-2 rounded-full"
            style={{ backgroundColor: projectColor }}
          />
        </span>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-200 truncate">
            {entry.description || <span className="text-slate-500 italic">No description</span>}
          </div>
          {entry.project_name && (
            <span className="text-xs text-slate-500">{entry.project_name}</span>
          )}
        </div>

        {entry.billable ? (
          <span className="text-xs text-emerald-400 shrink-0" aria-label="Billable">$</span>
        ) : null}

        <div className="text-xs text-slate-500 shrink-0 text-right tabular-nums">
          <div>
            {format(new Date(entry.started_at), 'HH:mm')} – {entry.stopped_at ? format(new Date(entry.stopped_at), 'HH:mm') : '…'}
          </div>
          {duration > 0 && (
            <div className={`font-medium ${isRunning ? 'text-violet-300' : 'text-slate-400'}`}>
              {formatHumanShort(duration)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast shrink-0">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Edit entry"
            className="text-slate-500 hover:text-violet-400 transition-colors duration-fast p-1 rounded-md"
          >
            <PencilIcon size={14} />
          </button>
          <button
            type="button"
            onClick={deleteEntry}
            aria-label="Delete entry"
            className="text-slate-500 hover:text-red-400 transition-colors duration-fast p-1 rounded-md"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {editOpen && (
        <EditEntryModal
          entry={entry}
          onSave={() => { setEditOpen(false); onChanged?.() }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  )
}

function EditEntryModal({ entry, onSave, onClose }) {
  const [desc, setDesc] = useState(entry.description || '')
  const [startedAt, setStartedAt] = useState(toDatetimeLocal(entry.started_at))
  const [stoppedAt, setStoppedAt] = useState(entry.stopped_at ? toDatetimeLocal(entry.stopped_at) : '')
  const [saving, setSaving] = useState(false)
  const [suggesting, setSuggesting] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const updates = {
        description: desc,
        startedAt: fromDatetimeLocal(startedAt),
      }
      if (entry.stopped_at && stoppedAt) {
        updates.stoppedAt = fromDatetimeLocal(stoppedAt)
      }
      await timer.update(entry.id, updates)
      onSave()
    } finally {
      setSaving(false)
    }
  }

  async function handleAISuggest() {
    if (!desc.trim()) return
    setSuggesting(true)
    try {
      const suggested = await ai.suggestDescription(desc)
      if (suggested) setDesc(suggested)
    } finally {
      setSuggesting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Edit time entry"
      footer={(
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors duration-fast"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      )}
    >
      <div className="space-y-4 py-2"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave()
        }}
      >
        <div className="relative">
          <TextField
            autoFocus
            label="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What were you working on?"
            className="pr-8"
          />
          <button
            type="button"
            title="AI: improve description"
            onClick={handleAISuggest}
            disabled={suggesting || !desc.trim()}
            className="absolute right-2 bottom-2 text-slate-500 hover:text-violet-400 disabled:opacity-30 transition-colors duration-fast p-1 rounded-md"
          >
            {suggesting ? <SpinnerIcon size={14} /> : <SparkleIcon size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400 mb-1.5 block">Start</span>
            <input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="input-base"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400 mb-1.5 block">End</span>
            {entry.stopped_at ? (
              <input
                type="datetime-local"
                value={stoppedAt}
                onChange={(e) => setStoppedAt(e.target.value)}
                className="input-base"
              />
            ) : (
              <div className="input-base text-slate-500 italic flex items-center">Running…</div>
            )}
          </label>
        </div>

        <p className="text-[11px] text-slate-600">⌘ Enter to save · Esc to close</p>
      </div>
    </Modal>
  )
}

function toDatetimeLocal(sqlStr) {
  if (!sqlStr) return ''
  return sqlStr.replace(' ', 'T').substring(0, 16)
}

function fromDatetimeLocal(dtLocal) {
  if (!dtLocal) return null
  return dtLocal.replace('T', ' ') + ':00'
}

// `formatHumanShort` lives in src/utils/duration.js — re-imported above.

function groupByDate(entries) {
  const map = {}
  for (const e of entries) {
    const date = e.started_at.substring(0, 10)
    if (!map[date]) map[date] = { date, items: [], totalSeconds: 0 }
    map[date].items.push(e)
    const end = e.stopped_at ? new Date(e.stopped_at) : new Date()
    map[date].totalSeconds += (end - new Date(e.started_at)) / MS_PER_SEC
  }
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}
