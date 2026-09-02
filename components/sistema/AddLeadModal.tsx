'use client'

import { useState } from 'react'
import { X, Loader2, UserPlus } from 'lucide-react'
import { createLead, type LeadRow } from '@/lib/api'
import { INTERESSES } from '@/lib/crm-config'

const FIELD     = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'
const FIELD_SEL = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none [&>option]:text-gray-900 [&>option]:bg-white'
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }

export default function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (l: LeadRow) => void }) {
  const ORIGENS = ['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Anúncio', 'Google', 'Indicação', 'Espontâneo', 'Outro']

  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', interesse: '', origem: '', indicado_por: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    if (form.origem === 'Indicação' && !form.indicado_por.trim()) { alert('Informe quem indicou.'); return }
    setSaving(true)
    try {
      const lead = await createLead({
        ...form,
        interesse: form.interesse || 'Não informado',
        origem: form.origem || null,
        indicado_por: form.origem === 'Indicação' ? form.indicado_por.trim() : null,
      })
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
        style={{ background: 'rgba(15,14,26,0.97)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><UserPlus size={18} className="text-[color:var(--sys-accent)]" /> Adicionar lead</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={FIELD} style={FS} placeholder="Nome *" value={form.nome} onChange={e => set('nome', e.target.value)} autoFocus required />
          <input className={FIELD} style={FS} placeholder="WhatsApp" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
          <input className={FIELD} style={FS} placeholder="E-mail" value={form.email} onChange={e => set('email', e.target.value)} />

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Interesse</label>
            <select className={FIELD_SEL} style={FS} value={form.interesse} onChange={e => set('interesse', e.target.value)}>
              <option value="">Selecione uma opção</option>
              {INTERESSES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Origem</label>
            <select className={FIELD_SEL} style={FS} value={form.origem} onChange={e => set('origem', e.target.value)}>
              <option value="">Selecione a origem</option>
              {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {form.origem === 'Indicação' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Quem indicou? <span className="text-red-400">*</span></label>
              <input className={FIELD} style={FS} placeholder="Nome de quem indicou" value={form.indicado_por} onChange={e => set('indicado_por', e.target.value)} />
            </div>
          )}

          <button type="submit" disabled={saving || !form.nome.trim()}
            className="w-full h-11 font-bold text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  )
}
