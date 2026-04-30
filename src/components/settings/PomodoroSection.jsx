import React from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { Toggle, Stepper } from '../shared/Form'
import Section from './Section'

export default function PomodoroSection() {
  const {
    pomodoroEnabled, setPomodoroEnabled,
    pomodoroWork,    setPomodoroWork,
    pomodoroBreak,   setPomodoroBreak,
  } = useSettingsStore()

  return (
    <Section title="Pomodoro">
      <Toggle
        label="Enable Pomodoro timer"
        description="Show focus / break countdown on the Timer page"
        checked={pomodoroEnabled}
        onChange={setPomodoroEnabled}
      />

      {pomodoroEnabled && (
        <>
          <div className="flex items-center justify-between py-2 gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-200">Focus duration</div>
              <div className="text-xs text-slate-500 mt-0.5">Length of each work session</div>
            </div>
            <Stepper
              value={pomodoroWork}
              onChange={setPomodoroWork}
              min={1}
              max={120}
              suffix="min"
            />
          </div>

          <div className="flex items-center justify-between py-2 gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-200">Break duration</div>
              <div className="text-xs text-slate-500 mt-0.5">Length of each break between sessions</div>
            </div>
            <Stepper
              value={pomodoroBreak}
              onChange={setPomodoroBreak}
              min={1}
              max={60}
              suffix="min"
            />
          </div>
        </>
      )}
    </Section>
  )
}
