import { Provider } from './Provider.js'

const HEALTH_TIMEOUT_MS   = 2_000
const COMPLETE_TIMEOUT_MS = 8_000

/** Local LLM endpoint speaking the OpenAI-compatible API (LM Studio, Ollama, vLLM, …). */
export class LocalProvider extends Provider {
  async isAvailable() {
    try {
      const res = await fetch(`${this.cfg.localUrl}/models`, {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async complete({ system, user, maxTokens, temperature }) {
    const res = await fetch(`${this.cfg.localUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.cfg.localModel,
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
