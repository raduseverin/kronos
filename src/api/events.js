import { useEffect } from 'react'

/**
 * Imperative event surface — kept for code that needs to manage subscriptions
 * by hand. Most components should use {@link useIpcEvent} instead.
 */
export const events = {
  on:  (channel, callback) => window.kronos.on(channel, callback),
  off: (channel, callback) => window.kronos.off(channel, callback),
}

/**
 * Subscribe to a main → renderer IPC event for the lifetime of the calling
 * component. Equivalent to:
 *
 *   useEffect(() => {
 *     window.kronos.on(channel, handler)
 *     return () => window.kronos.off(channel, handler)
 *   }, [channel, handler])
 *
 * Pass a stable handler (with `useCallback` if it captures props) when you
 * don't want re-subscriptions on every render.
 */
export function useIpcEvent(channel, handler) {
  useEffect(() => {
    window.kronos.on(channel, handler)
    return () => window.kronos.off(channel, handler)
  }, [channel, handler])
}
