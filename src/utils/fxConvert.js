/**
 * Cross-currency conversion using a USD-pivot map from open.er-style APIs.
 * `rates[CCY]` is how many units of CCY equal one USD (i.e. 1 USD == rates[CCY] CCY).
 * Pure function — safe to unit-test without React or IPC.
 */
export function convertWithRates(rates, amount, from, to) {
  if (amount == null || isNaN(amount)) return amount
  if (!from || !to || from === to) return amount
  const rFrom = rates[from]
  const rTo = rates[to]
  if (!rFrom || !rTo) return amount
  return (amount / rFrom) * rTo
}
