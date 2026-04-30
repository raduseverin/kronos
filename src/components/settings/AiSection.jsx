import React, { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { TextField } from '../shared/Form'
import { useSecret } from '../shared/useSecret'
import { ai } from '../../api'
import Section from './Section'

const DEFAULT_DESCRIPTION_PROMPT = 'You are a time tracking assistant. Rewrite the user input as a clear, professional time entry description. Maximum 10 words. No punctuation at the end. Reply with the description only.'
const DEFAULT_CLASSIFY_PROMPT    = 'You are a time tracking classifier. Available projects: {projects}. Reply with ONLY the project name, nothing else.'

const PROVIDERS = [
  { id: 'local',  label: 'Local LLM' },
  { id: 'openai', label: 'OpenAI'    },
  { id: 'gemini', label: 'Gemini'    },
  { id: 'claude', label: 'Claude'    },
]

export default function AiSection() {
  const {
    aiProvider,    setAiProvider,
    lmStudioUrl,   setLmStudioUrl,
    lmStudioModel, setLmStudioModel,
    openaiModel,   setOpenaiModel,
    geminiModel,   setGeminiModel,
    claudeModel,   setClaudeModel,
    aiDescriptionPrompt, setAiDescriptionPrompt,
    aiClassifyPrompt,    setAiClassifyPrompt,
  } = useSettingsStore()

  const [status, setStatus] = useState(null) // null | true | false

  async function checkConnection() {
    setStatus(null)
    setStatus(await ai.isAvailable())
  }

  return (
    <Section title="AI integration">
      {/* Provider picker */}
      <div className="py-3">
        <div className="text-xs text-slate-400 mb-2">Provider</div>
        <div role="radiogroup" className="grid grid-cols-4 gap-1 bg-slate-900/40 rounded-md p-0.5">
          {PROVIDERS.map(({ id, label }) => {
            const active = aiProvider === id
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => { setAiProvider(id); setStatus(null) }}
                className={`py-1.5 text-xs rounded transition-colors duration-fast ${
                  active ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Provider-specific fields */}
      <div className="space-y-3 py-3">
        {aiProvider === 'local' && (
          <>
            <TextField
              label="API URL"
              value={lmStudioUrl}
              onChange={(e) => setLmStudioUrl(e.target.value)}
              mono
              placeholder="http://localhost:1234/v1"
            />
            <p className="text-xs text-slate-500 -mt-1">
              LM Studio: <code className="font-mono">:1234/v1</code> · Ollama:{' '}
              <code className="font-mono">:11434/v1</code>
            </p>
            <TextField
              label="Model"
              value={lmStudioModel}
              onChange={(e) => setLmStudioModel(e.target.value)}
              mono
              placeholder="llama-3.2-3b-instruct"
            />
          </>
        )}

        {aiProvider === 'openai' && (
          <CloudProviderFields
            secretKey="openaiKey"
            keyPlaceholder="sk-..."
            model={openaiModel}
            onModelChange={setOpenaiModel}
            modelPlaceholder="gpt-4o-mini"
          />
        )}

        {aiProvider === 'gemini' && (
          <CloudProviderFields
            secretKey="geminiKey"
            keyPlaceholder="AIza..."
            model={geminiModel}
            onModelChange={setGeminiModel}
            modelPlaceholder="gemini-1.5-flash"
          />
        )}

        {aiProvider === 'claude' && (
          <CloudProviderFields
            secretKey="claudeKey"
            keyPlaceholder="sk-ant-..."
            model={claudeModel}
            onModelChange={setClaudeModel}
            modelPlaceholder="claude-haiku-4-5-20251001"
          />
        )}
      </div>

      {/* Test connection */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={checkConnection}
          className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors duration-fast"
        >
          Test connection
        </button>
        {status === true  && <span className="text-xs text-emerald-400">Connected</span>}
        {status === false && <span className="text-xs text-red-400">Unreachable</span>}
      </div>

      {/* Prompts */}
      <div className="border-t border-slate-800 pt-4 mt-2 space-y-4">
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Prompts</div>

        <PromptField
          label="Description rewrite"
          description="Used when you click ✦ to improve a time entry description"
          value={aiDescriptionPrompt}
          onChange={setAiDescriptionPrompt}
          onReset={() => setAiDescriptionPrompt(DEFAULT_DESCRIPTION_PROMPT)}
        />

        <PromptField
          label="Window classifier"
          description={<>Used for auto-tracking. Use <code className="font-mono text-slate-300">{'{projects}'}</code> where the project list should appear.</>}
          value={aiClassifyPrompt}
          onChange={setAiClassifyPrompt}
          onReset={() => setAiClassifyPrompt(DEFAULT_CLASSIFY_PROMPT)}
        />
      </div>
    </Section>
  )
}

function PromptField({ label, description, value, onChange, onReset }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm text-slate-200">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors duration-fast shrink-0"
        >
          Reset
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-600 outline-none focus:border-violet-500 transition-colors duration-fast resize-y"
      />
    </div>
  )
}

/** API key + model field pair, for cloud LLM providers (OpenAI / Gemini / Claude). */
function CloudProviderFields({ secretKey, keyPlaceholder, model, onModelChange, modelPlaceholder }) {
  const [apiKey, setApiKey] = useSecret(secretKey)
  const loading = apiKey === null
  return (
    <>
      <TextField
        label="API key"
        value={apiKey ?? ''}
        onChange={(e) => setApiKey(e.target.value)}
        mono
        placeholder={loading ? 'Loading…' : keyPlaceholder}
        type="password"
        disabled={loading}
      />
      <TextField
        label="Model"
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        mono
        placeholder={modelPlaceholder}
      />
    </>
  )
}
