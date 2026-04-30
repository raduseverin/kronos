import { create } from 'zustand'
import { formatHHMMSS } from '../utils/duration'

export const useTimerStore = create((set, get) => ({
  activeEntry: null,
  elapsedSeconds: 0,
  isPaused: false,
  autoTrackedProject: null,
  _intervalId: null,

  setActiveEntry(entry) {
    const { _intervalId } = get()
    if (_intervalId) clearInterval(_intervalId)

    if (!entry) {
      set({ activeEntry: null, elapsedSeconds: 0, _intervalId: null, isPaused: false })
      return
    }
    set({ isPaused: false })

    const startedAt = new Date(entry.started_at)
    const tick = () => set({ elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) })
    tick()
    const id = setInterval(tick, 1000)
    set({ activeEntry: entry, _intervalId: id })
  },

  setPaused(val) { set({ isPaused: val }) },

  setAutoTrackedProject(project) {
    set({ autoTrackedProject: project })
  },

  formatElapsed() {
    return formatHHMMSS(get().elapsedSeconds)
  },
}))
