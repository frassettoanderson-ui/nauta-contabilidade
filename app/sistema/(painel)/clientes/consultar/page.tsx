'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, Users, Building2 } from 'lucide-react'
import { listClientes } from '@/lib/api'
import { parseCidadeEstado } from '@/lib/form-masks'

type Cli = Record<string, unknown>

const s = (v: unknown) => String(v ?? '')

export default function ConsultarClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cli[] | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => { listClientes().then(setClientes).catch(() => setClientes([])) }, [])

  const filtered = (clientes ?? []).filter(c => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return s(c.emp_nome).toLowerCase().includes(q) || s(c.responsavel).toLowerCase().includes(q)
  })

  const COLS = ['Empresa', 'Responsável', 'Telefone', 'Cidade', 'UF', 'Cadastro', 'Tipo', 'Origem', 'Interesse']

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><Users size={22} className="text-[#0BBCD4]" /> Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clientes === null ? 'Carregando...' : `${filtered.length} cliente(s) cadastrado(s)`}</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa ou responsável..."
            className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-72" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
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
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
                {COLS.map(col => (
                  <th key={col} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-4 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const { cidade, uf } = parseCidadeEstado(s(c.emp_cidade_estado))
                return (
                  <tr key={s(c.id)} onClick={() => router.push(`/sistema/clientes/cadastrar?cliente=${c.id}`)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ borderBottom: '1px solid var(--sys-surface-4)' }}>
                    <td className="px-4 py-3 font-semibold text-white">{s(c.emp_nome) || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{s(c.responsavel) || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{s(c.emp_telefone) || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{cidade || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{uf || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.criado_em ? format(new Date(s(c.criado_em)), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</td>
                    <td className="px-4 py-3">
                      {c.emp_regime
                        ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(11,188,212,0.12)', color: '#0BBCD4' }}>{s(c.emp_regime)}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{s(c.lead_origem) || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{s(c.lead_interesse) || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
