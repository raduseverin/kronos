import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      autoTrackEnabled: true,
      idleDetectionEnabled: true,
      idleThresholdMinutes: 5,
      // AI provider: 'local' | 'openai' | 'gemini' | 'claude'
      // API keys for cloud providers live in the OS keychain via `secretsService`,
      // not here. Use the `useSecret(...)` hook to read/write them.
      aiProvider:   'local',
      lmStudioUrl:  'http://localhost:1234/v1',
      lmStudioModel: 'llama-3.2-3b-instruct',
      openaiModel:  'gpt-4o-mini',
      geminiModel:  'gemini-1.5-flash',
      claudeModel:  'claude-haiku-4-5-20251001',
      aiDescriptionPrompt: 'You are a time tracking assistant. Rewrite the user input as a clear, professional time entry description. Maximum 10 words. No punctuation at the end. Reply with the description only.',
      aiClassifyPrompt: 'You are a time tracking classifier. Available projects: {projects}. Reply with ONLY the project name, nothing else.',
      defaultBillable: true,
      weekStartsOn: 1,   // 0 = Sunday, 1 = Monday
      theme: 'dark',     // 'system' | 'dark' | 'light'
      // Feature: global shortcut
      globalShortcut: 'CmdOrCtrl+Shift+Space',
      // Feature: invoice rounding ('none' | '6' | '15' | '30' | '60' minutes)
      invoiceRounding: 'none',
      // Feature: Pomodoro
      pomodoroEnabled: false,
      pomodoroWork:    25,
      pomodoroBreak:    5,
      // Feature: Quick-start templates
      templatesEnabled: true,

      setAutoTrackEnabled:     (val) => set({ autoTrackEnabled: val }),
      setIdleDetectionEnabled: (val) => set({ idleDetectionEnabled: val }),
      setIdleThresholdMinutes: (val) => set({ idleThresholdMinutes: val }),
      setAiProvider:           (val) => set({ aiProvider: val }),
      setLmStudioUrl:          (val) => set({ lmStudioUrl: val }),
      setLmStudioModel:        (val) => set({ lmStudioModel: val }),
      setOpenaiModel:          (val) => set({ openaiModel: val }),
      setGeminiModel:          (val) => set({ geminiModel: val }),
      setClaudeModel:          (val) => set({ claudeModel: val }),
      setAiDescriptionPrompt:  (val) => set({ aiDescriptionPrompt: val }),
      setAiClassifyPrompt:     (val) => set({ aiClassifyPrompt: val }),
      setDefaultBillable:      (val) => set({ defaultBillable: val }),
      setWeekStartsOn:         (val) => set({ weekStartsOn: val }),
      setTheme:                (val) => set({ theme: val }),
      setGlobalShortcut:       (val) => set({ globalShortcut: val }),
      setInvoiceRounding:      (val) => set({ invoiceRounding: val }),
      setPomodoroEnabled:      (val) => set({ pomodoroEnabled: val }),
      setPomodoroWork:         (val) => set({ pomodoroWork: val }),
      setPomodoroBreak:        (val) => set({ pomodoroBreak: val }),
      setTemplatesEnabled:     (val) => set({ templatesEnabled: val }),
    }),
    {
      name: 'kronos-settings',
    }
  )
)
