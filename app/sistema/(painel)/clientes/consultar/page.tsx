'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, Users, Building2 } from 'lucide-react'
import { listClientes } from '@/lib/api'

export default function ConsultarClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Record<string, unknown>[] | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => { listClientes().then(setClientes).catch(() => setClientes([])) }, [])

  const filtered = (clientes ?? []).filter(c => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return String(c.emp_nome ?? '').toLowerCase().includes(q) || String(c.cli_nome_completo ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><Users size={22} className="text-[#0BBCD4]" /> Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clientes === null ? 'Carregando...' : `${filtered.length} cliente(s) cadastrado(s)`}</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
            className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-56" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
        </div>
      </div>

      {clientes === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--sys-surface-4)', background: 'rgba(255,255,255,0.02)' }}>
          {filtered.map(c => (
            <button key={String(c.id)} onClick={() => router.push(`/sistema/clientes/cadastrar?cliente=${c.id}`)}
              className="w-full text-left flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--sys-surface-3)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{String(c.emp_nome || c.cli_nome_completo || 'Sem nome')}</p>
                <p className="text-gray-600 text-xs truncate">{String(c.cli_nome_completo || '')} {c.emp_telefone ? `· ${c.emp_telefone}` : ''}</p>
              </div>
              <span className="text-gray-600 text-xs shrink-0">{c.criado_em ? format(new Date(String(c.criado_em)), 'dd/MM/yyyy', { locale: ptBR }) : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
