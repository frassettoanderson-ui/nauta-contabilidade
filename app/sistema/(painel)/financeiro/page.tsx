'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, DollarSign } from 'lucide-react'
import { listFinanceiro } from '@/lib/api'
import { parseCidadeEstado } from '@/lib/form-masks'

type Row = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')

const money = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) || !v ? '—' : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    em_dia:    { label: 'Em dia',   bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
    em_aberto: { label: 'Em aberto', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    atrasado:  { label: 'Atrasado', bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
  }
  const c = map[status] ?? map.em_aberto
  return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>
}

export default function FinanceiroPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => { listFinanceiro().then(setRows).catch(() => setRows([])) }, [])

  const filtered = (rows ?? []).filter(r => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return s(r.emp_nome).toLowerCase().includes(q) || s(r.responsavel).toLowerCase().includes(q) || s(r.lead_nome).toLowerCase().includes(q)
  })

  const COLS = ['Empresa', 'Responsável', 'Telefone', 'Cidade', 'UF', 'Honorário', 'Vencimento', 'Status']

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><DollarSign size={22} className="text-[#0BBCD4]" /> Financeiro</h1>
          <p className="text-gray-500 text-sm mt-0.5">{rows === null ? 'Carregando...' : `${filtered.length} cliente(s) em cobrança`}</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa ou responsável..."
            className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-72" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
        </div>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <DollarSign size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum cliente no financeiro ainda. Eles entram aqui ao concluir o onboarding.</p>
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
              {filtered.map(r => {
                const { cidade, uf } = parseCidadeEstado(s(r.emp_cidade_estado))
                return (
                  <tr key={s(r.lead_id)} onClick={() => r.cliente_id && router.push(`/sistema/clientes/cadastrar?cliente=${r.cliente_id}`)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ borderBottom: '1px solid var(--sys-surface-4)' }}>
                    <td className="px-4 py-3 font-semibold text-white">{s(r.emp_nome) || s(r.lead_nome) || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{s(r.responsavel) || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{s(r.emp_telefone) || s(r.whatsapp) || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{cidade || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{uf || '—'}</td>
                    <td className="px-4 py-3 text-[#22c55e] font-bold">{money(r.valor_honorario)}</td>
                    <td className="px-4 py-3 text-gray-400">{r.honorario_vencimento ? format(new Date(s(r.honorario_vencimento)), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s(r.financeiro_status) || 'em_aberto'} /></td>
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
