'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, DollarSign, MessageCircle, X, Plus, Trash2, Phone, Mail, Smartphone, CalendarClock } from 'lucide-react'
import { listFinanceiro, listPagamentos, addPagamento, deletePagamento, listEventos, addEvento, type PagamentoRow, type EventoRow } from '@/lib/api'

type Row = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')
const money = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) || v == null || v === '' ? '—' : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
const dataBR = (v: unknown) => v ? format(new Date(s(v) + (s(v).length === 10 ? 'T00:00:00' : '')), 'dd/MM/yyyy', { locale: ptBR }) : '—'
const primeiroNome = (n: string) => n.trim().split(/\s+/)[0]
const waDigits = (t: string) => (t || '').replace(/\D/g, '')

const STATUS = {
  em_dia:    { label: 'Em dia',   bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  a_vencer:  { label: 'A vencer', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  atrasado:  { label: 'Atrasado', bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
} as const
type StatusKey = keyof typeof STATUS

function StatusBadge({ status, meses }: { status: string; meses: number }) {
  const c = STATUS[(status as StatusKey)] ?? STATUS.em_dia
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>
      {c.label}
      {status === 'atrasado' && meses > 1 && (
        <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]" style={{ background: '#f87171', color: '#fff' }}>{meses}</span>
      )}
    </span>
  )
}

function msgCobranca(nome: string, meses: number) {
  const ref = meses > 1 ? `${meses} meses de honorário` : 'o honorário do mês vigente'
  return `Olá ${primeiroNome(nome)}, tudo bem? 😊\n\nAqui é da *Nauta Contabilidade*. Identificamos que ${ref} está em aberto.\n\nVocê poderia, por gentileza, nos informar uma previsão para o pagamento? Se precisar de segunda via ou de qualquer ajuda, é só nos chamar.\n\nDesde já agradecemos! 🙏`
}

const FILTROS: { id: 'todos' | StatusKey; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'em_dia', label: 'Em dia' },
  { id: 'a_vencer', label: 'A vencer' },
  { id: 'atrasado', label: 'Atrasado' },
]

