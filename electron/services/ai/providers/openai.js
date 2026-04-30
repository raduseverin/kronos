import { Provider } from './Provider.js'
import { secretsService } from '../../secretsService.js'

const HEALTH_TIMEOUT_MS   = 4_000
const COMPLETE_TIMEOUT_MS = 10_000

export class OpenAIProvider extends Provider {
  get apiKey() {
    return secretsService.get('openaiKey') || ''
  }

  async isAvailable() {
    if (!this.apiKey) return false
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async complete({ system, user, maxTokens, temperature }) {
    const apiKey = this.apiKey
    if (!apiKey) return null

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.openaiModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user },
        ],
        max_tokens:  maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(COMPLETE_TIMEOUT_MS),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  }
}
