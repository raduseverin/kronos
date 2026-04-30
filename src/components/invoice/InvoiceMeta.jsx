import React from 'react'

/** Header block of the invoice document: title, project picker, meta fields, logo slot. */
export default function InvoiceMeta({
  template,
  num,         setNum,
  iDate,       setIDate,
  dDate,       setDDate,
  po,          setPo,
  terms,       setTerms,
  projects,
  selectedProjectId,
  onProjectChange,
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          {template === 'facture' ? 'FACTURE' : 'Invoice'}
        </h1>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mt-3">
          <MetaLabel>Project:</MetaLabel>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => onProjectChange(e.target.value)}
            className="text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-violet-500 transition-colors py-0.5 pr-2"
          >
            <option value="">— select project —</option>
            {projects.filter((p) => !p.archived).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <MetaLabel>Invoice ID:</MetaLabel>
          <EditableField value={num} onChange={setNum} placeholder="e.g. Justimmo-inv-00001" />

          <MetaLabel>Invoice Date:</MetaLabel>
          <input
            type="date"
            value={iDate}
            onChange={(e) => setIDate(e.target.value)}
            className="text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-violet-500 transition-colors py-0.5"
          />

          <MetaLabel>Due date:</MetaLabel>
          <input
            type="date"
            value={dDate}
            onChange={(e) => setDDate(e.target.value)}
            className="text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-violet-500 transition-colors py-0.5"
          />

          <MetaLabel>Purchase order:</MetaLabel>
          <EditableField value={po} onChange={setPo} placeholder="Add purchase order number" />

          <MetaLabel>Payment terms:</MetaLabel>
          <EditableField value={terms} onChange={setTerms} placeholder="Add payment terms" />
        </div>
      </div>

      {/* Logo placeholder */}
      <div className="w-32 h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center">
        <span>Logo area</span>
      </div>
    </div>
  )
}

function MetaLabel({ children }) {
  return <span className="font-semibold text-gray-700 whitespace-nowrap text-sm">{children}</span>
}

function EditableField({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-violet-500 transition-colors py-0.5 placeholder:text-gray-300 w-full"
    />
  )
}
