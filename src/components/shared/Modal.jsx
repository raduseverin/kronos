import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from './icons'

/**
 * Accessible modal built on Radix Dialog.
 * - Focus trap, ESC to close, focus restoration handled by Radix.
 * - `size`: sm | md | lg controls max-width.
 * - `children` is the body. Use the `footer` prop for action rows.
 */
export default function Modal({
  open = true,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
  initialFocusRef,
}) {
  const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[size] || 'max-w-md'

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            if (initialFocusRef?.current) {
              e.preventDefault()
              initialFocusRef.current.focus()
            }
          }}
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] ${widthClass}
                      bg-slate-900 border border-slate-700 rounded-xl shadow-2xl
                      flex flex-col max-h-[90vh] outline-none
                      animate-fade-in-scale ${className}`}
        >
          {(title || onClose) && (
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3 shrink-0">
              <div className="min-w-0">
                {title && <Dialog.Title className="text-base font-semibold text-slate-100">{title}</Dialog.Title>}
                {description && <Dialog.Description className="text-xs text-slate-500 mt-1">{description}</Dialog.Description>}
              </div>
              {onClose && (
                <Dialog.Close asChild>
                  <button
                    aria-label="Close"
                    className="text-slate-500 hover:text-slate-200 transition-colors duration-fast rounded-md p-1 -m-1"
                  >
                    <XIcon size={16} />
                  </button>
                </Dialog.Close>
              )}
            </div>
          )}

          <div className="px-6 pb-2 overflow-y-auto flex-1">
            {children}
          </div>

          {footer && (
            <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
