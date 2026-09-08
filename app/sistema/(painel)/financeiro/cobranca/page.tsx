'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, DollarSign, MessageCircle, X, Plus, Trash2, Phone, Mail, Smartphone, CalendarClock, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, RefreshCw, Send, Copy, Zap, AlertTriangle } from 'lucide-react'
import { listFinanceiro, listPagamentos, addPagamento, deletePagamento, listEventos, addEvento, asaasResumo, asaasSincronizar, enviosResumo, enviarCobrancaAgora, listEnviosCobranca, gerarPixAutomatico, getPixAutomatico, cancelarPixAutomatico, type PagamentoRow, type EventoRow, type AsaasResumo, type AsaasResumoItem, type EnviosResumo, type EnvioRow, type PixAutoRow, type TipoEnvioCobranca } from '@/lib/api'

type Row = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')
const money = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) || v == null || v === '' ? '—' : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
const dataBR = (v: unknown) => { if (!v) return '—'; const str = s(v); const d = new Date(str.length === 10 ? str + 'T00:00:00' : str); return isNaN(d.getTime()) ? '—' : format(d, 'dd/MM/yyyy', { locale: ptBR }) }
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

export default function FinanceiroPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busca, setBusca] = useState('')
  const [cobranca, setCobranca] = useState<Row | null>(null)
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'empresa', dir: 1 })

  const [asaas, setAsaas] = useState<AsaasResumo | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null) // leadId em sincronização, ou 'todos'
  const [envios, setEnvios] = useState<EnviosResumo | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)

  const load = useCallback(() => {
    listFinanceiro().then(setRows).catch(() => setRows([]))
    asaasResumo().then(setAsaas).catch(() => setAsaas(null))
    enviosResumo().then(setEnvios).catch(() => setEnvios(null))
  }, [])
  useEffect(() => { load() }, [load])

  // Envio manual pelo WhatsApp da Nauta (+ e-mail se configurado); registra em cobranca_envios
  async function enviar(leadId: string, tipo: TipoEnvioCobranca) {
    setEnviando(leadId)
    try {
      const r = await enviarCobrancaAgora(leadId, tipo)
      const falha = r.envios.filter(e => !e.ok)
      load()
      if (falha.length) alert('Falha no envio:\n' + falha.map(f => `• ${f.canal}: ${f.erro}`).join('\n'))
    } catch (e) { alert('Envio: ' + ((e as Error).message || 'erro')) }
    finally { setEnviando(null) }
  }
  async function syncLead(leadId: string) {
    setSyncing(leadId)
    try { await asaasSincronizar(leadId); load() }
    catch (e) { alert('Asaas: ' + ((e as Error).message || 'erro ao sincronizar')) }
    finally { setSyncing(null) }
  }

  const base = rows ?? []

  // Cobrança = apenas clientes em atraso
  const totalEmAberto = base.filter(r => r.financeiro_status === 'atrasado').reduce((s, r) => s + Number(r.valor_honorario || 0), 0)
  const filtered = base.filter(r => {
    if (r.financeiro_status !== 'atrasado') return false
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return s(r.emp_nome).toLowerCase().includes(q) || s(r.responsavel).toLowerCase().includes(q) || s(r.lead_nome).toLowerCase().includes(q)
  })

  // Ordenação por cabeçalho (clique alterna asc/desc)
  const COLS: { label: string; key: string | null }[] = [
    { label: 'Empresa', key: 'empresa' }, { label: 'Responsável', key: 'responsavel' },
    { label: 'Telefone', key: 'telefone' }, { label: 'Honorário', key: 'honorario' },
    { label: 'Vencimento', key: 'vencimento' }, { label: 'Prazo prometido', key: 'prazo' },
    { label: 'Status', key: 'status' }, { label: 'Cobrança Asaas', key: null }, { label: '', key: null },
  ]
  const sortKey = (r: Row, key: string): string | number => {
    switch (key) {
      case 'empresa': return (s(r.emp_nome) || s(r.lead_nome)).toLowerCase()
      case 'responsavel': return s(r.responsavel).toLowerCase()
      case 'telefone': return s(r.emp_telefone) || s(r.whatsapp)
      case 'honorario': return Number(r.valor_honorario ?? 0)
      case 'vencimento': return s(r.proximo_vencimento)
      case 'prazo': return s(r.prazo_prometido)
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
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><AlertTriangle size={22} className="text-[#f87171]" /> Cobrança</h1>
          <p className="text-gray-500 text-sm mt-0.5">{rows === null ? 'Carregando...' : `${filtered.length} cliente(s) em atraso · R$ ${totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto`}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {asaas?.configurado && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 h-6 inline-flex items-center rounded-md"
              style={asaas.ambiente === 'production'
                ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                : { background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
              Asaas · {asaas.ambiente === 'production' ? 'produção' : 'sandbox (teste)'}
            </span>
          )}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa ou responsável..."
              className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-72" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
          </div>
        </div>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
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
                {COLS.map((col, i) => col.key ? (
                  <th key={i} onClick={() => toggleSort(col.key!)}
                    className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-4 py-3 cursor-pointer select-none hover:text-gray-300 transition-colors">
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sort.key === col.key
                        ? (sort.dir === 1 ? <ChevronUp size={13} className="text-[color:var(--sys-accent)]" /> : <ChevronDown size={13} className="text-[color:var(--sys-accent)]" />)
                        : <ChevronsUpDown size={12} className="opacity-30" />}
                    </span>
                  </th>
                ) : (
                  <th key={i} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-4 py-3">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
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
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <AsaasCell item={asaas?.resumo[s(r.lead_id)]} configurado={!!asaas?.configurado} pixAuto={envios?.pixAuto[s(r.lead_id)]}
                        syncing={syncing === s(r.lead_id)} onSync={() => syncLead(s(r.lead_id))} />
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {(() => {
                        const lid = s(r.lead_id)
                        const ult = envios?.envios[lid]
                        const tipo: TipoEnvioCobranca = r.financeiro_status === 'atrasado' ? 'atraso' : 'lembrete'
                        const temCob = !!asaas?.resumo[lid]
                        return (
                          <div className="flex items-center gap-2">
                            {envios?.whats ? (
                              <button onClick={() => enviar(lid, tipo)} disabled={enviando === lid || !temCob}
                                title={temCob ? `Enviar ${tipo} pelo WhatsApp da Nauta` : 'Sincronize no Asaas primeiro (sem cobrança gerada)'}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 h-7 rounded-lg text-white disabled:opacity-40" style={{ background: '#25D366' }}>
                                {enviando === lid ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} {tipo === 'atraso' ? 'Cobrar' : 'Lembrar'}
                              </button>
                            ) : r.financeiro_status === 'atrasado' && (
                              <a href={`https://wa.me/55${waDigits(tel)}?text=${encodeURIComponent(msgCobranca(s(r.lead_nome) || s(r.responsavel), meses))}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 h-7 rounded-lg text-white" style={{ background: '#25D366' }}>
                                <MessageCircle size={12} /> Enviar cobrança
                              </a>
                            )}
                            {ult && (
                              <span className="text-[10px] text-gray-500 whitespace-nowrap" title={`Último envio: ${ult.tipo} por ${ult.canal}`}>
                                {ult.ok ? '✓' : '✗'} {ult.tipo} {ult.data.slice(8, 10)}/{ult.data.slice(5, 7)}
                              </span>
                            )}
                          </div>
                        )
                      })()}
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

// Célula "Cobrança Asaas": status da cobrança em aberto + link do boleto/PIX + sincronizar
const ASAAS_ST: Record<string, { label: string; color: string }> = {
  PENDING:          { label: 'Aguardando', color: '#fbbf24' },
  OVERDUE:          { label: 'Vencida',    color: '#f87171' },
  RECEIVED:         { label: 'Paga',       color: '#22c55e' },
  CONFIRMED:        { label: 'Paga',       color: '#22c55e' },
  RECEIVED_IN_CASH: { label: 'Paga',       color: '#22c55e' },
}
function AsaasCell({ item, configurado, syncing, onSync, pixAuto }: { item?: AsaasResumoItem; configurado: boolean; syncing: boolean; onSync: () => void; pixAuto?: string }) {
  if (!configurado) return <span className="text-gray-600 text-xs">—</span>
  const st = item ? (ASAAS_ST[item.status] ?? { label: item.status, color: '#9ca3af' }) : null
  return (
    <div className="flex items-center gap-2">
      {pixAuto === 'ACTIVE' && (
        <span className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-bold" style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e' }} title="Débito automático via Pix ativo">
          <Zap size={11} /> Pix Automático
        </span>
      )}
      {pixAuto === 'CREATED' && (
        <span className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-bold" style={{ background: 'rgba(167,139,250,0.14)', color: '#a78bfa' }} title="QR do Pix Automático gerado — aguardando o cliente autorizar">
          <Zap size={11} /> Pix Auto pendente
        </span>
      )}
      {st ? (
        <span className="inline-flex items-center px-2 h-6 rounded-md text-[11px] font-bold" style={{ background: `${st.color}22`, color: st.color }}>
          {st.label}{item?.vencimento ? ` · ${item.vencimento.slice(8, 10)}/${item.vencimento.slice(5, 7)}` : ''}
        </span>
      ) : (
        <span className="text-gray-500 text-[11px]">sem cobrança</span>
      )}
      {item?.invoice_url && (
        <a href={item.invoice_url} target="_blank" rel="noopener noreferrer" title="Abrir boleto / PIX"
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 h-6 rounded-md text-white" style={{ background: 'rgba(124,111,255,0.9)' }}>
          <ExternalLink size={11} /> Boleto/PIX
        </a>
      )}
      <button onClick={onSync} disabled={syncing} title={item ? 'Atualizar cobranças do Asaas' : 'Cadastrar no Asaas (cliente + assinatura mensal)'}
        className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-white disabled:opacity-50"
        style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
        <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
      </button>
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
  const [enviosLead, setEnviosLead] = useState<EnvioRow[]>([])
  const [pixAuto, setPixAuto] = useState<PixAutoRow | null>(null)
  const [pixBusy, setPixBusy] = useState(false)
  const [envBusy, setEnvBusy] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
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
    Promise.all([listPagamentos(leadId), listEventos(leadId), listEnviosCobranca(leadId).catch(() => [] as EnvioRow[]), getPixAutomatico(leadId).catch(() => null)])
      .then(([p, e, env, pa]) => { setPagamentos(p); setEventos(e); setEnviosLead(env); setPixAuto(pa) })
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
  // Régua / Pix Automático (dentro do modal)
  async function enviarTipo(t: TipoEnvioCobranca) {
    setEnvBusy(t)
    try {
      const r = await enviarCobrancaAgora(leadId, t)
      const falha = r.envios.filter(x => !x.ok)
      if (falha.length) alert('Falha no envio:\n' + falha.map(f => `• ${f.canal}: ${f.erro}`).join('\n'))
      load(); onChanged()
    } catch (e) { alert('Envio: ' + ((e as Error).message || 'erro')) }
    finally { setEnvBusy(null) }
  }
  async function gerarQr() {
    setPixBusy(true)
    try { setPixAuto(await gerarPixAutomatico(leadId)); onChanged() }
    catch (e) { alert('Pix Automático: ' + ((e as Error).message || 'erro')) }
    finally { setPixBusy(false) }
  }
  async function cancelarPa() {
    if (!confirm('Cancelar a autorização de Pix Automático deste cliente? Ele volta para boleto/PIX normal.')) return
    setPixBusy(true)
    try { await cancelarPixAutomatico(leadId); setPixAuto(null); onChanged() }
    catch (e) { alert('Pix Automático: ' + ((e as Error).message || 'erro')) }
    finally { setPixBusy(false) }
  }
  function copiarPix() {
    if (!pixAuto?.payload) return
    navigator.clipboard?.writeText(pixAuto.payload).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) })
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
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[color:var(--sys-accent)]" /></div>
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
                        <Icon size={12} className="text-[color:var(--sys-accent)]" /> <b className="text-gray-300">{T?.label ?? ev.tipo}</b>
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
                      style={{ background: tipo === t.id ? 'color-mix(in srgb, var(--sys-accent) 15%, transparent)' : 'var(--sys-surface-3)', border: `1px solid ${tipo === t.id ? 'color-mix(in srgb, var(--sys-accent) 40%, transparent)' : 'var(--sys-border-2)'}`, color: tipo === t.id ? 'var(--sys-accent)' : '#9ca3af' }}>
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
                <button onClick={salvarEvento} disabled={saving} className="w-full h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
                  <Plus size={13} /> Registrar acionamento
                </button>
              </div>
            </div>

            {/* Régua: enviar agora + histórico de envios */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Enviar cobrança (WhatsApp da Nauta)</p>
              <div className="flex gap-1.5 mb-3">
                {([['lembrete', 'Lembrete'], ['vencimento', 'Vence hoje'], ['atraso', 'Em atraso']] as [TipoEnvioCobranca, string][]).map(([t, label]) => (
                  <button key={t} onClick={() => enviarTipo(t)} disabled={envBusy !== null}
                    className="flex-1 h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                    style={{ background: t === 'atraso' ? '#ef4444' : '#25D366' }}>
                    {envBusy === t ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} {label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {enviosLead.length === 0 ? <p className="text-gray-600 text-xs">Nenhum envio ainda. A régua automática manda 3 dias antes, no dia e 3 dias após o vencimento.</p> : enviosLead.map(ev => (
                  <div key={ev.id} className="p-2 rounded-lg text-xs" style={{ background: 'var(--sys-surface-3)' }} title={ev.mensagem}>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span style={{ color: ev.ok ? '#22c55e' : '#f87171' }}>{ev.ok ? '✓' : '✗'}</span>
                      <b className="text-gray-300 capitalize">{ev.tipo}</b> · {ev.canal} · {ev.destino}
                      <span className="ml-auto">{format(new Date(ev.criado_em), 'dd/MM HH:mm', { locale: ptBR })}</span>
                    </div>
                    {ev.erro && <p className="text-[11px] text-[#f87171] mt-0.5">{ev.erro}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Pix Automático */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5"><Zap size={12} className="text-[#22c55e]" /> Pix Automático</p>
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                {pixAuto ? (
                  <>
                    <p className="text-xs text-gray-300">
                      Status: <b style={{ color: pixAuto.status === 'ACTIVE' ? '#22c55e' : pixAuto.status === 'CREATED' ? '#a78bfa' : '#f87171' }}>{pixAuto.status === 'ACTIVE' ? 'ATIVO (débito automático)' : pixAuto.status === 'CREATED' ? 'QR gerado — aguardando o cliente pagar/autorizar' : pixAuto.status}</b>
                      {pixAuto.start_date && <> · débitos a partir de {dataBR(pixAuto.start_date)}</>}
                    </p>
                    {pixAuto.encoded_image && pixAuto.status === 'CREATED' && (
                      <img src={`data:image/png;base64,${pixAuto.encoded_image}`} alt="QR Pix Automático" className="w-36 h-36 rounded-lg bg-white p-1 mx-auto" />
                    )}
                    {pixAuto.payload && pixAuto.status === 'CREATED' && (
                      <button onClick={copiarPix} className="w-full h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5" style={{ background: 'rgba(124,111,255,0.9)' }}>
                        <Copy size={12} /> {copiado ? 'Copiado!' : 'Copiar PIX copia e cola (1º pagamento + autorização)'}
                      </button>
                    )}
                    {['CREATED', 'ACTIVE'].includes(pixAuto.status) && (
                      <button onClick={cancelarPa} disabled={pixBusy} className="w-full h-8 rounded-lg text-[11px] font-semibold disabled:opacity-60" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                        Cancelar autorização
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">O PIX das mensagens de cobrança já é o QR do Pix Automático: o cliente paga o mês em aberto e autoriza os débitos mensais. Aqui você pode gerar/ver o QR para mandar na mão.</p>
                    <button onClick={gerarQr} disabled={pixBusy} className="w-full h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      {pixBusy ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Gerar / ver QR do Pix Automático
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
