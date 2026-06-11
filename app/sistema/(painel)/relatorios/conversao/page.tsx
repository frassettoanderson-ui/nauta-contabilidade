'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp } from 'lucide-react'
import { getLeads, type LeadRow } from '@/lib/api'
import { ETAPA_LABEL } from '@/lib/crm-config'

const ORDEM = ['novo', 'contato', 'negociacao', 'fechado', 'perdido']
const COR: Record<string, string> = { novo: '#0BBCD4', contato: '#7c6fff', negociacao: '#f59e0b', fechado: '#22c55e', perdido: '#ef4444' }

export default function ConversaoPage() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null)
  useEffect(() => { getLeads().then(setLeads).catch(() => setLeads([])) }, [])

  const total = leads?.length ?? 0
  const cont = (e: string) => leads?.filter(l => (l.etapa || 'novo') === e).length ?? 0
  const fechados = cont('fechado')
  const taxa = total > 0 ? Math.round((fechados / total) * 100) : 0
  const max = Math.max(1, ...ORDEM.map(cont))

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <TrendingUp size={22} className="text-[#0BBCD4]" /> Conversão
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Desempenho do funil comercial</p>
      </div>

      {leads === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total de leads', value: total },
              { label: 'Fechados', value: fechados },
              { label: 'Taxa de conversão', value: `${taxa}%` },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
            <h2 className="text-white font-bold mb-4 text-sm">Leads por etapa</h2>
            <div className="space-y-3">
              {ORDEM.map(e => {
                const n = cont(e)
                return (
                  <div key={e}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{ETAPA_LABEL[e]}</span>
                      <span className="text-gray-500">{n}</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--sys-surface-4)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(n / max) * 100}%`, background: COR[e] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
