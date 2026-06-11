'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageCircle } from 'lucide-react'
import { getOnboardingLeads, type OnboardingLead } from '@/lib/api'
import { ONBOARDING_ETAPAS } from '@/lib/onboarding'

export default function OnboardingKanban({ titulo, categoria }: { titulo: string; categoria: string }) {
  const [leads, setLeads] = useState<OnboardingLead[] | null>(null)

  useEffect(() => {
    getOnboardingLeads(categoria).then(setLeads).catch(() => setLeads([]))
  }, [categoria])

  const waLink = (tel: string) => `https://wa.me/55${(tel || '').replace(/\D/g, '')}`

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{titulo}</h1>
      <p className="text-gray-500 text-sm mb-6">Onboarding · acompanhamento por etapas</p>

      {leads === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {ONBOARDING_ETAPAS.map((etapa, i) => {
            const cards = leads.filter(l => (l.onboarding_etapa ?? 1) === i + 1)
            return (
              <div key={etapa} className="rounded-2xl p-4 min-h-[60vh]"
                style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>{i + 1}</span>
                    <h2 className="text-sm font-bold text-gray-200">{etapa}</h2>
                  </div>
                  <span className="text-[11px] text-gray-600 font-bold">{cards.length}</span>
                </div>

                <div className="space-y-2.5">
                  {cards.map(l => (
                    <div key={l.id} className="rounded-lg p-3"
                      style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border)' }}>
                      <p className="text-white text-sm font-bold truncate">{l.nome}</p>
                      {l.interesse && <p className="text-[#0BBCD4] text-[11px] mt-0.5 truncate">{l.interesse}</p>}
                      <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold" style={{ color: '#25D366' }}>
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    </div>
                  ))}
                  {cards.length === 0 && <p className="text-gray-600 text-xs text-center py-8">Nenhum cliente nesta etapa.</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
