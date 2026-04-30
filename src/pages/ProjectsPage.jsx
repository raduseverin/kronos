import React, { useEffect, useState } from 'react'
import PageHeader from '../components/shared/PageHeader'
import EmptyState from '../components/shared/EmptyState'
import { FolderIcon } from '../components/shared/icons'
import { projects as projectsApi, clients as clientsApi } from '../api'
import ProjectCard   from '../components/projects/ProjectCard'
import ProjectDetail from '../components/projects/ProjectDetail'
import ProjectModal  from '../components/projects/ProjectModal'
import ClientModal   from '../components/projects/ClientModal'

/**
 * Top-level switch between the projects list (with create/edit modals) and a
 * single-project detail view. All heavy lifting lives in
 * `src/components/projects/*`.
 */
export default function ProjectsPage({ onNavigate }) {
  const [projects,      setProjects]      = useState([])
  const [clients,       setClients]       = useState([])
  const [summaries,     setSummaries]     = useState({})
  const [modal,         setModal]         = useState(null) // null | 'project' | 'client'
  const [editing,       setEditing]       = useState(null)
  const [detailProject, setDetailProject] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [p, c, s] = await Promise.all([
      projectsApi.list(),
      clientsApi.list(),
      projectsApi.periodSummaries(),
    ])
    setProjects(p)
    setClients(c)
    setSummaries(Object.fromEntries(s.map((x) => [x.projectId, x])))
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project? Time entries will be unlinked.')) return
    await projectsApi.delete(id)
    load()
  }

  async function toggleArchive(p) {
    await projectsApi.update(p.id, { archived: !p.archived })
    load()
  }

  async function handleProjectSave(data) {
    if (editing) {
      const updated = await projectsApi.update(editing.id, data)
      if (detailProject?.id === editing.id) setDetailProject(updated)
    } else {
      await projectsApi.create(data)
    }
    setModal(null)
    setEditing(null)
    load()
  }

  const active   = projects.filter((p) => !p.archived)
  const archived = projects.filter((p) =>  p.archived)

  return (
    <>
      {detailProject ? (
        <ProjectDetail
          project={detailProject}
          onBack={() => { setDetailProject(null); load() }}
          onNavigate={onNavigate}
          onEdit={() => { setEditing(detailProject); setModal('project') }}
        />
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            title="Projects"
            subtitle="Track time per client, set budgets, and auto-bill from a project"
            actions={(
              <>
                <button
                  onClick={() => setModal('client')}
                  className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors duration-fast"
                >
                  + Client
                </button>
                <button
                  onClick={() => { setEditing(null); setModal('project') }}
                  className="text-xs px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors duration-fast font-medium"
                >
                  + Project
                </button>
              </>
            )}
          />

          <div className="space-y-2">
            {active.length === 0 && (
              <EmptyState
                icon={<FolderIcon size={36} />}
                title="No projects yet"
                body="Projects let you group time entries, set hourly rates, and auto-generate invoices."
                action={(
                  <button
                    onClick={() => { setEditing(null); setModal('project') }}
                    className="text-xs px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors duration-fast font-medium"
                  >
                    Create your first project
                  </button>
                )}
              />
            )}
            {active.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                summary={summaries[p.id]}
                onClick={() => setDetailProject(p)}
                onEdit={(e)    => { e.stopPropagation(); setEditing(p); setModal('project') }}
                onArchive={(e) => { e.stopPropagation(); toggleArchive(p) }}
                onDelete={(e)  => { e.stopPropagation(); deleteProject(p.id) }}
                onGenerateInvoice={(e) => { e.stopPropagation(); onNavigate?.('invoices', { preProject: p }) }}
              />
            ))}
          </div>

          {archived.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Archived</div>
              {archived.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  summary={null}
                  onClick={() => setDetailProject(p)}
                  onEdit={(e)    => { e.stopPropagation(); setEditing(p); setModal('project') }}
                  onArchive={(e) => { e.stopPropagation(); toggleArchive(p) }}
                  onDelete={(e)  => { e.stopPropagation(); deleteProject(p.id) }}
                  onGenerateInvoice={null}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {modal === 'project' && (
        <ProjectModal
          project={editing}
          clients={clients}
          onSave={handleProjectSave}
          onClose={() => { setModal(null); setEditing(null) }}
        />
      )}
      {modal === 'client' && (
        <ClientModal
          onSave={async (data) => { await clientsApi.create(data); setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
