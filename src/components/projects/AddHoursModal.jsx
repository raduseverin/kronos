import React, { useState } from 'react'
import { todayIso } from '../../utils/dateFormat'

const today = todayIso()

/**
 * Lightweight modal for adding a backdated time entry to a project.
 * Uses native date/time inputs and validates non-empty hours before saving.
 */
export default function AddHoursModal({ onSave, onClose }) {
  const [date,        setDate]        = useState(today)
  const [startTime,   setStartTime]   = useState('09:00')
  const [hours,       setHours]       = useState('')
  const [description, setDescription] = useState('')
  const [saving,      setSaving]      = useState(false)

  async function handleSave() {
    if (!hours || parseFloat(hours) <= 0) return
    setSaving(true)
    try {
      await onSave({ date, startTime, hours: parseFloat(hours), description })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-[380px] shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave()
        }}
      >
        <h3 className="text-sm font-semibold text-slate-100">Add Custom Hours</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-700 text-sm text-slate-100 rounded-lg px-3 py-2 outline-none border border-slate-600 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-700 text-sm text-slate-100 rounded-lg px-3 py-2 outline-none border border-slate-600 focus:border-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Hours</label>
          <input
            autoFocus
            type="number"
            min="0.1"
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 3.5"
            className="w-full bg-slate-700 text-sm text-slate-100 rounded-lg px-3 py-2 outline-none border border-slate-600 focus:border-violet-500 placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full bg-slate-700 text-sm text-slate-100 rounded-lg px-3 py-2 outline-none border border-slate-600 focus:border-violet-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hours || parseFloat(hours) <= 0}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Adding…' : 'Add Hours'}
          </button>
        </div>
      </div>
    </div>
  )
}
