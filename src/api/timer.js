/**
 * @typedef {Object} TimeEntry
 * @property {number}  id
 * @property {number?} project_id
 * @property {string?} project_name
 * @property {string?} project_color
 * @property {string?} description
 * @property {string}  started_at
 * @property {string?} stopped_at
 * @property {0|1}     billable
 * @property {string}  source         'manual' | 'auto' | 'ai'
 */

const k = () => window.kronos.timer

export const timer = {
  /** @returns {Promise<TimeEntry|null>} */
  start:     (data)         => k().start(data),
  /** @returns {Promise<TimeEntry|null>} */
  stop:      ()             => k().stop(),
  /** @returns {Promise<TimeEntry|null>} */
  getActive: ()             => k().getActive(),
  /** @returns {Promise<TimeEntry[]>} */
  getWeek:        (from, to) => k().getWeek(from, to),
  /** @returns {Promise<number>} total seconds tracked today (optionally for one project) */
  getDailySeconds: (projectId) => k().getDailySeconds(projectId),
  pause:           ()          => k().pause(),
  resume:          ()          => k().resume(),
  isPaused:        ()          => k().isPaused(),
  update:    (id, data)     => k().update(id, data),
  delete:    (id)           => k().delete(id),
  /** @returns {Promise<TimeEntry>} */
  addManual: (data)         => k().addManual(data),
}