export default function FinanceiroPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | StatusKey>('todos')
  const [cobranca, setCobranca] = useState<Row | null>(null)

  const load = useCallback(() => { listFinanceiro().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])

  const base = rows ?? []
  const cont = {
    em_dia: base.filter(r => r.financeiro_status === 'em_dia').length,
    a_vencer: base.filter(r => r.financeiro_status === 'a_vencer').length,
    atrasado: base.filter(r => r.financeiro_status === 'atrasado').length,
  }

  const filtered = base.filter(r => {
    if (filtro !== 'todos' && r.financeiro_status !== filtro) return false
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return s(r.emp_nome).toLowerCase().includes(q) || s(r.responsavel).toLowerCase().includes(q) || s(r.lead_nome).toLowerCase().includes(q)
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><DollarSign size={22} className="text-[#0BBCD4]" /> Faturamento</h1>
          <p className="text-gray-500 text-sm mt-0.5">{rows === null ? 'Carregando...' : `${filtered.length} cliente(s) · honorários`}</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa ou responsável..."
            className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-72" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map(f => {
          const ativo = filtro === f.id
          const n = f.id === 'todos' ? base.length : cont[f.id]
          const cor = f.id === 'todos' ? '#0BBCD4' : STATUS[f.id].color
          return (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm font-bold transition-all"
              style={{ background: ativo ? `${cor}22` : 'var(--sys-surface-3)', color: ativo ? cor : '#9ca3af', border: `1px solid ${ativo ? cor + '55' : 'var(--sys-border-2)'}` }}>
              {f.label}
              <span className="text-[11px] px-1.5 rounded-full" style={{ background: 'var(--sys-surface-4)' }}>{n}</span>
            </button>
          )
        })}
      </div>

      {rows === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <DollarSign size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum cliente neste filtro. Eles entram aqui ao concluir o onboarding.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
                {['Empresa', 'Responsável', 'Telefone', 'Honorário', 'Vencimento', 'Prazo prometido', 'Status', ''].map((col, i) => (
                  <th key={i} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-4 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const meses = Number(r.meses_atraso ?? 0)
                const tel = s(r.emp_telefone) || s(r.whatsapp)
                return (
                  <tr key={s(r.lead_id)} onClick={() => setCobranca(r)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ borderBottom: '1px solid var(--sys-surface-4)' }}>
                    <td className="px-4 py-3 font-semibold text-white">{s(r.emp_nome) || s(r.lead_nome) || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{s(r.responsavel) || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{tel || '—'}</td>
                    <td className="px-4 py-3 text-[#22c55e] font-bold">{money(r.valor_honorario)}</td>
                    <td className="px-4 py-3 text-gray-400">{dataBR(r.proximo_vencimento)}</td>
                    <td className="px-4 py-3">{r.prazo_prometido ? <span className="text-[#fbbf24]">{dataBR(r.prazo_prometido)}</span> : <span className="text-gray-600">—</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={s(r.financeiro_status)} meses={meses} /></td>
                    <td className="px-4 py-3">
                      {r.financeiro_status === 'atrasado' && (
                        <a onClick={e => e.stopPropagation()} href={`https://wa.me/55${waDigits(tel)}?text=${encodeURIComponent(msgCobranca(s(r.lead_nome) || s(r.responsavel), meses))}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 h-7 rounded-lg text-white" style={{ background: '#25D366' }}>
                          <MessageCircle size={12} /> Enviar cobrança
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {cobranca && <CobrancaModal row={cobranca} onClose={() => setCobranca(null)} onChanged={load} />}
    </div>
  )
}

const TIPOS = [
  { id: 'ligacao', label: 'Ligação', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Smartphone },
]

function CobrancaModal({ row, onClose, onChanged }: { row: Row; onClose: () => void; onChanged: () => void }) {
  const leadId = s(row.lead_id)
  const nome = s(row.emp_nome) || s(row.lead_nome)
  const [pagamentos, setPagamentos] = useState<PagamentoRow[]>([])
  const [eventos, setEventos] = useState<EventoRow[]>([])
  const [loading, setLoading] = useState(true)

  // form pagamento
  const [comp, setComp] = useState('')
  const [valorPg, setValorPg] = useState(row.valor_honorario != null ? String(row.valor_honorario) : '')
  const [pagoEm, setPagoEm] = useState('')
  // form evento
  const [tipo, setTipo] = useState('ligacao')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listPagamentos(leadId), listEventos(leadId)])
      .then(([p, e]) => { setPagamentos(p); setEventos(e) })
      .finally(() => setLoading(false))
  }, [leadId])
  useEffect(() => { load() }, [load])

  const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
  const FIELD = 'w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none'

  async function salvarPagamento() {
    if (!comp) { alert('Selecione a competência (mês).'); return }
    setSaving(true)
    try { await addPagamento(leadId, comp, valorPg ? Number(valorPg) : null, pagoEm || null); setComp(''); setPagoEm(''); load(); onChanged() }
    catch { alert('Erro ao registrar pagamento.') }
    finally { setSaving(false) }
  }
  async function excluirPagamento(id: string) {
    if (!confirm('Excluir este pagamento?')) return
    try { await deletePagamento(leadId, id); load(); onChanged() } catch { alert('Erro.') }
  }
  async function salvarEvento() {
    if (!descricao.trim()) { alert('Descreva o que foi combinado.'); return }
    setSaving(true)
    try { await addEvento(leadId, tipo, descricao.trim(), prazo || null); setDescricao(''); setPrazo(''); load(); onChanged() }
    catch { alert('Erro ao registrar evento.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-white">Ações de cobrança</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-5">{nome} · honorário {money(row.valor_honorario)}/mês</p>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[#0BBCD4]" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Pagamentos */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Histórico de pagamentos</p>
              <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
                {pagamentos.length === 0 ? <p className="text-gray-600 text-xs">Nenhum pagamento registrado.</p> : pagamentos.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg text-sm" style={{ background: 'var(--sys-surface-3)' }}>
                    <span className="text-gray-200">{p.competencia.split('-').reverse().join('/')}</span>
                    <span className="text-[#22c55e] text-xs font-bold">{money(p.valor)}</span>
                    <button onClick={() => excluirPagamento(p.id)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                <p className="text-[11px] font-bold text-gray-400">Registrar pagamento</p>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">Competência (mês)</label>
                  <input type="month" value={comp} onChange={e => setComp(e.target.value)} className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-gray-500 mb-0.5">Valor</label>
                    <input type="number" step="0.01" value={valorPg} onChange={e => setValorPg(e.target.value)} placeholder="0,00" className={FIELD} style={FS} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-gray-500 mb-0.5">Pago em</label>
                    <input type="date" value={pagoEm} onChange={e => setPagoEm(e.target.value)} className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
                  </div>
                </div>
                <button onClick={salvarPagamento} disabled={saving} className="w-full h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                  <Plus size={13} /> Registrar pagamento
                </button>
              </div>
            </div>

            {/* Eventos */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Eventos de cobrança</p>
              <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
                {eventos.length === 0 ? <p className="text-gray-600 text-xs">Nenhum evento registrado.</p> : eventos.map(ev => {
                  const T = TIPOS.find(t => t.id === ev.tipo)
                  const Icon = T?.icon ?? Phone
                  return (
                    <div key={ev.id} className="p-2 rounded-lg text-sm" style={{ background: 'var(--sys-surface-3)' }}>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Icon size={12} className="text-[#0BBCD4]" /> <b className="text-gray-300">{T?.label ?? ev.tipo}</b>
                        <span className="ml-auto">{format(new Date(ev.criado_em), 'dd/MM HH:mm', { locale: ptBR })}</span>
                      </div>
                      <p className="text-gray-200 text-xs mt-1 whitespace-pre-wrap">{ev.descricao}</p>
                      {ev.prazo_pagamento && <p className="text-[11px] text-[#fbbf24] mt-1 flex items-center gap-1"><CalendarClock size={11} /> Prazo: {dataBR(ev.prazo_pagamento)}</p>}
                    </div>
                  )
                })}
              </div>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                <p className="text-[11px] font-bold text-gray-400">Registrar acionamento</p>
                <div className="flex gap-1.5">
                  {TIPOS.map(t => (
                    <button key={t.id} onClick={() => setTipo(t.id)} title={t.label}
                      className="flex-1 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: tipo === t.id ? 'rgba(11,188,212,0.15)' : 'var(--sys-surface-3)', border: `1px solid ${tipo === t.id ? 'rgba(11,188,212,0.4)' : 'var(--sys-border-2)'}`, color: tipo === t.id ? '#0BBCD4' : '#9ca3af' }}>
                      <t.icon size={14} />
                    </button>
                  ))}
                </div>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="O que foi combinado..." rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none resize-none" style={FS} />
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">Prazo prometido (opcional)</label>
                  <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
                </div>
                <button onClick={salvarEvento} disabled={saving} className="w-full h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
                  <Plus size={13} /> Registrar acionamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
