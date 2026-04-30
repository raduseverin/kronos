import { Provider } from './Provider.js'
import { secretsService } from '../../secretsService.js'

const HEALTH_TIMEOUT_MS   = 4_000
const COMPLETE_TIMEOUT_MS = 10_000

export class GeminiProvider extends Provider {
  get apiKey() {
    return secretsService.get('geminiKey') || ''
  }

  async isAvailable() {
    if (!this.apiKey) return false
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) },
      )
      return res.ok
    } catch {
      return false
    }
  }

  async complete({ system, user, maxTokens }) {
    const apiKey = this.apiKey
    if (!apiKey) return null

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.cfg.geminiModel}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents:           [{ parts: [{ text: user   }] }],
        generationConfig:   { maxOutputTokens: maxTokens },
      }),
      signal: AbortSignal.timeout(COMPLETE_TIMEOUT_MS),
    })
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null
  }
}
