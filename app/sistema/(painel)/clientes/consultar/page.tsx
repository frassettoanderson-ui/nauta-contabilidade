'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, Users, Building2, DollarSign } from 'lucide-react'
import { listClientes, setSituacaoCliente } from '@/lib/api'
import { parseCidadeEstado } from '@/lib/form-masks'
import CobrancaModal from '@/components/sistema/CobrancaModal'

type Cli = Record<string, unknown>

const s = (v: unknown) => String(v ?? '')

const SIT: Record<string, { label: string; color: string; bg: string }> = {
  ativo:       { label: 'Ativo',       color: '#22c55e', bg: 'rgba(34,197,94,0.14)' },
  em_processo: { label: 'Em processo', color: '#eab308', bg: 'rgba(234,179,8,0.14)' },
  inativo:     { label: 'Inativo',     color: '#9ca3af', bg: 'rgba(156,163,175,0.14)' },
}
const SIT_KEYS = ['ativo', 'em_processo', 'inativo'] as const

export default function ConsultarClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cli[] | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroSit, setFiltroSit] = useState<'todos' | 'ativo' | 'em_processo' | 'inativo'>('todos')
  const [cobranca, setCobranca] = useState<{ leadId: string; nome: string; cnpj: string } | null>(null)

  useEffect(() => { listClientes().then(setClientes).catch(() => setClientes([])) }, [])

  async function mudarSituacao(id: string, situacao: string) {
    const anterior = clientes
    setClientes(cs => (cs ?? []).map(c => (s(c.id) === id ? { ...c, situacao } : c)))
    try {
      await setSituacaoCliente(id, situacao)
    } catch {
      setClientes(anterior)
      alert('Não foi possível alterar a situação.')
    }
  }

  const filtered = (clientes ?? []).filter(c => {
    if (filtroSit !== 'todos' && (s(c.situacao) || 'ativo') !== filtroSit) return false
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return s(c.emp_nome).toLowerCase().includes(q)
      || s(c.responsavel).toLowerCase().includes(q)
      || s(c.emp_cnpj).replace(/\D/g, '').includes(q.replace(/\D/g, ''))
  })

  const contagem = (k: string) => (clientes ?? []).filter(c => (s(c.situacao) || 'ativo') === k).length

  const COLS: { label: string; w: string }[] = [
    { label: 'Empresa', w: '16%' },
    { label: 'CNPJ', w: '14%' },
    { label: 'Responsável', w: '14%' },
    { label: 'Telefone', w: '11%' },
    { label: 'Cidade', w: '12%' },
    { label: 'UF', w: '4%' },
    { label: 'Cadastro', w: '8%' },
    { label: 'Cobrança', w: '10%' },
    { label: 'Situação', w: '11%' },
  ]

  const chip = (key: 'todos' | 'ativo' | 'em_processo' | 'inativo', label: string, cor?: string) => {
    const ativo = filtroSit === key
    return (
      <button key={key} onClick={() => setFiltroSit(key)}
        className="h-9 px-3.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
        style={{
          background: ativo ? (cor ? `color-mix(in srgb, ${cor} 18%, transparent)` : 'color-mix(in srgb, var(--sys-accent) 18%, transparent)') : 'var(--sys-surface-3)',
          color: ativo ? (cor ?? 'var(--sys-accent)') : '#9ca3af',
          border: `1px solid ${ativo ? (cor ? `color-mix(in srgb, ${cor} 40%, transparent)` : 'color-mix(in srgb, var(--sys-accent) 40%, transparent)') : 'var(--sys-border-2)'}`,
        }}>
        {label}{key !== 'todos' && <span className="opacity-60 ml-1">{contagem(key)}</span>}
      </button>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><Users size={22} className="text-[color:var(--sys-accent)]" /> Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clientes === null ? 'Carregando...' : `${filtered.length} cliente(s)`}</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa, responsável ou CNPJ..."
            className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-72" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
        </div>
      </div>

      {/* Filtro por situação */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {chip('todos', 'Todos')}
        {chip('ativo', 'Ativo', SIT.ativo.color)}
        {chip('em_processo', 'Em processo', SIT.em_processo.color)}
        {chip('inativo', 'Inativo', SIT.inativo.color)}
      </div>

      {clientes === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum cliente nesta visão.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm table-fixed">
            <colgroup>
              {COLS.map(col => <col key={col.label} style={{ width: col.w }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
                {COLS.map(col => (
                  <th key={col.label} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-3 py-3 truncate">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const { cidade, uf } = parseCidadeEstado(s(c.emp_cidade_estado))
                const sit = s(c.situacao) || 'ativo'
                const cfg = SIT[sit] ?? SIT.ativo
                const nome = s(c.emp_nome) || s(c.responsavel) || '—'
                return (
                  <tr key={s(c.id)} style={{ borderBottom: '1px solid var(--sys-surface-4)' }}>
                    <td className="px-3 py-3">
                      <button onClick={() => router.push(`/sistema/clientes/cadastrar?cliente=${c.id}`)} title={nome}
                        className="block w-full truncate text-left font-semibold text-white hover:text-[color:var(--sys-accent)] hover:underline">
                        {nome}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-gray-400 font-mono text-xs truncate">{s(c.emp_cnpj) || '—'}</td>
                    <td className="px-3 py-3 text-gray-300 truncate" title={s(c.responsavel)}>{s(c.responsavel) || '—'}</td>
                    <td className="px-3 py-3 text-gray-400 truncate">{s(c.emp_telefone) || '—'}</td>
                    <td className="px-3 py-3 text-gray-400 truncate" title={cidade}>{cidade || '—'}</td>
                    <td className="px-3 py-3 text-gray-400">{uf || '—'}</td>
                    <td className="px-3 py-3 text-gray-500 truncate">{c.criado_em ? format(new Date(s(c.criado_em)), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => setCobranca({ leadId: s(c.lead_id), nome: s(c.emp_nome), cnpj: s(c.emp_cnpj) })}
                        title="Cadastrar cobrança"
                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap"
                        style={{ background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.45)', color: '#f87171' }}>
                        <DollarSign size={13} /> Cobrança
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <select value={sit} onChange={e => mudarSituacao(s(c.id), e.target.value)}
                        className="w-full h-8 pl-2.5 pr-6 rounded-lg text-xs font-bold outline-none cursor-pointer appearance-none"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid color-mix(in srgb, ${cfg.color} 35%, transparent)` }}>
                        {SIT_KEYS.map(k => <option key={k} value={k} style={{ background: '#13111f', color: '#fff' }}>{SIT[k].label}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {cobranca && <CobrancaModal leadId={cobranca.leadId} nome={cobranca.nome} cnpj={cobranca.cnpj} onClose={() => setCobranca(null)} />}
    </div>
  )
}
