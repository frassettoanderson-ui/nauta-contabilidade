'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, DollarSign, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw, X, Plus, Trash2, Wallet, CheckCircle2, CircleDollarSign } from 'lucide-react'
import { listFinanceiro, listPagamentos, addPagamento, deletePagamento, asaasResumo, asaasSincronizarTodos, type PagamentoRow, type AsaasResumo } from '@/lib/api'
import type { ReactNode } from 'react'

type Row = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')
const brl = (v: unknown) => { const n = Number(v); return isNaN(n) ? 'R$ 0,00' : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
const dataBR = (v: unknown) => v ? format(new Date(s(v) + (s(v).length === 10 ? 'T00:00:00' : '')), 'dd/MM/yyyy', { locale: ptBR }) : '—'

const STATUS = {
  em_dia:   { label: 'Em dia',   bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  a_vencer: { label: 'A vencer', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  atrasado: { label: 'Atrasado', bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
} as const
type StatusKey = keyof typeof STATUS

function StatusBadge({ status }: { status: string }) {
  const c = STATUS[(status as StatusKey)] ?? STATUS.em_dia
  return <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>
}

// Card de resumo — texto centralizado
function Card({ label, valor, sub, cor, icon: Icon }: { label: string; valor: string; sub?: ReactNode; cor?: string; icon: typeof Wallet }) {
  return (
    <div className="flex-1 min-w-[200px] rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
      <Icon size={20} className="mb-1.5" style={{ color: cor || 'var(--sys-accent)' }} />
      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black mt-1.5" style={{ color: cor || '#fff', letterSpacing: '-0.02em' }}>{valor}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

const FILTROS: { id: 'todos' | StatusKey; label: string }[] = [
  { id: 'todos', label: 'Todos' }, { id: 'em_dia', label: 'Em dia' }, { id: 'a_vencer', label: 'A vencer' }, { id: 'atrasado', label: 'Atrasado' },
]

export default function FaturamentoPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | StatusKey>('todos')
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'empresa', dir: 1 })
  const [asaas, setAsaas] = useState<AsaasResumo | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [sel, setSel] = useState<Row | null>(null)

  const load = useCallback(() => {
    listFinanceiro().then(setRows).catch(() => setRows([]))
    asaasResumo().then(setAsaas).catch(() => setAsaas(null))
  }, [])
  useEffect(() => { load() }, [load])

  async function syncTodos() {
    if (!confirm('Cadastrar/atualizar TODOS os clientes ativos no Asaas (cliente + assinatura mensal)?')) return
    setSyncing(true)
    try {
      const r = await asaasSincronizarTodos()
      const falhas = r.resultados.filter(x => !x.ok)
      load()
      alert(`Asaas: ${r.resultados.length - falhas.length} sincronizado(s)` + (falhas.length ? `\n\nFalhas (${falhas.length}):\n` + falhas.map(f => `• ${f.nome}: ${f.erro}`).join('\n') : ''))
    } catch (e) { alert('Asaas: ' + ((e as Error).message || 'erro')) }
    finally { setSyncing(false) }
  }

  const base = rows ?? []
  const mesLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const tot = base.reduce((a: { receber: number; pago: number; aberto: number }, r) => {
    a.receber += Number(r.a_receber_mes || 0); a.pago += Number(r.pago_mes || 0); a.aberto += Number(r.em_aberto_mes || 0); return a
  }, { receber: 0, pago: 0, aberto: 0 })

  const filtered = base.filter(r => {
    if (filtro !== 'todos' && r.financeiro_status !== filtro) return false
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return s(r.emp_nome).toLowerCase().includes(q) || s(r.responsavel).toLowerCase().includes(q) || s(r.lead_nome).toLowerCase().includes(q)
  })

  const COLS: { label: string; key: string | null; align?: string }[] = [
    { label: 'Empresa', key: 'empresa' }, { label: 'Responsável', key: 'responsavel' },
    { label: 'Vencimento', key: 'vencimento' },
    { label: 'A receber', key: 'receber', align: 'right' }, { label: 'Pago', key: 'pago', align: 'right' }, { label: 'Em aberto', key: 'aberto', align: 'right' },
    { label: 'Status', key: 'status' },
  ]
  const sortKey = (r: Row, key: string): string | number => {
    switch (key) {
      case 'empresa': return (s(r.emp_nome) || s(r.lead_nome)).toLowerCase()
      case 'responsavel': return s(r.responsavel).toLowerCase()
      case 'vencimento': return s(r.proximo_vencimento)
      case 'receber': return Number(r.a_receber_mes ?? 0)
      case 'pago': return Number(r.pago_mes ?? 0)
      case 'aberto': return Number(r.em_aberto_mes ?? 0)
      case 'status': return ({ atrasado: 0, a_vencer: 1, em_dia: 2 } as Record<string, number>)[s(r.financeiro_status)] ?? 9
      default: return ''
    }
  }
  const sorted = [...filtered].sort((a, b) => {
    const va = sortKey(a, sort.key), vb = sortKey(b, sort.key)
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir
    return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true }) * sort.dir
  })
  const toggleSort = (key: string) => setSort(cur => cur.key === key ? { key, dir: (cur.dir === 1 ? -1 : 1) } : { key, dir: 1 })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><DollarSign size={22} className="text-[color:var(--sys-accent)]" /> Faturamento</h1>
          <p className="text-gray-500 text-sm mt-0.5 capitalize">{rows === null ? 'Carregando...' : `${mesLabel} · ${filtered.length} cliente(s)`}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {asaas?.configurado && (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 h-6 inline-flex items-center rounded-md"
                style={asaas.ambiente === 'production' ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' } : { background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                Asaas · {asaas.ambiente === 'production' ? 'produção' : 'sandbox (teste)'}
              </span>
              <button onClick={syncTodos} disabled={syncing}
                className="inline-flex items-center gap-2 px-3.5 h-10 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: 'rgba(124,111,255,0.9)' }}>
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> Sincronizar todos no Asaas
              </button>
            </>
          )}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa ou responsável..."
              className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-72" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
          </div>
        </div>
      </div>

      {/* Resumo do mês vigente */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Card icon={Wallet} label="A receber no mês" valor={brl(tot.receber)} sub="honorários do mês" />
        <Card icon={CheckCircle2} label="Recebido no mês" valor={brl(tot.pago)} cor="#22c55e" sub="pagamentos confirmados" />
        <Card icon={CircleDollarSign} label="Em aberto no mês" valor={brl(tot.aberto)} cor={tot.aberto > 0 ? '#f87171' : '#22c55e'} sub="ainda a receber" />
      </div>

      {/* Filtro por status */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map(f => {
          const ativo = filtro === f.id
          const n = f.id === 'todos' ? base.length : base.filter(r => r.financeiro_status === f.id).length
          const cor = f.id === 'todos' ? 'var(--sys-accent)' : STATUS[f.id].color
          return (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm font-bold transition-all"
              style={{ background: ativo ? `${cor}22` : 'var(--sys-surface-3)', color: ativo ? cor : '#9ca3af', border: `1px solid ${ativo ? cor + '55' : 'var(--sys-border-2)'}` }}>
              {f.label}<span className="text-[11px] px-1.5 rounded-full" style={{ background: 'var(--sys-surface-4)' }}>{n}</span>
            </button>
          )
        })}
      </div>

      {rows === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600"><DollarSign size={32} className="mx-auto mb-3 opacity-40" /><p className="text-sm">Nenhum cliente neste filtro.</p></div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
                {COLS.map((col, i) => col.key ? (
                  <th key={i} onClick={() => toggleSort(col.key!)}
                    className={`text-[11px] font-bold uppercase tracking-wide text-gray-500 px-4 py-3 cursor-pointer select-none hover:text-gray-300 transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                      {col.label}
                      {sort.key === col.key
                        ? (sort.dir === 1 ? <ChevronUp size={13} className="text-[color:var(--sys-accent)]" /> : <ChevronDown size={13} className="text-[color:var(--sys-accent)]" />)
                        : <ChevronsUpDown size={12} className="opacity-30" />}
                    </span>
                  </th>
                ) : <th key={i} className="px-4 py-3" />)}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={s(r.lead_id)} onClick={() => setSel(r)}
                  className="cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ borderBottom: '1px solid var(--sys-surface-4)' }}
                  title="Ver / registrar pagamento">
                  <td className="px-4 py-3 font-semibold text-white">{s(r.emp_nome) || s(r.lead_nome) || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{s(r.responsavel) || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{dataBR(r.proximo_vencimento)}</td>
                  <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{brl(r.a_receber_mes)}</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ color: Number(r.pago_mes) > 0 ? '#22c55e' : '#6b7280' }}>{brl(r.pago_mes)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold" style={{ color: Number(r.em_aberto_mes) > 0 ? '#f87171' : '#22c55e' }}>{brl(r.em_aberto_mes)}</td>
                  <td className="px-4 py-3"><StatusBadge status={s(r.financeiro_status)} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--sys-border)', background: 'var(--sys-surface-2)' }}>
                <td className="px-4 py-3 font-black text-white" colSpan={3}>Total ({filtered.length})</td>
                <td className="px-4 py-3 text-right font-black text-white tabular-nums">{brl(filtered.reduce((a, r) => a + Number(r.a_receber_mes || 0), 0))}</td>
                <td className="px-4 py-3 text-right font-black tabular-nums" style={{ color: '#22c55e' }}>{brl(filtered.reduce((a, r) => a + Number(r.pago_mes || 0), 0))}</td>
                <td className="px-4 py-3 text-right font-black tabular-nums" style={{ color: '#f87171' }}>{brl(filtered.reduce((a, r) => a + Number(r.em_aberto_mes || 0), 0))}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {sel && <PagamentosModal row={sel} onClose={() => setSel(null)} onChanged={load} />}
    </div>
  )
}

// Modal enxuto: ver e registrar pagamentos do cliente (baixa manual, além da automática do Asaas)
function PagamentosModal({ row, onClose, onChanged }: { row: Row; onClose: () => void; onChanged: () => void }) {
  const leadId = s(row.lead_id)
  const nome = s(row.emp_nome) || s(row.lead_nome)
  const [pagamentos, setPagamentos] = useState<PagamentoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [comp, setComp] = useState('')
  const [valorPg, setValorPg] = useState(row.valor_honorario != null ? String(row.valor_honorario) : '')
  const [pagoEm, setPagoEm] = useState('')
  const [saving, setSaving] = useState(false)
  const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
  const FIELD = 'w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none'

  const load = useCallback(() => { setLoading(true); listPagamentos(leadId).then(setPagamentos).finally(() => setLoading(false)) }, [leadId])
  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!comp) { alert('Selecione a competência (mês).'); return }
    setSaving(true)
    try { await addPagamento(leadId, comp, valorPg ? Number(valorPg) : null, pagoEm || null); setComp(''); setPagoEm(''); load(); onChanged() }
    catch { alert('Erro ao registrar pagamento.') } finally { setSaving(false) }
  }
  async function excluir(id: string) {
    if (!confirm('Excluir este pagamento?')) return
    try { await deletePagamento(leadId, id); load(); onChanged() } catch { alert('Erro.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-white">Pagamentos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-5">{nome} · honorário {brl(row.valor_honorario)}/mês</p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-[color:var(--sys-accent)]" /></div>
        ) : (
          <>
            <div className="space-y-1.5 mb-4 max-h-52 overflow-y-auto">
              {pagamentos.length === 0 ? <p className="text-gray-600 text-xs">Nenhum pagamento registrado.</p> : pagamentos.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg text-sm" style={{ background: 'var(--sys-surface-3)' }}>
                  <span className="text-gray-200">{p.competencia.split('-').reverse().join('/')}</span>
                  <span className="text-[#22c55e] text-xs font-bold">{brl(p.valor)}</span>
                  <span className="text-gray-500 text-xs">{p.pago_em ? dataBR(p.pago_em) : '—'}</span>
                  <button onClick={() => excluir(p.id)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
              <p className="text-[11px] font-bold text-gray-400">Registrar pagamento (baixa manual)</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] text-gray-500 mb-0.5">Competência</label>
                  <input type="month" value={comp} onChange={e => setComp(e.target.value)} className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-gray-500 mb-0.5">Valor</label>
                  <input type="number" step="0.01" value={valorPg} onChange={e => setValorPg(e.target.value)} placeholder="0,00" className={FIELD} style={FS} />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-gray-500 mb-0.5">Pago em</label>
                  <input type="date" value={pagoEm} onChange={e => setPagoEm(e.target.value)} className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
                </div>
              </div>
              <button onClick={salvar} disabled={saving} className="w-full h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                <Plus size={13} /> Registrar pagamento
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
