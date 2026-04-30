import React, { useEffect, useState } from 'react'
import { projects as projectsApi } from '../../api'

export default function ProjectSelector({ value, onChange, tabIndex }) {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    projectsApi.list().then(setProjects)
  }, [])

  return (
    <select
      tabIndex={tabIndex}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="bg-slate-700 text-slate-300 text-xs rounded-md px-2 py-1.5 border border-slate-600 outline-none transition-colors duration-fast focus:border-violet-500 shrink-0 max-w-[160px]"
    >
      <option value="">No project</option>
      {projects
        .filter((p) => !p.archived)
        .map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
    </select>
  )
}
