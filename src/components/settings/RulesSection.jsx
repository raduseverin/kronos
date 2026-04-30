import React, { useEffect, useState } from 'react'
import { projects as projectsApi, rules as rulesApi } from '../../api'
import { XIcon } from '../shared/icons'
import Section from './Section'

export default function RulesSection() {
  const [rules, setRules]                 = useState([])
  const [projects, setProjects]           = useState([])
  const [keyword, setKeyword]             = useState('')
  const [projectId, setProjectId]         = useState('')
  const [priority, setPriority]           = useState(0)

  async function load() {
    const [r, p] = await Promise.all([rulesApi.list(), projectsApi.list()])
    setRules(r)
    setProjects(p.filter((proj) => !proj.archived))
  }

  useEffect(() => { load() }, [])

  async function addRule() {
    if (!keyword.trim() || !projectId) return
    await rulesApi.create({
      keyword:   keyword.trim(),
      projectId: Number(projectId),
      priority:  Number(priority),
    })
    setKeyword('')
    setProjectId('')
    setPriority(0)
    load()
  }

  async function deleteRule(id) {
    await rulesApi.delete(id)
    load()
  }

  return (
    <Section title="Auto-track rules">
      <p className="text-xs text-slate-500 mb-3">
        Map window-title keywords to projects. Higher priority is checked first.
      </p>

      {/* Existing rules */}
      <div className="space-y-1 mb-4">
        {rules.length === 0 && <p className="text-xs text-slate-600">No rules yet.</p>}
        {rules.map((r) => (
          <RuleRow key={r.id} rule={r} onDelete={() => deleteRule(r.id)} />
        ))}
      </div>

      {/* Add rule */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 min-w-0">
          <input
            placeholder="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRule()}
            className="input-mono"
          />
        </div>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="input-base !w-auto"
        >
          <option value="">Project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="pri"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input-base !w-16 text-center"
        />
        <button
          onClick={addRule}
          className="px-3 py-2 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast font-medium"
        >
          Add
        </button>
      </div>
    </Section>
  )
}

function RuleRow({ rule, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-md text-sm border border-slate-700/60">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: rule.project_color }}
      />
      <code className="flex-1 text-violet-300 text-xs font-mono truncate">{rule.keyword}</code>
      <span className="text-slate-400 text-xs">{rule.project_name}</span>
      <span className="text-slate-600 text-xs">p{rule.priority}</span>
      <button
        onClick={onDelete}
        aria-label="Delete rule"
        className="text-slate-500 hover:text-red-400 transition-colors duration-fast p-1 rounded-md"
      >
        <XIcon size={12} />
      </button>
    </div>
  )
}
