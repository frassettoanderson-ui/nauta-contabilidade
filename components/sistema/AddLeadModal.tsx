'use client'

import { useState } from 'react'
import { X, Loader2, UserPlus } from 'lucide-react'
import { createLead, type LeadRow } from '@/lib/api'
import { INTERESSES } from '@/lib/crm-config'

const FIELD = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'
const FS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

export default function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (l: LeadRow) => void }) {
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', interesse: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      const lead = await createLead({ ...form, interesse: form.interesse || 'Não informado' })
      onCreated(lead)
      onClose()
    } catch {
      alert('Erro ao adicionar lead.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,4,20,0.8)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl p-6"
        style={{ background: 'rgba(15,14,26,0.97)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><UserPlus size={18} className="text-[#0BBCD4]" /> Adicionar lead</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={FIELD} style={FS} placeholder="Nome *" value={form.nome} onChange={e => set('nome', e.target.value)} autoFocus required />
          <input className={FIELD} style={FS} placeholder="WhatsApp" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
          <input className={FIELD} style={FS} placeholder="E-mail" value={form.email} onChange={e => set('email', e.target.value)} />

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Interesse</label>
            <select className={FIELD} style={{ ...FS, colorScheme: 'dark' }} value={form.interesse} onChange={e => set('interesse', e.target.value)}>
              <option value="">Selecione uma opção</option>
              {INTERESSES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <button type="submit" disabled={saving || !form.nome.trim()}
            className="w-full h-11 font-bold text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  )
}
