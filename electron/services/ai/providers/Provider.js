/**
 * Strategy contract for an LLM provider.
 *
 * Subclasses implement two methods. Both are called from `aiService` only;
 * they should return falsy values rather than throw on transport errors so
 * the service layer can degrade gracefully (auto-tracking and AI suggestions
 * are best-effort features).
 */
export class Provider {
  /**
   * @param {Object} cfg shared aiService config (model names, local URL, etc.)
   */
  constructor(cfg) {
    this.cfg = cfg
  }

  /** @returns {Promise<boolean>} */
  async isAvailable() {
    return false
  }

  /**
   * @param {{ system: string, user: string, maxTokens: number, temperature: number }} _opts
   * @returns {Promise<string|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async complete(_opts) {
    return null
  }
}
