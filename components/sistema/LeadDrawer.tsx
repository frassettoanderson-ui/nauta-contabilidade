'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  X, Loader2, MessageCircle, Mail, Trash2, Send, Bell, Check, Plus, CalendarClock,
} from 'lucide-react'
import {
  getLeadDetail, updateLead, deleteLead, addAtividade, addLembrete, toggleLembrete,
  type LeadDetail,
} from '@/lib/api'
import { ETAPAS } from '@/lib/crm-config'
import ClassBar from './ClassBar'

const todayStr = () => new Date().toISOString().slice(0, 10)
const dOnly = (s: string) => s.slice(0, 10)

export default function LeadDrawer({ leadId, onClose, onChanged }: { leadId: string; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<LeadDetail | null>(null)
  const [novaAtiv, setNovaAtiv] = useState('')
  const [lembDesc, setLembDesc] = useState('')
  const [lembData, setLembData] = useState(todayStr())
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => { getLeadDetail(leadId).then(setD) }, [leadId])
  useEffect(() => { load() }, [load])

  async function setEtapa(etapa: string) {
    if (!d) return
    setD({ ...d, etapa })
    await updateLead(leadId, { etapa }); onChanged()
  }
  async function setClass(classificacao: number) {
    if (!d) return
    setD({ ...d, classificacao })
    await updateLead(leadId, { classificacao }); onChanged()
  }
  async function addAtiv() {
    if (!novaAtiv.trim()) return
    setBusy(true)
    await addAtividade(leadId, novaAtiv); setNovaAtiv(''); await load(); setBusy(false)
  }
  async function addLemb() {
    if (!lembDesc.trim() || !lembData) return
    setBusy(true)
    await addLembrete(leadId, lembDesc, lembData); setLembDesc(''); setLembData(todayStr()); await load(); onChanged(); setBusy(false)
  }
  async function toggleLemb(id: string, c: boolean) {
    await toggleLembrete(leadId, id, c); await load(); onChanged()
  }
  async function remover() {
    if (!confirm('Excluir este lead? Esta ação não pode ser desfeita.')) return
    await deleteLead(leadId); onChanged(); onClose()
  }

  const waLink = (tel: string) => `https://wa.me/55${(tel || '').replace(/\D/g, '')}`

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute top-0 right-0 bottom-0 w-full max-w-md overflow-y-auto"
        style={{ background: '#0c0b18', borderLeft: '1px solid rgba(255,255,255,0.10)' }}>
        {!d ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-white">{d.nome}</h2>
                <p className="text-gray-500 text-xs mt-0.5">{d.interesse || 'Sem interesse definido'}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={remover} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10" title="Excluir"><Trash2 size={15} /></button>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
            </div>

            {/* Etapa */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {ETAPAS.map(et => (
                <button key={et.id} onClick={() => setEtapa(et.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: d.etapa === et.id ? et.color : 'rgba(255,255,255,0.05)',
                    color: d.etapa === et.id ? '#fff' : '#9ca3af',
                  }}>
                  {et.label}
                </button>
              ))}
            </div>

            {/* Contato */}
            <div className="flex gap-2 mb-5">
              <a href={waLink(d.whatsapp)} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white" style={{ background: '#25D366' }}>
                <MessageCircle size={15} /> WhatsApp
              </a>
              <a href={`mailto:${d.email}`}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <Mail size={15} /> E-mail
              </a>
            </div>

            {/* Infos */}
            <div className="rounded-xl p-4 mb-5 space-y-1.5 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-gray-400"><span className="text-gray-600">WhatsApp:</span> {d.whatsapp || '—'}</p>
              <p className="text-gray-400"><span className="text-gray-600">E-mail:</span> {d.email || '—'}</p>
              <p className="text-gray-400"><span className="text-gray-600">Criado em:</span> {format(new Date(d.criado_em), "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>

            {/* Classificação */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 mb-2">Nível de interesse</p>
              <ClassBar value={d.classificacao} onChange={setClass} size="md" />
            </div>

            {/* Lembretes */}
            <div className="mb-6">
              <p className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Bell size={15} className="text-[#0BBCD4]" /> Lembretes</p>
              <div className="flex gap-2 mb-3">
                <input value={lembDesc} onChange={e => setLembDesc(e.target.value)} placeholder="Pendência..."
                  className="flex-1 h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
                <input type="date" value={lembData} onChange={e => setLembData(e.target.value)}
                  className="h-10 px-2 rounded-lg text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', colorScheme: 'dark' }} />
                <button onClick={addLemb} disabled={busy} className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(11,188,212,0.15)', border: '1px solid rgba(11,188,212,0.25)' }}>
                  <Plus size={16} className="text-[#0BBCD4]" />
                </button>
              </div>
              <div className="space-y-2">
                {d.lembretes.length === 0 && <p className="text-gray-600 text-xs">Nenhum lembrete.</p>}
                {d.lembretes.map(l => {
                  const venceu = !l.concluido && dOnly(l.data) <= todayStr()
                  return (
                    <div key={l.id} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: venceu ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${venceu ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                      <button onClick={() => toggleLemb(l.id, !l.concluido)}
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: l.concluido ? '#22c55e' : 'transparent', border: `1px solid ${l.concluido ? '#22c55e' : 'rgba(255,255,255,0.2)'}` }}>
                        {l.concluido && <Check size={12} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${l.concluido ? 'text-gray-600 line-through' : 'text-gray-200'}`}>{l.descricao}</p>
                        <p className="text-[11px] flex items-center gap-1" style={{ color: venceu ? '#f59e0b' : '#6b7280' }}>
                          <CalendarClock size={11} /> {format(new Date(dOnly(l.data) + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                          {venceu && ' · pendente'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Atividades */}
            <div>
              <p className="text-sm font-bold text-white mb-3">Registro de atividades</p>
              <div className="flex gap-2 mb-3">
                <textarea value={novaAtiv} onChange={e => setNovaAtiv(e.target.value)} rows={2} placeholder="O que foi tratado com o cliente..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
                <button onClick={addAtiv} disabled={busy || !novaAtiv.trim()} className="w-10 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'rgba(11,188,212,0.15)', border: '1px solid rgba(11,188,212,0.25)' }}>
                  {busy ? <Loader2 size={15} className="animate-spin text-[#0BBCD4]" /> : <Send size={15} className="text-[#0BBCD4]" />}
                </button>
              </div>
              <div className="space-y-2.5">
                {d.atividades.length === 0 && <p className="text-gray-600 text-xs">Nenhuma atividade registrada.</p>}
                {d.atividades.map(a => (
                  <div key={a.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{a.descricao}</p>
                    <p className="text-[11px] text-gray-600 mt-1.5">
                      {a.autor ? `${a.autor} · ` : ''}{format(new Date(a.criado_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
