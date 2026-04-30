import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

/**
 * Returns the effective theme ('dark' | 'light') resolving the 'system'
 * preference at runtime. Listens to OS changes when 'system' is active.
 */
export function useThemeMode() {
  const theme = useSettingsStore((s) => s.theme)
  const [resolved, setResolved] = useState(() => resolve(theme))

  useEffect(() => {
    if (theme !== 'system') {
      setResolved(theme === 'light' ? 'light' : 'dark')
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => setResolved(mq.matches ? 'light' : 'dark')
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  return resolved
}

function resolve(theme) {
  if (theme === 'light') return 'light'
  if (theme === 'dark') return 'dark'
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

/** Centralized chart-aware color tokens (Recharts can't read CSS vars directly). */
export function useChartColors() {
  const mode = useThemeMode()
  if (mode === 'light') {
    return {
      tooltipBg:     '#ffffff',
      tooltipBorder: '#e2e8f0',
      label:         '#1e293b',
      axis:          '#64748b',
      legend:        '#475569',
    }
  }
  return {
    tooltipBg:     '#1e293b',
    tooltipBorder: '#334155',
    label:         '#e2e8f0',
    axis:          '#94a3b8',
    legend:        '#94a3b8',
  }
}
