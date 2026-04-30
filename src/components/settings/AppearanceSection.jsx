import React from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import Section from './Section'
import ThemeToggle from './ThemeToggle'

export default function AppearanceSection() {
  const theme    = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <Section title="Appearance">
      <div className="flex items-center justify-between py-2 gap-4">
        <div className="min-w-0">
          <div className="text-sm text-slate-200">Theme</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Switch between light and dark, or follow the system
          </div>
        </div>
        <ThemeToggle value={theme} onChange={setTheme} />
      </div>
    </Section>
  )
}
