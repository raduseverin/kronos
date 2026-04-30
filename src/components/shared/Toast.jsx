import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { XIcon } from './icons'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((toast) => {
    const id = ++idRef.current
    const t = {
      id,
      tone: 'info',
      duration: 8000,
      ...toast,
    }
    setToasts((prev) => [...prev, t])
    if (t.duration > 0) {
      setTimeout(() => dismiss(id), t.duration)
    }
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const TONE_STYLES = {
  info:    'bg-violet-900/80 border-violet-700/80 text-violet-100',
  warning: 'bg-amber-950/80  border-amber-800/70  text-amber-100',
  success: 'bg-emerald-950/80 border-emerald-800/70 text-emerald-100',
  danger:  'bg-red-950/80    border-red-800/70    text-red-100',
}

function ToastRegion({ toasts, onDismiss }) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-12 right-4 z-50 flex flex-col gap-2 pointer-events-none w-[360px] max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  const tone = TONE_STYLES[toast.tone] || TONE_STYLES.info
  return (
    <div
      role="status"
      className={`pointer-events-auto border rounded-xl px-4 py-3 backdrop-blur-md shadow-xl
                  flex items-start gap-3 text-sm animate-slide-down ${tone}`}
    >
      <div className="flex-1 min-w-0">
        {toast.title && <div className="font-semibold leading-tight">{toast.title}</div>}
        {toast.body && <div className="text-xs opacity-90 mt-0.5">{toast.body}</div>}
        {toast.action && (
          <div className="mt-2">{toast.action}</div>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="opacity-60 hover:opacity-100 transition-opacity duration-fast shrink-0 rounded-md p-0.5 -m-0.5"
      >
        <XIcon size={14} />
      </button>
    </div>
  )
}
