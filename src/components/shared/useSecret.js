import { useCallback, useEffect, useState } from 'react'
import { secrets } from '../../api'

/**
 * Read/write a single OS-keychain secret by key.
 *
 * Returns `[value, set]`:
 *   - `value` is `null` while the initial fetch is in flight, then the string
 *     ('' if not set).
 *   - `set(next)` updates the value optimistically and persists via IPC.
 */
export function useSecret(key) {
  const [value, setValue] = useState(null)

  useEffect(() => {
    let mounted = true
    secrets
      .get(key)
      .then((v) => { if (mounted) setValue(v || '') })
      .catch(() => { if (mounted) setValue('') })
    return () => { mounted = false }
  }, [key])

  const update = useCallback(
    async (next) => {
      const v = next ?? ''
      setValue(v)
      try {
        await secrets.set(key, v)
      } catch {
        // best-effort — UI keeps the optimistic value
      }
    },
    [key]
  )

  return [value, update]
}
