'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Inbox, Search, MessageCircle, Mail } from 'lucide-react'
import { getLeads, type LeadRow } from '@/lib/api'

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => { getLeads().then(setLeads).catch(() => setLeads([])) }, [])

  const filtered = (leads ?? []).filter(l => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.interesse.toLowerCase().includes(q)
  })

  const waLink = (tel: string) => `https://wa.me/55${tel.replace(/\D/g, '')}`

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {leads === null ? 'Carregando...' : `${filtered.length} lead${filtered.length !== 1 ? 's' : ''} captado${filtered.length !== 1 ? 's' : ''} pelo site`}
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
            className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-56"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
        </div>
      </div>

      {leads === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Inbox size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum lead {busca ? 'encontrado' : 'ainda'}.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          {/* Cabeçalho (desktop) */}
          <div className="hidden md:grid text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1.4fr 1.4fr 1fr 130px 120px', borderColor: 'rgba(255,255,255,0.06)' }}>
            <span>Nome</span><span>Contato</span><span>Interesse</span><span>Data</span><span className="text-right">Ações</span>
          </div>

          {filtered.map(l => (
            <div key={l.id}
              className="grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_1fr_130px_120px] items-center gap-2 px-5 py-4 border-b last:border-0 hover:bg-white/[0.02] transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{l.nome}</p>
                <p className="text-gray-600 text-xs md:hidden">{l.interesse}</p>
              </div>
              <div className="min-w-0 text-xs text-gray-400">
                <p className="truncate">{l.whatsapp}</p>
                <p className="truncate text-gray-600">{l.email}</p>
              </div>
              <span className="text-gray-400 text-xs hidden md:block truncate">{l.interesse}</span>
              <span className="text-gray-500 text-xs hidden md:block">
                {format(new Date(l.criado_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
              </span>
              <div className="flex items-center md:justify-end gap-1.5">
                <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/10" title="WhatsApp">
                  <MessageCircle size={14} className="text-gray-400 hover:text-green-400" />
                </a>
                <a href={`mailto:${l.email}`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8" title="E-mail">
                  <Mail size={14} className="text-gray-400 hover:text-[#0BBCD4]" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
