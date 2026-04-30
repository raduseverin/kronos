/**
 * @typedef {Object} RatesResult
 * @property {Record<string, number>} rates
 * @property {string} fetchedAt
 * @property {boolean} [stale]
 */

const k = () => window.kronos.currencies

export const currencies = {
  /** @returns {Promise<RatesResult>} */
  getRates: (base) => k().getRates(base),
  /** @returns {Promise<RatesResult>} */
  refresh:  (base) => k().refresh(base),
}
