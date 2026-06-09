'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Bell, Check, XCircle, FileText, MessageCircle, Pencil, ClipboardCheck, AlertCircle } from 'lucide-react'
import { getLeads, updateLead, type LeadRow } from '@/lib/api'
import { ETAPAS } from '@/lib/crm-config'
import ClassBar from '@/components/sistema/ClassBar'
import AddLeadModal from '@/components/sistema/AddLeadModal'
import LeadModal from '@/components/sistema/LeadModal'
import FecharNegociacaoModal from '@/components/sistema/FecharNegociacaoModal'
import { useRealtime } from '@/components/sistema/useRealtime'

export default function KanbanPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<LeadRow[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'lembrete'>('view')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const [fecharLead, setFecharLead] = useState<LeadRow | null>(null)

  const load = () => getLeads().then(setLeads).catch(() => setLeads([]))
  useEffect(() => { load() }, [])

  // Atualização automática (não atualiza enquanto o usuário interage)
  const interagindo = !!(dragId || openId || fecharLead || adding)
  const interagindoRef = useRef(interagindo)
  interagindoRef.current = interagindo
  useEffect(() => {
    const t = setInterval(() => { if (!interagindoRef.current) getLeads().then(setLeads).catch(() => {}) }, 30000)
    return () => clearInterval(t)
  }, [])
  // Tempo real (SSE): atualiza na hora quando alguém mexe
  useRealtime(() => { if (!interagindoRef.current) getLeads().then(setLeads).catch(() => {}) })

  function moveLead(id: string, etapa: string) {
    setLeads(prev => prev ? prev.map(l => l.id === id ? { ...l, etapa } : l) : prev)
    updateLead(id, { etapa }).catch(load)
  }
  function onDrop(etapa: string) {
    setOverCol(null)
    const id = dragId; setDragId(null)
    if (!id || !leads) return
    const lead = leads.find(l => l.id === id)
    if (!lead || lead.etapa === etapa) return
    if (etapa === 'fechado') { setFecharLead(lead); return } // exige valores antes de fechar
    moveLead(id, etapa)
  }
  function abrir(id: string, mode: 'view' | 'edit' | 'lembrete') { setModalMode(mode); setOpenId(id) }

  const pend = (l: LeadRow) => Number(l.lembretes_pendentes ?? 0) > 0
  const waLink = (tel: string) => `https://wa.me/55${(tel || '').replace(/\D/g, '')}`

  function AcaoBtn({ title, onClick, children, color = '#9ca3af' }: { title: string; onClick: () => void; children: React.ReactNode; color?: string }) {
    return (
      <button title={title} onClick={e => { e.stopPropagation(); onClick() }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10" style={{ color }}>
        {children}
      </button>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Funil comercial</h1>
          <p className="text-gray-500 text-sm mt-0.5">Arraste os cards entre as etapas. Clique para ver detalhes.</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 4px 16px rgba(11,188,212,0.2)' }}>
          <Plus size={16} /> Adicionar lead
        </button>
      </div>

      {leads === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {ETAPAS.map(col => {
            const cards = leads
              .filter(l => (l.etapa || 'novo') === col.id)
              .sort((a, b) => (b.classificacao ?? 0) - (a.classificacao ?? 0) || new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
            const isOver = overCol === col.id
            return (
              <div key={col.id}
                onDragOver={e => { e.preventDefault(); setOverCol(col.id) }}
                onDragLeave={() => setOverCol(c => c === col.id ? null : c)}
                onDrop={() => onDrop(col.id)}
                className="w-80 shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <h2 className="text-sm font-bold text-white">{col.label}</h2>
                  <span className="text-xs text-gray-500 ml-auto">{cards.length}</span>
                </div>
                <div className="space-y-2.5 rounded-2xl p-2.5 min-h-[62vh] transition-colors duration-200"
                  style={{ background: isOver ? 'rgba(11,188,212,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isOver ? 'rgba(11,188,212,0.35)' : 'rgba(255,255,255,0.06)'}` }}>
                  {cards.map(l => {
                    const dragging = dragId === l.id
                    const fechado = col.id === 'fechado'
                    const temPend = pend(l)
                    return (
                      <div key={l.id}
                        draggable={!fechado}
                        onDragStart={e => {
                          if (fechado) { e.preventDefault(); return }
                          e.dataTransfer.effectAllowed = 'move'
                          try { e.dataTransfer.setDragImage(e.currentTarget, 24, 24) } catch {}
                          setDragId(l.id)
                        }}
                        onDragEnd={() => { setDragId(null); setOverCol(null) }}
                        onClick={() => abrir(l.id, 'view')}
                        className="rounded-xl p-3.5 cursor-pointer"
                        style={{
                          background: '#15132a',
                          border: `1px solid ${temPend ? 'rgba(245,158,11,0.5)' : dragging ? 'rgba(11,188,212,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          borderLeft: temPend ? '3px solid #f59e0b' : undefined,
                          transform: dragging ? 'scale(1.04) rotate(-1.5deg)' : 'scale(1)',
                          boxShadow: dragging ? '0 18px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(11,188,212,0.3)' : '0 1px 2px rgba(0,0,0,0.2)',
                          transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s ease, border-color 0.18s ease',
                        }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white text-sm font-semibold truncate">{l.nome}</p>
                          {temPend && (
                            <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: '#f59e0b', color: '#1a1830' }}>
                              <Bell size={10} /> hoje
                            </span>
                          )}
                        </div>
                        {l.interesse && <p className="text-[#0BBCD4] text-xs mt-0.5 truncate">{l.interesse}</p>}
                        <div className="mt-2.5"><ClassBar value={l.classificacao ?? 0} /></div>

                        {/* Ações rápidas */}
                        <div className="flex items-center gap-1 mt-3 pt-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <a title="WhatsApp" href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/15" style={{ color: '#25D366' }}>
                            <MessageCircle size={15} />
                          </a>
                          <AcaoBtn title="Editar" onClick={() => abrir(l.id, 'edit')}><Pencil size={14} /></AcaoBtn>
                          <AcaoBtn title="Cadastro completo" onClick={() => router.push(`/sistema/clientes/cadastrar?lead=${l.id}`)} color="#22c55e"><ClipboardCheck size={15} /></AcaoBtn>
                          <AcaoBtn title="Cadastrar lembrete" onClick={() => abrir(l.id, 'lembrete')} color="#f59e0b"><Bell size={14} /></AcaoBtn>
                        </div>

                        {/* Em negociação */}
                        {col.id === 'negociacao' && (
                          <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setFecharLead(l)} className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-bold text-white" style={{ background: '#22c55e' }}><Check size={13} /> Fechado</button>
                            <button onClick={() => moveLead(l.id, 'perdido')} className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-bold text-white" style={{ background: '#ef4444' }}><XCircle size={13} /> Perdido</button>
                          </div>
                        )}

                        {/* Fechado: gerar contrato / cadastro incompleto */}
                        {fechado && (
                          <div className="mt-3" onClick={e => e.stopPropagation()}>
                            {l.valor_honorario != null && (
                              <p className="text-[11px] text-gray-400 mb-2">
                                Honorário: <span className="text-[#22c55e] font-bold">R$ {Number(l.valor_honorario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>/mês
                                {Number(l.valor_abertura) > 0 && <> · Abertura: <span className="text-[#22c55e] font-bold">R$ {Number(l.valor_abertura).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></>}
                              </p>
                            )}
                            {l.cadastro_completo ? (
                              <button onClick={() => alert('Geração de contrato será habilitada em breve.')}
                                className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                                <FileText size={13} /> Gerar contrato
                              </button>
                            ) : (
                              <>
                                <button disabled className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-bold text-gray-500 cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                  <FileText size={13} /> Gerar contrato
                                </button>
                                <button onClick={() => router.push(`/sistema/clientes/cadastrar?lead=${l.id}`)}
                                  className="w-full flex items-center justify-center gap-1 mt-1.5 text-[11px] font-bold text-red-400 animate-pulse">
                                  <AlertCircle size={11} /> Cadastro do cliente incompleto, clique aqui
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {cards.length === 0 && <p className="text-gray-700 text-xs text-center py-8">Arraste leads para cá</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adding && <AddLeadModal onClose={() => setAdding(false)} onCreated={() => load()} />}
      {openId && <LeadModal leadId={openId} mode={modalMode} onClose={() => setOpenId(null)} onChanged={load} />}
      {fecharLead && <FecharNegociacaoModal lead={fecharLead} onClose={() => setFecharLead(null)} onConfirmed={load} />}
    </div>
  )
}
