import React, { useEffect, useState } from 'react'
import {
  format,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  addWeeks, addMonths,
} from 'date-fns'
import { useSettingsStore } from '../store/settingsStore'
import PageHeader from '../components/shared/PageHeader'
import SummaryReport from '../components/reports/SummaryReport'
import DurationByDay from '../components/reports/DurationByDay'
import ProjectDonut from '../components/reports/ProjectDonut'
import { Skeleton } from '../components/shared/Skeleton'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/shared/icons'
import { reports } from '../api'

export default function ReportsPage() {
  const { weekStartsOn } = useSettingsStore()
  const [mode, setMode] = useState('week')   // 'week' | 'month'
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState(null)
  const [exporting, setExporting] = useState(false)

  const now = new Date()

  const { from, to, label } = (() => {
    if (mode === 'week') {
      const base = addWeeks(now, offset)
      const start = startOfWeek(base, { weekStartsOn })
      const end   = endOfWeek(base, { weekStartsOn })
      return {
        from:  format(start, 'yyyy-MM-dd'),
        to:    format(end,   'yyyy-MM-dd'),
        label: offset === 0
          ? `This week · ${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
          : `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
      }
    } else {
      const base  = addMonths(now, offset)
      const start = startOfMonth(base)
      const end   = endOfMonth(base)
      return {
        from:  format(start, 'yyyy-MM-dd'),
        to:    format(end,   'yyyy-MM-dd'),
        label: format(base, 'MMMM yyyy'),
      }
    }
  })()

  useEffect(() => {
    setData(null)
    reports.summary(from, to + ' 23:59:59').then(setData)
  }, [from, to])

  function handleModeChange(next) {
    setMode(next)
    setOffset(0)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await reports.exportCsv(from, to + ' 23:59:59')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Reports"
        subtitle={label}
        actions={(
          <>
            {/* Week / Month toggle */}
            <div role="tablist" className="flex gap-1 bg-slate-800 rounded-md p-0.5">
              {['week', 'month'].map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => handleModeChange(m)}
                  className={`px-3 py-1 text-xs rounded capitalize transition-colors duration-fast ${
                    mode === m ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center bg-slate-800 rounded-md p-0.5">
              <button
                type="button"
                aria-label={`Previous ${mode}`}
                onClick={() => setOffset((o) => o - 1)}
                className="text-slate-400 hover:text-slate-100 transition-colors duration-fast p-1.5 rounded"
              >
                <ChevronLeftIcon size={14} />
              </button>
              <button
                type="button"
                aria-label={`Next ${mode}`}
                onClick={() => setOffset((o) => Math.min(o + 1, 0))}
                disabled={offset === 0}
                className="text-slate-400 hover:text-slate-100 disabled:opacity-30 transition-colors duration-fast p-1.5 rounded"
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>

            {/* Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !data?.entries?.length}
              className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors duration-fast disabled:opacity-40"
            >
              {exporting ? 'Saving…' : 'Export CSV'}
            </button>
          </>
        )}
      />

      {data === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-elevated px-4 py-3 space-y-2">
              <Skeleton w={48} h={10} />
              <Skeleton w={80} h={20} />
            </div>
          ))}
        </div>
      ) : (
        <SummaryReport data={data} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DurationByDay byDay={data?.byDay} />
        <ProjectDonut byProject={data?.byProject} />
      </div>
    </div>
  )
}
