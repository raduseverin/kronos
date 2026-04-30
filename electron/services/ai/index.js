import { LocalProvider }  from './providers/local.js'
import { OpenAIProvider } from './providers/openai.js'
import { GeminiProvider } from './providers/gemini.js'
import { ClaudeProvider } from './providers/claude.js'

/**
 * Multi-provider LLM gateway. Replaces the older `lmStudioService` (which
 * was misnamed — it always handled four providers).
 *
 * Each provider implements the {@link Provider} contract; adding a fifth
 * is a one-file change plus a new entry in {@link PROVIDERS}.
 */

const PROVIDERS = {
  local:  LocalProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  claude: ClaudeProvider,
}

const DEFAULTS = {
  descriptionPrompt: 'You are a time tracking assistant. Rewrite the user input as a clear, professional time entry description. Maximum 10 words. No punctuation at the end. Reply with the description only.',
  classifyPrompt: 'You are a time tracking classifier. Available projects: {projects}. Reply with ONLY the project name, nothing else.',
}

const cfg = {
  provider:    'local',
  localUrl:    'http://localhost:1234/v1',
  localModel:  'llama-3.2-3b-instruct',
  openaiModel: 'gpt-4o-mini',
  geminiModel: 'gemini-1.5-flash',
  claudeModel: 'claude-haiku-4-5-20251001',
  descriptionPrompt: DEFAULTS.descriptionPrompt,
  classifyPrompt:    DEFAULTS.classifyPrompt,
}

// Cache isAvailable() result so auto-tracking doesn't hammer cloud APIs every 5 s.
const AVAILABILITY_TTL_MS = 60_000
let availabilityCache = { result: null, expiresAt: 0 }

function selectProvider() {
  const Cls = PROVIDERS[cfg.provider] || LocalProvider
  return new Cls(cfg)
}

async function safeComplete(opts) {
  try {
    return await selectProvider().complete(opts)
  } catch {
    return null
  }
}

export const aiService = {
  /** Push partial config updates from the renderer (provider, models, URL). */
  configure(updates = {}) {
    Object.assign(cfg, updates)
    availabilityCache = { result: null, expiresAt: 0 } // invalidate on config change
  },

  async isAvailable() {
    if (Date.now() < availabilityCache.expiresAt) return availabilityCache.result
    const result = await selectProvider().isAvailable().catch(() => false)
    availabilityCache = { result, expiresAt: Date.now() + AVAILABILITY_TTL_MS }
    return result
  },

  async suggestDescription(rawText) {
    return safeComplete({
      system: cfg.descriptionPrompt || DEFAULTS.descriptionPrompt,
      user: rawText,
      maxTokens: 30,
      temperature: 0.3,
    })
  },

  async classifyWindow(windowTitle, projectNames) {
    const promptTemplate = cfg.classifyPrompt || DEFAULTS.classifyPrompt
    const system = promptTemplate.replace('{projects}', `${projectNames.join(', ')}, Unknown`)
    const result = await safeComplete({
      system,
      user: `Active window: ${windowTitle}`,
      maxTokens: 10,
      temperature: 0,
    })
    return projectNames.includes(result) ? result : null
  },
}
