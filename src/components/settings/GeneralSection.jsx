import React, { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { Toggle, Stepper } from '../shared/Form'
import Section from './Section'

export default function GeneralSection() {
  const {
    autoTrackEnabled,     setAutoTrackEnabled,
    idleDetectionEnabled, setIdleDetectionEnabled,
    idleThresholdMinutes, setIdleThresholdMinutes,
    defaultBillable,      setDefaultBillable,
    weekStartsOn,         setWeekStartsOn,
    globalShortcut,       setGlobalShortcut,
    invoiceRounding,      setInvoiceRounding,
    templatesEnabled,     setTemplatesEnabled,
  } = useSettingsStore()

  return (
    <Section title="General">
      <Toggle
        label="Enable auto-tracking"
        description="Automatically switch timer based on the active window"
        checked={autoTrackEnabled}
        onChange={setAutoTrackEnabled}
      />
      <Toggle
        label="Pause timer when idle"
        description="Stop recording when no input is detected"
        checked={idleDetectionEnabled}
        onChange={setIdleDetectionEnabled}
      />

      {idleDetectionEnabled && (
        <div className="flex items-center justify-between py-2 gap-4">
          <div className="min-w-0">
            <div className="text-sm text-slate-200">Idle timeout</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Minutes of inactivity before timer pauses
            </div>
          </div>
          <Stepper
            value={idleThresholdMinutes}
            onChange={setIdleThresholdMinutes}
            min={1}
            max={60}
            suffix="min"
          />
        </div>
      )}

      <Toggle
        label="Billable by default"
        description="New time entries default to billable"
        checked={defaultBillable}
        onChange={setDefaultBillable}
      />

      <div className="flex items-center justify-between py-2 gap-4">
        <div>
          <div className="text-sm text-slate-200">Week starts on</div>
        </div>
        <select
          value={weekStartsOn}
          onChange={(e) => setWeekStartsOn(Number(e.target.value))}
          className="input-base !w-auto"
        >
          <option value={1}>Monday</option>
          <option value={0}>Sunday</option>
        </select>
      </div>

      {/* ── Global shortcut ── */}
      <div className="flex items-center justify-between py-2 gap-4">
        <div className="min-w-0">
          <div className="text-sm text-slate-200">Global shortcut</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Start / stop timer from anywhere
          </div>
        </div>
        <ShortcutRecorder value={globalShortcut} onChange={setGlobalShortcut} />
      </div>

      {/* ── Invoice rounding ── */}
      <div className="flex items-center justify-between py-2 gap-4">
        <div className="min-w-0">
          <div className="text-sm text-slate-200">Invoice rounding</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Round up hours when importing to invoices
          </div>
        </div>
        <select
          value={invoiceRounding}
          onChange={(e) => setInvoiceRounding(e.target.value)}
          className="input-base !w-auto"
        >
          <option value="none">No rounding</option>
          <option value="6">6 min (0.1 h)</option>
          <option value="15">15 min (0.25 h)</option>
          <option value="30">30 min (0.5 h)</option>
          <option value="60">1 hour</option>
        </select>
      </div>

      <Toggle
        label="Quick-start templates"
        description="Show one-click entry templates on the Timer page"
        checked={templatesEnabled}
        onChange={setTemplatesEnabled}
      />
    </Section>
  )
}

// ── ShortcutRecorder ────────────────────────────────────────────────────────

function ShortcutRecorder({ value, onChange }) {
  const [recording, setRecording] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (recording) ref.current?.focus()
  }, [recording])

  function handleKeyDown(e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape') { setRecording(false); return }

    const isModifier = ['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)
    if (isModifier) return

    const parts = []
    if (e.metaKey || e.ctrlKey) parts.push('CmdOrCtrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    const key = e.key === ' ' ? 'Space' : e.key.toUpperCase()
    parts.push(key)
    onChange(parts.join('+'))
    setRecording(false)
  }

  return (
    <div className="flex items-center gap-2">
      <kbd
        ref={ref}
        tabIndex={recording ? 0 : -1}
        onKeyDown={recording ? handleKeyDown : undefined}
        onBlur={() => setRecording(false)}
        className={`min-w-[120px] text-center px-3 py-1.5 rounded-md text-xs font-mono border outline-none
          ${recording
            ? 'bg-violet-900/40 border-violet-500 text-violet-300 animate-pulse'
            : 'bg-slate-800 border-slate-600 text-slate-300'}`}
      >
        {recording ? 'Press keys…' : displayShortcut(value)}
      </kbd>
      <button
        type="button"
        onClick={() => setRecording((r) => !r)}
        className="text-xs px-2 py-1.5 rounded-md bg-slate-800 border border-slate-600 text-slate-400 hover:text-slate-100 hover:border-slate-400 transition-colors duration-fast"
      >
        {recording ? 'Cancel' : 'Change'}
      </button>
    </div>
  )
}

function displayShortcut(acc) {
  if (!acc) return 'None'
  return acc
    .replace('CmdOrCtrl', '⌘/Ctrl')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace(/\+/g, ' ')
}
