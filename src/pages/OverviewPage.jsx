import React, { useEffect, useState } from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { useSettingsStore } from '../store/settingsStore'
import PageHeader from '../components/shared/PageHeader'
import SummaryReport from '../components/reports/SummaryReport'
import DurationByDay from '../components/reports/DurationByDay'
import ProjectDonut from '../components/reports/ProjectDonut'
import { Skeleton } from '../components/shared/Skeleton'
import { reports } from '../api'

export default function OverviewPage() {
  const { weekStartsOn } = useSettingsStore()
  const [data, setData] = useState(null)

  const now = new Date()
  const from = format(startOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd')
  const to = format(endOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd')

  useEffect(() => {
    reports.summary(from, to + ' 23:59:59').then(setData)
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="This week"
        subtitle={`${format(startOfWeek(now, { weekStartsOn }), 'MMM d')} – ${format(endOfWeek(now, { weekStartsOn }), 'MMM d, yyyy')}`}
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
