import React from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import Modal from '../shared/Modal'
import { PauseIcon } from '../shared/icons'

export default function IdleDialog({ data, onResume, onDismiss }) {
  if (!data) return null

  const { savedCtx, idleStartedAt } = data
  const idleStart = new Date(idleStartedAt)
  const idleDuration = formatDistanceToNow(idleStart)
  const idleTime = format(idleStart, 'h:mm a')

  return (
    <Modal
      open
      onClose={onDismiss}
      size="sm"
      title="Timer paused while idle"
      description={`No activity since ${idleTime} (${idleDuration} ago).`}
      footer={(
        <>
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors duration-fast"
          >
            Keep stopped
          </button>
          <button
            onClick={onResume}
            className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast"
          >
            Resume timer
          </button>
        </>
      )}
    >
      <div className="flex items-start gap-3 pb-4">
        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
          <PauseIcon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          {savedCtx?.projectName ? (
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-md px-3 py-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: savedCtx.projectColor || '#9333ea' }}
              />
              <span className="text-xs text-slate-300 truncate">{savedCtx.projectName}</span>
              {savedCtx.description && (
                <span className="text-xs text-slate-500 truncate">— {savedCtx.description}</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Resume to continue where you left off, or keep the timer stopped.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
