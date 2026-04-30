import { Provider } from './Provider.js'
import { secretsService } from '../../secretsService.js'

const HEALTH_TIMEOUT_MS   = 6_000
const COMPLETE_TIMEOUT_MS = 10_000

export class ClaudeProvider extends Provider {
  get apiKey() {
    return secretsService.get('claudeKey') || ''
  }

  async isAvailable() {
    if (!this.apiKey) return false
    try {
      // Anthropic doesn't expose a cheap health endpoint, so we send a one-token
      // user message. Cheap, but real network call.
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        body: JSON.stringify({
          model:      this.cfg.claudeModel,
          max_tokens: 1,
          messages:   [{ role: 'user', content: 'hi' }],
        }),
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async complete({ system, user, maxTokens }) {
    const apiKey = this.apiKey
    if (!apiKey) return null

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      this.cfg.claudeModel,
        max_tokens: maxTokens,
        system,
        messages:   [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(COMPLETE_TIMEOUT_MS),
    })
    const data = await res.json()
    return data.content?.[0]?.text?.trim() ?? null
  }
}
