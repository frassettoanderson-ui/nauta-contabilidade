'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, Building2, FileDown } from 'lucide-react'
import { listClientes } from '@/lib/api'
import { parseCidadeEstado } from '@/lib/form-masks'

type Cli = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')

const SIT: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: '#22c55e' },
  em_processo: { label: 'Em processo', color: '#eab308' },
  inativo: { label: 'Inativo', color: '#9ca3af' },
}
const ORDENS: { key: string; label: string; campo: string }[] = [
  { key: 'nome', label: 'Nome da empresa', campo: 'emp_nome' },
  { key: 'cnpj', label: 'CNPJ', campo: 'emp_cnpj' },
  { key: 'responsavel', label: 'Responsável', campo: 'responsavel' },
  { key: 'cidade', label: 'Cidade/UF', campo: 'emp_cidade_estado' },
  { key: 'situacao', label: 'Situação', campo: 'situacao' },
  { key: 'cadastro', label: 'Data de cadastro', campo: 'criado_em' },
]

export default function RelatorioEmpresasPage() {
  const [clientes, setClientes] = useState<Cli[] | null>(null)
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('nome')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [gerando, setGerando] = useState(false)

  useEffect(() => { listClientes().then(setClientes).catch(() => setClientes([])) }, [])

  const lista = useMemo(() => {
    const campo = (ORDENS.find(o => o.key === ordem) ?? ORDENS[0]).campo
    const arr = (clientes ?? []).filter(c => {
      if (!busca.trim()) return true
      const q = busca.toLowerCase()
      return s(c.emp_nome).toLowerCase().includes(q) || s(c.responsavel).toLowerCase().includes(q)
        || s(c.emp_cnpj).replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    })
    return [...arr].sort((a, b) => campo === 'criado_em'
      ? s(b.criado_em).localeCompare(s(a.criado_em))
      : s(a[campo]).localeCompare(s(b[campo]), 'pt-BR', { sensitivity: 'base', numeric: true }))
  }, [clientes, busca, ordem])

  const todosSel = lista.length > 0 && lista.every(c => sel.has(s(c.id)))
  function toggle(id: string) { setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  function toggleTodos() {
    setSel(p => {
      if (todosSel) { const n = new Set(p); lista.forEach(c => n.delete(s(c.id))); return n }
      const n = new Set(p); lista.forEach(c => n.add(s(c.id))); return n
    })
  }

  async function gerarPdf() {
    const ids = lista.filter(c => sel.has(s(c.id))).map(c => s(c.id))
    if (ids.length === 0) { alert('Selecione ao menos uma empresa.'); return }
    setGerando(true)
    try {
      const res = await fetch('/api/relatorios/empresas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, ordem }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'relatorio-empresas.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Não foi possível gerar o PDF.')
    } finally { setGerando(false) }
  }

  const COLS: { label: string; w: string }[] = [
    { label: '', w: '4%' }, { label: 'Empresa', w: '20%' }, { label: 'CNPJ', w: '15%' },
    { label: 'Responsável', w: '16%' }, { label: 'Telefone', w: '12%' }, { label: 'Cidade', w: '12%' },
    { label: 'UF', w: '5%' }, { label: 'Cadastro', w: '8%' }, { label: 'Situação', w: '8%' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><Building2 size={22} className="text-[color:var(--sys-accent)]" /> Relatório de Empresas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clientes === null ? 'Carregando...' : `${sel.size} selecionada(s) de ${lista.length}`}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
              className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-56" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
          </div>
          <select value={ordem} onChange={e => setOrdem(e.target.value)}
            className="h-10 px-3 rounded-xl text-sm text-white outline-none cursor-pointer" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
            {ORDENS.map(o => <option key={o.key} value={o.key} style={{ background: '#13111f' }}>Ordenar por: {o.label}</option>)}
          </select>
          <button onClick={gerarPdf} disabled={gerando || sel.size === 0}
            className="h-10 px-4 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--sys-accent), #6355e0)' }}>
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} Gerar PDF
          </button>
        </div>
      </div>

      {clientes === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm table-fixed">
            <colgroup>{COLS.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
                <th className="px-3 py-3"><input type="checkbox" checked={todosSel} onChange={toggleTodos} className="accent-[color:var(--sys-accent)] w-4 h-4 cursor-pointer" /></th>
                {COLS.slice(1).map(col => <th key={col.label} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-3 py-3 truncate">{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {lista.map(c => {
                const { cidade, uf } = parseCidadeEstado(s(c.emp_cidade_estado))
                const cfg = SIT[s(c.situacao) || 'ativo'] ?? SIT.ativo
                const id = s(c.id)
                return (
                  <tr key={id} onClick={() => toggle(id)} className="cursor-pointer hover:bg-white/[0.03]" style={{ borderBottom: '1px solid var(--sys-surface-4)' }}>
                    <td className="px-3 py-3"><input type="checkbox" checked={sel.has(id)} onChange={() => toggle(id)} onClick={e => e.stopPropagation()} className="accent-[color:var(--sys-accent)] w-4 h-4 cursor-pointer" /></td>
                    <td className="px-3 py-3 font-semibold text-white truncate" title={s(c.emp_nome)}>{s(c.emp_nome) || s(c.responsavel) || '—'}</td>
                    <td className="px-3 py-3 text-gray-400 font-mono text-xs truncate">{s(c.emp_cnpj) || '—'}</td>
                    <td className="px-3 py-3 text-gray-300 truncate" title={s(c.responsavel)}>{s(c.responsavel) || '—'}</td>
                    <td className="px-3 py-3 text-gray-400 truncate">{s(c.emp_telefone) || '—'}</td>
                    <td className="px-3 py-3 text-gray-400 truncate" title={cidade}>{cidade || '—'}</td>
                    <td className="px-3 py-3 text-gray-400">{uf || '—'}</td>
                    <td className="px-3 py-3 text-gray-500 truncate">{c.criado_em ? format(new Date(s(c.criado_em)), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</td>
                    <td className="px-3 py-3"><span className="text-[11px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span></td>
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
