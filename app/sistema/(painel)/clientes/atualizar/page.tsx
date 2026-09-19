'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Loader2, RefreshCw, Search, Check, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react'
import { listClientes, atualizarEmpresaCliente } from '@/lib/api'
import { fetchCNPJ } from '@/lib/form-masks'

type Row = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')
type StatusTipo = 'idle' | 'buscando' | 'ok' | 'erro' | 'sem-cnpj'
interface St { tipo: StatusTipo; msg?: string }

// Aguarda ms (usado para espaçar as consultas à Receita e evitar bloqueio por rate limit).
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function AtualizarClientesPage() {
  const [clientes, setClientes] = useState<Row[] | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<Record<string, St>>({})
  const [busca, setBusca] = useState('')
  const [rodando, setRodando] = useState(false)
  const [progresso, setProgresso] = useState<{ feitos: number; total: number } | null>(null)

  const load = useCallback(() => {
    listClientes().then(list => setClientes(list.filter(c => (s(c.situacao) || 'ativo') !== 'inativo'))).catch(() => setClientes([]))
  }, [])
  useEffect(() => { load() }, [load])

  const setSt = (id: string, st: St) => setStatus(prev => ({ ...prev, [id]: st }))
  const temCnpj = (c: Row) => s(c.emp_cnpj).replace(/\D/g, '').length === 14

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const base = clientes ?? []
    if (!q) return base
    return base.filter(c =>
      s(c.emp_nome).toLowerCase().includes(q) ||
      s(c.emp_cnpj).replace(/\D/g, '').includes(q.replace(/\D/g, '')))
  }, [clientes, busca])

  const selecionaveis = useMemo(() => filtrados.filter(temCnpj), [filtrados])
  const todosSelecionados = selecionaveis.length > 0 && selecionaveis.every(c => sel.has(s(c.id)))

  function toggle(id: string) {
    setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleTodos() {
    if (todosSelecionados) setSel(new Set())
    else setSel(new Set(selecionaveis.map(c => s(c.id))))
  }

  // Consulta a Receita e atualiza os dados da empresa de um cliente.
  async function atualizarUm(c: Row): Promise<boolean> {
    const id = s(c.id)
    if (!temCnpj(c)) { setSt(id, { tipo: 'sem-cnpj' }); return false }
    setSt(id, { tipo: 'buscando' })
    try {
      const d = await fetchCNPJ(s(c.emp_cnpj))
      if (!d) { setSt(id, { tipo: 'erro', msg: 'CNPJ não encontrado na Receita' }); return false }
      const fields = {
        emp_nome: d.razao_social,
        emp_fantasia: d.nome_fantasia,
        emp_endereco: [d.logradouro, d.numero].filter(Boolean).join(', '),
        emp_bairro: d.bairro,
        emp_cep: d.cep,
        emp_cidade_estado: d.municipio ? `${d.municipio}/${d.uf}` : '',
        emp_telefone: d.telefone,
        emp_atividade: d.atividade,
      }
      await atualizarEmpresaCliente(id, fields)
      // Reflete o novo nome na própria lista
      setClientes(prev => (prev ?? []).map(x => (s(x.id) === id ? { ...x, emp_nome: d.razao_social || x.emp_nome } : x)))
      setSt(id, { tipo: 'ok' })
      return true
    } catch (e) {
      setSt(id, { tipo: 'erro', msg: (e as Error).message || 'Falha ao atualizar' })
      return false
    }
  }

  // Processa uma lista de clientes em sequência (espaça as chamadas à Receita).
  async function processar(lista: Row[]) {
    if (rodando || lista.length === 0) return
    setRodando(true)
    setProgresso({ feitos: 0, total: lista.length })
    for (let i = 0; i < lista.length; i++) {
      await atualizarUm(lista[i])
      setProgresso({ feitos: i + 1, total: lista.length })
      if (i < lista.length - 1) await sleep(400) // respeita o rate limit da BrasilAPI
    }
    setRodando(false)
  }

  const atualizarSelecionados = () => processar(filtrados.filter(c => sel.has(s(c.id)) && temCnpj(c)))
  const atualizarTodos = () => processar((clientes ?? []).filter(temCnpj))

  const semCnpj = (clientes ?? []).filter(c => !temCnpj(c)).length
  const okCount = Object.values(status).filter(x => x.tipo === 'ok').length
  const erroCount = Object.values(status).filter(x => x.tipo === 'erro').length

  const Chip = ({ st }: { st?: St }) => {
    if (!st || st.tipo === 'idle') return <span className="text-gray-600 text-xs">—</span>
    if (st.tipo === 'buscando') return <span className="inline-flex items-center gap-1 text-[color:var(--sys-accent)] text-xs font-semibold"><Loader2 size={12} className="animate-spin" /> Consultando…</span>
    if (st.tipo === 'ok') return <span className="inline-flex items-center gap-1 text-[#22c55e] text-xs font-semibold"><CheckCircle2 size={12} /> Atualizado</span>
    if (st.tipo === 'sem-cnpj') return <span className="text-amber-400 text-xs font-semibold">Sem CNPJ</span>
    return <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold" title={st.msg}><AlertTriangle size={12} /> Erro</span>
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <RefreshCw size={22} className="text-[color:var(--sys-accent)]" /> Atualizar clientes
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Consulta o CNPJ de cada cliente na Receita (BrasilAPI) e atualiza os dados da empresa (razão social, fantasia, endereço, CEP, cidade/UF, telefone e atividade).</p>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ…"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
            style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
        </div>
        <button onClick={atualizarSelecionados} disabled={rodando || sel.size === 0}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
          {rodando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Atualizar selecionados ({sel.size})
        </button>
        <button onClick={atualizarTodos} disabled={rodando || (clientes ?? []).filter(temCnpj).length === 0}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
          {rodando ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Atualizar todos
        </button>
      </div>

      {/* Progresso / resumo */}
      {(rodando || progresso) && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <div className="flex items-center justify-between text-gray-300">
            <span>{rodando ? 'Atualizando…' : 'Concluído'} {progresso ? `${progresso.feitos}/${progresso.total}` : ''}</span>
            <span className="text-xs">
              <span className="text-[#22c55e] font-bold">{okCount} ok</span>
              {erroCount > 0 && <span className="text-red-400 font-bold"> · {erroCount} erro(s)</span>}
            </span>
          </div>
          {progresso && (
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sys-surface-3)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(progresso.feitos / progresso.total) * 100}%`, background: 'var(--sys-accent)' }} />
            </div>
          )}
        </div>
      )}

      {semCnpj > 0 && (
        <p className="text-xs text-amber-400/90 mb-3 flex items-center gap-1.5">
          <AlertTriangle size={13} /> {semCnpj} cliente(s) sem CNPJ cadastrado não podem ser atualizados automaticamente.
        </p>
      )}

      {/* Tabela */}
      {clientes === null ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-600"><Building2 size={32} className="mx-auto mb-3 opacity-40" /><p className="text-sm">Nenhum cliente encontrado.</p></div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-500" style={{ background: 'var(--sys-surface-2)' }}>
                <th className="px-4 py-2.5 w-10 text-center">
                  <input type="checkbox" checked={todosSelecionados} onChange={toggleTodos} className="w-4 h-4 accent-[var(--sys-accent)]" title="Selecionar todos" />
                </th>
                <th className="text-left px-4 py-2.5 font-semibold">Empresa</th>
                <th className="text-left px-4 py-2.5 font-semibold">CNPJ</th>
                <th className="text-center px-4 py-2.5 font-semibold">Status</th>
                <th className="text-center px-4 py-2.5 font-semibold w-24">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => {
                const id = s(c.id)
                const podeAtualizar = temCnpj(c)
                return (
                  <tr key={id} className="border-t" style={{ borderColor: 'var(--sys-border)', opacity: podeAtualizar ? 1 : 0.55 }}>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" disabled={!podeAtualizar || rodando} checked={sel.has(id)} onChange={() => toggle(id)} className="w-4 h-4 accent-[var(--sys-accent)]" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{s(c.emp_nome) || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s(c.emp_cnpj) || <span className="text-amber-400/80">sem CNPJ</span>}</td>
                    <td className="px-4 py-3 text-center"><Chip st={status[id]} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => atualizarUm(c)} disabled={!podeAtualizar || rodando || status[id]?.tipo === 'buscando'}
                        title="Atualizar este cliente" className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[color:var(--sys-accent)] disabled:opacity-30"
                        style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
                        {status[id]?.tipo === 'buscando' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      </button>
                    </td>
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
