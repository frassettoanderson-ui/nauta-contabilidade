'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Bell } from 'lucide-react'
import { getLeads, updateLead, type LeadRow } from '@/lib/api'
import { ETAPAS } from '@/lib/crm-config'
import ClassBar from '@/components/sistema/ClassBar'
import AddLeadModal from '@/components/sistema/AddLeadModal'
import LeadDrawer from '@/components/sistema/LeadDrawer'

export default function KanbanPage() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)

  const load = () => getLeads().then(setLeads).catch(() => setLeads([]))
  useEffect(() => { load() }, [])

  function onDrop(etapa: string) {
    setOverCol(null)
    const id = dragId
    setDragId(null)
    if (!id || !leads) return
    const lead = leads.find(l => l.id === id)
    if (!lead || lead.etapa === etapa) return
    setLeads(leads.map(l => l.id === id ? { ...l, etapa } : l))
    updateLead(id, { etapa }).catch(load)
  }

  const pend = (l: LeadRow) => Number(l.lembretes_pendentes ?? 0) > 0

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
            const cards = leads.filter(l => (l.etapa || 'novo') === col.id)
            const isOver = overCol === col.id
            return (
              <div
                key={col.id}
                onDragOver={e => { e.preventDefault(); setOverCol(col.id) }}
                onDragLeave={() => setOverCol(c => c === col.id ? null : c)}
                onDrop={() => onDrop(col.id)}
                className="w-80 shrink-0"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <h2 className="text-sm font-bold text-white">{col.label}</h2>
                  <span className="text-xs text-gray-500 ml-auto">{cards.length}</span>
                </div>
                <div
                  className="space-y-2.5 rounded-2xl p-2.5 min-h-[60vh] transition-colors"
                  style={{
                    background: isOver ? 'rgba(11,188,212,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isOver ? 'rgba(11,188,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {cards.map(l => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onDragEnd={() => { setDragId(null); setOverCol(null) }}
                      onClick={() => setOpenId(l.id)}
                      className="rounded-xl p-3.5 cursor-pointer transition-all hover:-translate-y-0.5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', opacity: dragId === l.id ? 0.4 : 1 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-semibold truncate">{l.nome}</p>
                        {pend(l) && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                            <Bell size={10} /> hoje
                          </span>
                        )}
                      </div>
                      {l.interesse && <p className="text-[#0BBCD4] text-xs mt-0.5 truncate">{l.interesse}</p>}
                      {l.whatsapp && <p className="text-gray-500 text-xs mt-1 truncate">{l.whatsapp}</p>}
                      <div className="mt-2.5"><ClassBar value={l.classificacao ?? 0} /></div>
                    </div>
                  ))}
                  {cards.length === 0 && <p className="text-gray-700 text-xs text-center py-8">Arraste leads para cá</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adding && <AddLeadModal onClose={() => setAdding(false)} onCreated={() => load()} />}
      {openId && <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  )
}
