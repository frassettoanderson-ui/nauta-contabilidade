'use client'

import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { updateLead, type LeadRow } from '@/lib/api'

const FIELD = 'w-full h-11 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }

export default function FecharNegociacaoModal({ lead, onClose, onConfirmed }: { lead: LeadRow; onClose: () => void; onConfirmed: () => void }) {
  const [honorario, setHonorario] = useState(lead.valor_honorario != null ? String(lead.valor_honorario) : '')
  const [abertura, setAbertura] = useState(lead.valor_abertura != null ? String(lead.valor_abertura) : '')
  const [obs, setObs] = useState(lead.negociacao_obs ?? '')
  const [saving, setSaving] = useState(false)

  async function confirmar() {
    if (!honorario.trim() || Number(honorario) <= 0) { alert('Informe o valor do honorário mensal para fechar.'); return }
    setSaving(true)
    try {
      await updateLead(lead.id, {
        etapa: 'fechado',
        valor_honorario: Number(honorario),
        valor_abertura: abertura.trim() ? Number(abertura) : 0,
        negociacao_obs: obs.trim() || null,
      })
      onConfirmed(); onClose()
    } catch { alert('Erro ao fechar.'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,4,20,0.8)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl p-6" style={{ background: 'rgba(15,14,26,0.97)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-white">Fechar negociação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-500 text-sm mb-5">{lead.nome} — informe os valores acordados.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Honorário mensal <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input type="number" min="0" step="0.01" value={honorario} onChange={e => setHonorario(e.target.value)} placeholder="0,00" className={FIELD} style={FS} autoFocus />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Valor de abertura <span className="text-gray-600">(opcional)</span></label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input type="number" min="0" step="0.01" value={abertura} onChange={e => setAbertura(e.target.value)} placeholder="0,00" className={FIELD} style={FS} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Observações da negociação <span className="text-gray-600">(opcional)</span></label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              placeholder="Ex.: carência de 2 meses; honorário de R$ 300 nos 6 primeiros meses; abertura parcelada em 3x..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none" style={FS} />
            <p className="text-[11px] text-gray-600 mt-1">Aparece no contrato como “Condições Especiais Negociadas”.</p>
          </div>
        </div>

        <button onClick={confirmar} disabled={saving}
          className="w-full h-11 mt-5 font-bold text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Confirmar fechamento</>}
        </button>
      </div>
    </div>
  )
}
