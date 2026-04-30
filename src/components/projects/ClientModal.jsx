import React, { useState } from 'react'
import Modal from '../shared/Modal'

export default function ClientModal({ onSave, onClose }) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')

  return (
    <Modal title="New Client" onClose={onClose}>
      <label className="block mb-3">
        <span className="text-xs text-slate-400">Name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>
      <label className="block mb-4">
        <span className="text-xs text-slate-400">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => name.trim() && onSave({ name: name.trim(), email: email || null })}
          className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </Modal>
  )
}
