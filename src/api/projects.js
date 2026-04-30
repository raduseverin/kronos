/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} name
 * @property {string} color
 * @property {number?} hourly_rate
 * @property {number?} budget_amount
 * @property {string}  budget_currency
 * @property {string}  display_currency
 * @property {string}  tracking_mode    'monthly' | 'budget'
 * @property {0|1} archived
 * @property {0|1} billable
 * @property {0|1} invoice_auto_gen
 *
 * @typedef {Object} PeriodSummary
 * @property {number} projectId
 * @property {string} trackingMode
 * @property {number?} budgetAmount
 * @property {string} budgetCurrency
 * @property {string} displayCurrency
 * @property {string} periodStart
 * @property {string?} lastResetAt
 * @property {number} usedHours
 * @property {number} usedAmount
 */

const k = () => window.kronos.projects

export const projects = {
  /** @returns {Promise<Project[]>} */
  list:            ()         => k().list(),
  create:          (data)     => k().create(data),
  update:          (id, data) => k().update(id, data),
  delete:          (id)       => k().delete(id),
  /** @returns {Promise<PeriodSummary[]>} */
  periodSummaries: ()         => k().periodSummaries(),
  /** @returns {Promise<PeriodSummary|null>} */
  periodSummary:   (id)       => k().periodSummary(id),
  entries:         (id, from) => k().entries(id, from),
  resetPeriod:     (id)       => k().resetPeriod(id),
  /** @returns {Promise<boolean>} */
  budgetLocked:    (id)       => k().budgetLocked(id),
}
