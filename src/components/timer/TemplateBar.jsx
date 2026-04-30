import React, { useEffect, useState } from 'react'
import Modal from '../shared/Modal'
import ProjectSelector from '../shared/ProjectSelector'
import { PlusIcon, XIcon } from '../shared/icons'
import { templates as templatesApi, timer } from '../../api'

export default function TemplateBar({ onStart }) {
  const [list, setList]           = useState([])
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    setList(await templatesApi.list())
  }

  useEffect(() => { load() }, [])

  async function handleStart(tpl) {
    await timer.start({
      projectId:   tpl.project_id,
      description: tpl.description || '',
      billable:    !!tpl.billable,
    })
    onStart?.()
  }

  async function handleDelete(id) {
    await templatesApi.delete(id)
    load()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap min-h-[26px]">
      {list.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          onClick={() => handleStart(tpl)}
          className="group relative flex items-center gap-1.5 pl-2.5 pr-1.5 py-1
                     rounded-full bg-slate-800 border border-slate-700
                     hover:border-violet-500 hover:bg-slate-700
                     transition-colors text-xs text-slate-300 max-w-[180px]"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: tpl.project_color || '#6b7280' }}
          />
          <span className="truncate">
            {tpl.description || tpl.project_name || 'Template'}
          </span>
          <span
            role="button"
            aria-label="Delete template"
            onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-slate-500 hover:text-red-400 p-0.5 rounded"
          >
            <XIcon size={10} />
          </span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        aria-label="Add template"
        className="w-6 h-6 rounded-full border border-dashed border-slate-600
                   hover:border-violet-500 hover:text-violet-400
                   flex items-center justify-center text-slate-500 transition-colors"
      >
        <PlusIcon size={12} />
      </button>

      {showCreate && (
        <CreateTemplateModal
          onSave={() => { setShowCreate(false); load() }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

// ── Create modal ────────────────────────────────────────────────────────────

function CreateTemplateModal({ onSave, onClose }) {
  const [description, setDescription] = useState('')
  const [projectId,   setProjectId]   = useState(null)
  const [billable,    setBillable]     = useState(true)

  async function handleSave() {
    if (!description.trim()) return
    await templatesApi.create({ description: description.trim(), projectId, billable })
    onSave()
  }

  return (
    <Modal
      title="New Quick-Start Template"
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors duration-fast"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!description.trim()}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-md disabled:opacity-50 transition-colors duration-fast font-medium"
          >
            Save
          </button>
        </>
      )}
    >
      <div className="space-y-4 py-2" onKeyDown={(e) => e.key === 'Enter' && handleSave()}>
        <label className="block">
          <span className="text-xs text-slate-400 block mb-1.5">Description</span>
          <input
            autoFocus
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Client A — Weekly sync"
            className="input-base w-full"
          />
        </label>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">Project</span>
          <ProjectSelector value={projectId} onChange={setProjectId} />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="accent-violet-500"
          />
          <span className="text-xs text-slate-300">Billable</span>
        </label>
      </div>
    </Modal>
  )
}
