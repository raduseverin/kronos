import React, { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import TimerPage from './pages/TimerPage'
import ReportsPage from './pages/ReportsPage'
import ProjectsPage from './pages/ProjectsPage'
import SettingsPage from './pages/SettingsPage'
import InvoicePage from './pages/InvoicePage'
import CurrenciesPage from './pages/CurrenciesPage'
import IdleDialog from './components/timer/IdleDialog'
import { ToastProvider, useToast } from './components/shared/Toast'
import { useTimerStore } from './store/timerStore'
import { useSettingsStore } from './store/settingsStore'
import { ai, autoTrack, idle, shortcut, secrets, events } from './api'

const PAGES = {
  timer:      TimerPage,
  reports:    ReportsPage,
  projects:   ProjectsPage,
  invoices:   InvoicePage,
  currencies: CurrenciesPage,
  settings:   SettingsPage,
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  )
}

function AppShell() {
  const [activePage, setActivePage] = useState('timer')
  const [navContext, setNavContext] = useState(null)
  const [idleResumeData, setIdleResumeData] = useState(null)

  const { setActiveEntry } = useTimerStore()
  const {
    autoTrackEnabled,
    idleDetectionEnabled, idleThresholdMinutes,
    aiProvider, lmStudioUrl, lmStudioModel,
    openaiModel, geminiModel, claudeModel,
    aiDescriptionPrompt, aiClassifyPrompt,
    theme,
    globalShortcut: shortcutKey,
  } = useSettingsStore()
  const toast = useToast()

  // Apply theme to <html data-theme="…"> and react to OS changes when 'system'.
  useEffect(() => {
    const root = document.documentElement
    const apply = (resolved) => root.setAttribute('data-theme', resolved)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      apply(mq.matches ? 'light' : 'dark')
      const onChange = (e) => apply(e.matches ? 'light' : 'dark')
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    apply(theme === 'light' ? 'light' : 'dark')
  }, [theme])

  useEffect(() => {
    shortcut.configure(shortcutKey)
  }, [shortcutKey])

  useEffect(() => {
    idle.configure({
      enabled: idleDetectionEnabled,
      thresholdSeconds: idleThresholdMinutes * 60,
    })
  }, [idleDetectionEnabled, idleThresholdMinutes])

  useEffect(() => {
    autoTrack.configure({ enabled: autoTrackEnabled })
  }, [autoTrackEnabled])

  useEffect(() => {
    // Keys are not passed here — main reads them on-demand from secretsService.
    ai.configure({
      provider: aiProvider,
      localUrl: lmStudioUrl, localModel: lmStudioModel,
      openaiModel,
      geminiModel,
      claudeModel,
      descriptionPrompt: aiDescriptionPrompt,
      classifyPrompt:    aiClassifyPrompt,
    })
  }, [aiProvider, lmStudioUrl, lmStudioModel, openaiModel, geminiModel, claudeModel, aiDescriptionPrompt, aiClassifyPrompt])

  // One-time migration: lift legacy plaintext API keys out of `localStorage`
  // (kronos-settings) into the OS keychain via secretsService, then strip them
  // from the persisted settings blob. Idempotent: a no-op once migrated.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kronos-settings')
      if (!raw) return
      const parsed = JSON.parse(raw)
      const state = parsed?.state
      if (!state) return

      const legacy = {}
      for (const k of ['openaiKey', 'geminiKey', 'claudeKey']) {
        if (typeof state[k] === 'string' && state[k].length > 0) legacy[k] = state[k]
      }
      const hadLegacy = Object.keys(legacy).length > 0

      if (hadLegacy) {
        secrets.setMany(legacy).catch(() => {})
      }
      // Always strip the fields, even if they were empty strings, so the
      // localStorage blob converges to the new shape.
      let dirty = false
      for (const k of ['openaiKey', 'geminiKey', 'claudeKey']) {
        if (k in state) { delete state[k]; dirty = true }
      }
      if (dirty) localStorage.setItem('kronos-settings', JSON.stringify(parsed))
    } catch {
      // best-effort migration — never block startup
    }
  }, [])

  // ── Auto-invoice notification ───────────────────────────────────────────
  useEffect(() => {
    const handler = (inv) => {
      toast.push({
        tone: 'info',
        title: `Invoice #${inv.invoice_number} created`,
        body: 'Draft saved — review and send when ready.',
        action: (
          <button
            onClick={() => navigateTo('invoices', { editInvoice: inv })}
            className="text-xs font-medium text-violet-200 hover:text-white underline-offset-2 hover:underline transition-colors duration-fast"
          >
            View invoice →
          </button>
        ),
      })
    }
    events.on('invoice:auto-created', handler)
    return () => events.off('invoice:auto-created', handler)
  }, [toast])

  // ── Idle detection ──────────────────────────────────────────────────────
  useEffect(() => {
    let idleToastId = null

    function onIdleDetected() {
      setActiveEntry(null)
      idleToastId = toast.push({
        tone: 'warning',
        title: 'Timer paused',
        body: 'No activity detected.',
        duration: 0, // sticky until activity resumes
      })
    }
    function onActivityResumed(data) {
      if (idleToastId) {
        toast.dismiss(idleToastId)
        idleToastId = null
      }
      if (data?.savedCtx) setIdleResumeData(data)
    }
    events.on('idle-detected',    onIdleDetected)
    events.on('activity-resumed', onActivityResumed)
    return () => {
      events.off('idle-detected',    onIdleDetected)
      events.off('activity-resumed', onActivityResumed)
    }
  }, [setActiveEntry, toast])

  async function handleIdleResume() {
    const entry = await idle.resume()
    if (entry) setActiveEntry(entry)
    setIdleResumeData(null)
  }

  function navigateTo(page, context = null) {
    setNavContext(context)
    setActivePage(page)
  }

  const Page = PAGES[activePage] ?? TimerPage

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={(page) => navigateTo(page)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        {idleResumeData && (
          <IdleDialog
            data={idleResumeData}
            onResume={handleIdleResume}
            onDismiss={() => setIdleResumeData(null)}
          />
        )}
        <main className="flex-1 overflow-auto p-6">
          <Page onNavigate={navigateTo} navContext={navContext} />
        </main>
      </div>
    </div>
  )
}
