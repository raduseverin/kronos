import React, { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import { TextField } from '../shared/Form'
import { PencilIcon, TrashIcon, PlusIcon } from '../shared/icons'
import { bankAccounts } from '../../api'

export default function BankAccountsModal({ onClose, onSelect }) {
  const [accounts, setAccounts] = useState([])
  const [editing, setEditing] = useState(null)  // null | 'new' | account object
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setAccounts(await bankAccounts.list())
  }

  async function handleSave(formData) {
    setSaving(true)
    try {
      if (formData.id) {
        await bankAccounts.update(formData.id, formData)
      } else {
        await bankAccounts.create(formData)
      }
      await load()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this bank account?')) return
    await bankAccounts.delete(id)
    await load()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="2xl"
      title="Bank Accounts"
      description="IBAN, BIC, and metadata used on invoices"
    >
      <div className="py-2 space-y-3">
        {accounts.length === 0 && !editing && (
          <p className="text-sm text-slate-500 text-center py-4">No bank accounts saved yet.</p>
        )}

        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="group flex items-start justify-between gap-3 p-4 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors duration-fast"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-100">{acc.name}</span>
                {acc.is_default && (
                  <span className="text-[10px] uppercase tracking-wide bg-violet-600/30 text-violet-300 px-1.5 py-0.5 rounded font-semibold">
                    Default
                  </span>
                )}
                <span className="text-xs text-slate-500">{acc.currency}</span>
              </div>
              {acc.iban && <div className="text-xs text-slate-400 mt-0.5 font-mono">{acc.iban}</div>}
              {acc.bic && <div className="text-xs text-slate-500">{acc.bic}</div>}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast shrink-0">
              {onSelect && (
                <button
                  onClick={() => { onSelect(acc); onClose() }}
                  className="text-xs px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast"
                >
                  Use
                </button>
              )}
              <button
                onClick={() => setEditing(acc)}
                aria-label="Edit account"
                className="p-1.5 text-slate-400 hover:text-violet-400 transition-colors duration-fast rounded-md"
              >
                <PencilIcon size={13} />
              </button>
              <button
                onClick={() => handleDelete(acc.id)}
                aria-label="Delete account"
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors duration-fast rounded-md"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          </div>
        ))}

        {editing && (
          <AccountForm
            initial={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        )}

        {!editing && (
          <div className="pt-2">
            <button
              onClick={() => setEditing('new')}
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors duration-fast"
            >
              <PlusIcon size={14} /> Add bank account
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function AccountForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name:        initial?.name         || '',
    iban:        initial?.iban         || '',
    bic:         initial?.bic          || '',
    bankName:    initial?.bank_name    || '',
    bankAddress: initial?.bank_address || '',
    currency:    initial?.currency     || 'USD',
    isDefault:   !!initial?.is_default,
    id:          initial?.id           || null,
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div
      className="border border-slate-700 rounded-xl p-4 bg-slate-900 space-y-3"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
    >
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {initial ? 'Edit Account' : 'New Bank Account'}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          autoFocus
          label="Account name *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Revolut EUR"
        />
        <TextField
          label="Currency"
          value={form.currency}
          onChange={(e) => set('currency', e.target.value)}
          placeholder="USD"
        />
      </div>

      <TextField
        label="IBAN"
        value={form.iban}
        onChange={(e) => set('iban', e.target.value)}
        placeholder="RO27 REVO 0000 1669 4125 9507"
        mono
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="BIC / SWIFT"
          value={form.bic}
          onChange={(e) => set('bic', e.target.value)}
          placeholder="REVOROBB"
          mono
        />
        <TextField
          label="Bank name"
          value={form.bankName}
          onChange={(e) => set('bankName', e.target.value)}
          placeholder="Revolut Bank UAB"
        />
      </div>

      <TextField
        label="Bank address"
        value={form.bankAddress}
        onChange={(e) => set('bankAddress', e.target.value)}
        placeholder="Vilnius, Lithuania…"
      />

      <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set('isDefault', e.target.checked)}
          className="accent-violet-500"
        />
        <span className="text-sm text-slate-300">Set as default</span>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors duration-fast"
        >
          Cancel
        </button>
        <button
          onClick={() => form.name && onSave(form)}
          disabled={saving || !form.name}
          className="px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors duration-fast disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
