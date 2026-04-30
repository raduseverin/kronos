import React, { forwardRef } from 'react'
import { MinusIcon, PlusIcon } from './icons'

/**
 * Consistent form controls. Every field uses the same focus, border, padding,
 * and disabled tone — driven by the .input-base utility in index.css.
 */

export const TextField = forwardRef(function TextField(
  { label, hint, error, mono = false, className = '', ...rest },
  ref
) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input
        ref={ref}
        type="text"
        className={`${mono ? 'input-mono' : 'input-base'} ${className}`}
        {...rest}
      />
    </Field>
  )
})

export const NumberField = forwardRef(function NumberField(
  { label, hint, error, className = '', ...rest },
  ref
) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input
        ref={ref}
        type="number"
        className={`input-base ${className}`}
        {...rest}
      />
    </Field>
  )
})

export const SelectField = forwardRef(function SelectField(
  { label, hint, error, children, className = '', ...rest },
  ref
) {
  return (
    <Field label={label} hint={hint} error={error}>
      <select
        ref={ref}
        className={`input-base appearance-none bg-no-repeat bg-right pr-8 ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
          backgroundPosition: 'right 0.6rem center',
          backgroundSize: '0.85rem',
        }}
        {...rest}
      >
        {children}
      </select>
    </Field>
  )
})

export const TextArea = forwardRef(function TextArea(
  { label, hint, error, className = '', rows = 3, ...rest },
  ref
) {
  return (
    <Field label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        rows={rows}
        className={`input-base resize-none ${className}`}
        {...rest}
      />
    </Field>
  )
})

/** A − [value] + stepper to replace number inputs with no-look spinner controls. */
export function Stepper({ label, hint, value, onChange, min = 0, max = 999, step = 1, suffix, className = '' }) {
  const v = Number(value) || 0
  const dec = () => onChange(Math.max(min, v - step))
  const inc = () => onChange(Math.min(max, v + step))

  return (
    <Field label={label} hint={hint}>
      <div className={`inline-flex items-center bg-slate-700 border border-slate-600 rounded-md text-sm overflow-hidden ${className}`}>
        <button
          type="button"
          onClick={dec}
          disabled={v <= min}
          aria-label="Decrease"
          className="px-2.5 py-1.5 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-fast"
        >
          <MinusIcon size={12} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)))
          }}
          min={min}
          max={max}
          step={step}
          className="w-12 bg-transparent text-center text-slate-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={inc}
          disabled={v >= max}
          aria-label="Increase"
          className="px-2.5 py-1.5 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-fast"
        >
          <PlusIcon size={12} />
        </button>
        {suffix && <span className="pr-3 text-xs text-slate-400">{suffix}</span>}
      </div>
    </Field>
  )
}

/** Switch / toggle. ARIA-correct. */
export function Toggle({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-2 gap-4">
      <div className="min-w-0">
        <div className="text-sm text-slate-200">{label}</div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === 'string' ? label : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-fast shrink-0 ${
          checked ? 'bg-violet-600' : 'bg-slate-600'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-fast ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function Field({ label, hint, error, children }) {
  if (!label && !hint && !error) return children
  return (
    <label className="block">
      {label && <span className="text-xs text-slate-400 mb-1.5 block">{label}</span>}
      {children}
      {error
        ? <span className="text-xs text-red-400 mt-1 block">{error}</span>
        : hint
          ? <span className="text-xs text-slate-500 mt-1 block">{hint}</span>
          : null}
    </label>
  )
}
