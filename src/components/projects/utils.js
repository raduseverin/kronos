/** Convenience readers for the new currency schema, with full back-compat to legacy `currency`. */
export const budgetCurOf  = (p) => p?.budget_currency  || p?.currency || 'EUR'
export const displayCurOf = (p) => p?.display_currency || p?.budget_currency || p?.currency || 'EUR'

/** Curated palette — 12 hues, evenly spaced, no near-duplicates. */
export const COLORS = [
  '#9333ea', // violet (default)
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#f43f5e', // rose
  '#ec4899', // pink
  '#d946ef', // fuchsia
  '#64748b', // slate (neutral)
]

export { COMMON_CURRENCIES } from '../../constants/currencies'
