import React, { useState } from 'react'
import PageHeader        from '../components/shared/PageHeader'
import AppearanceSection from '../components/settings/AppearanceSection'
import GeneralSection    from '../components/settings/GeneralSection'
import PomodoroSection   from '../components/settings/PomodoroSection'
import AiSection         from '../components/settings/AiSection'
import RulesSection      from '../components/settings/RulesSection'

const TABS = [
  { id: 'general',  label: 'General' },
  { id: 'ai',       label: 'AI'      },
  { id: 'rules',    label: 'Rules'   },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('general')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Preferences, integrations, and auto-tracking rules"
      />

      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 bg-slate-800 rounded-lg p-1 w-fit">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors duration-fast ${
              tab === id
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'general' && (
        <div className="space-y-8">
          <AppearanceSection />
          <GeneralSection />
          <PomodoroSection />
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-8">
          <AiSection />
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-8">
          <RulesSection />
        </div>
      )}
    </div>
  )
}
