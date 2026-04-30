import React from 'react'
import { MonitorIcon, MoonIcon, SunIcon } from '../shared/icons'

const OPTIONS = [
  { id: 'system', label: 'System', Icon: MonitorIcon },
  { id: 'dark',   label: 'Dark',   Icon: MoonIcon },
  { id: 'light',  label: 'Light',  Icon: SunIcon },
]

export default function ThemeToggle({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-md p-0.5"
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = value === id
        return (
          <button
            key={id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors duration-fast ${
              active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
