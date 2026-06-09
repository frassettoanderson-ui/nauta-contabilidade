'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getLeads, type LeadRow } from '@/lib/api'

const COLUNAS = [
  { id: 'novo',       label: 'Novo',       color: '#0BBCD4' },
  { id: 'contato',    label: 'Em contato', color: '#7c6fff' },
  { id: 'proposta',   label: 'Proposta',   color: '#f59e0b' },
  { id: 'negociacao', label: 'Negociação', color: '#eab308' },
  { id: 'ganho',      label: 'Ganho',      color: '#22c55e' },
  { id: 'perdido',    label: 'Perdido',    color: '#ef4444' },
]

export default function KanbanPage() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null)

  useEffect(() => { getLeads().then(setLeads).catch(() => setLeads([])) }, [])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Funil comercial</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Acompanhe a evolução dos leads. <span className="text-gray-600">Arrastar entre etapas será habilitado em breve.</span>
        </p>
      </div>

      {leads === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUNAS.map(col => {
            const cards = col.id === 'novo' ? (leads ?? []) : []
            return (
              <div key={col.id} className="w-72 shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <h2 className="text-sm font-bold text-white">{col.label}</h2>
                  <span className="text-xs text-gray-600">{cards.length}</span>
                </div>
                <div className="space-y-2 rounded-2xl p-2 min-h-[120px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {cards.map(l => (
                    <div key={l.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-white text-sm font-semibold truncate">{l.nome}</p>
                      <p className="text-[#0BBCD4] text-xs mt-0.5 truncate">{l.interesse}</p>
                      <p className="text-gray-500 text-xs mt-1 truncate">{l.whatsapp}</p>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <p className="text-gray-700 text-xs text-center py-6">Vazio</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
