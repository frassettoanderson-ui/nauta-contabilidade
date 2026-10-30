'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, Link2, Plus, Copy, Check, Eye, Trash2, X } from 'lucide-react'
import { CLI_FIELDS, EMP_FIELDS, SOCIO_FIELDS, type Field } from '@/lib/cadastro'

type Row = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')
const dataHora = (v: unknown) => v ? format(new Date(s(v)), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'

function statusDe(r: Row) {
  if (r.preenchido_em) return { label: 'Preenchido', color: '#22c55e' }
  if (r.aberto_em) return { label: 'Aberto, não enviado', color: '#fbbf24' }
  return { label: 'Não aberto', color: '#9ca3af' }
}

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'preenchido', label: 'Preenchidos' },
  { key: 'aberto', label: 'Abertos, não enviados' },
  { key: 'nao_aberto', label: 'Não abertos' },
]

export default function LinksCadastroPage() {
  const [links, setLinks] = useState<Row[] | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [novo, setNovo] = useState(false)
  const [ver, setVer] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/cadastro-links').then(r => r.ok ? r.json() : []).then(setLinks).catch(() => setLinks([]))
  }, [])
  useEffect(() => { load() }, [load])

  const lista = useMemo(() => (links ?? []).filter(r => {
    if (filtro === 'preenchido' && !r.preenchido_em) return false
    if (filtro === 'aberto' && (!r.aberto_em || r.preenchido_em)) return false
    if (filtro === 'nao_aberto' && r.aberto_em) return false
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return [r.destinatario, r.observacao, r.emp_nome, r.cli_nome, r.criado_por].some(v => s(v).toLowerCase().includes(q))
  }), [links, busca, filtro])

  const n = (k: string) => (links ?? []).filter(r => k === 'preenchido' ? !!r.preenchido_em : k === 'aberto' ? (!!r.aberto_em && !r.preenchido_em) : !r.aberto_em).length

  async function copiar(r: Row) {
    try { await navigator.clipboard.writeText(s(r.url)); setCopiado(s(r.id)); setTimeout(() => setCopiado(null), 1500) }
    catch { prompt('Copie o link:', s(r.url)) }
  }
  async function excluir(r: Row) {
    if (!confirm(`Excluir o link de ${s(r.destinatario)}?${r.preenchido_em ? '\n\nOs dados preenchidos também serão apagados.' : ''}\n\nO link deixa de funcionar.`)) return
    await fetch(`/api/cadastro-links/${s(r.id)}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><Link2 size={22} className="text-[color:var(--sys-accent)]" /> Links de cadastro</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {links === null ? 'Carregando...' : `${links.length} link(s) · ${n('preenchido')} preenchido(s) · ${n('aberto')} aberto(s) sem envio · ${n('nao_aberto')} não aberto(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
              className="h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none w-56" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
          </div>
          <select value={filtro} onChange={e => setFiltro(e.target.value)}
            className="h-10 px-3 rounded-xl text-sm text-white outline-none cursor-pointer" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
            {FILTROS.map(f => <option key={f.key} value={f.key} style={{ background: '#13111f' }}>{f.label}</option>)}
          </select>
          <button onClick={() => setNovo(true)} className="h-10 px-4 rounded-xl text-sm font-bold text-white flex items-center gap-2" style={{ background: '#F47920' }}>
            <Plus size={16} /> Gerar link
          </button>
        </div>
      </div>

      {links === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : lista.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">{links.length ? 'Nenhum link neste filtro.' : 'Nenhum link gerado ainda. Clique em "Gerar link".'}</div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
                {['Para quem', 'Empresa preenchida', 'Gerado', 'Aberto', 'Preenchido', 'Situação', ''].map(h =>
                  <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-3 py-3 whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {lista.map(r => {
                const st = statusDe(r)
                const id = s(r.id)
                return (
                  <tr key={id} className="hover:bg-white/[0.03]" style={{ borderBottom: '1px solid var(--sys-surface-4)' }}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-white">{s(r.destinatario)}</p>
                      {!!r.observacao && <p className="text-[11px] text-gray-500 mt-0.5">{s(r.observacao)}</p>}
                    </td>
                    <td className="px-3 py-3 text-gray-300">{s(r.emp_nome) || s(r.cli_nome) || '—'}</td>
                    <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{dataHora(r.criado_em)}{r.criado_por ? <p className="text-[11px] text-gray-500">por {s(r.criado_por)}</p> : null}</td>
                    <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{dataHora(r.aberto_em)}</td>
                    <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{dataHora(r.preenchido_em)}
                      {r.atualizado_em && r.preenchido_em && s(r.atualizado_em).slice(0, 16) !== s(r.preenchido_em).slice(0, 16) ? <p className="text-[11px] text-gray-500">alterado {dataHora(r.atualizado_em)}</p> : null}
                    </td>
                    <td className="px-3 py-3"><span className="text-[11px] font-bold whitespace-nowrap" style={{ color: st.color }}>{st.label}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => copiar(r)} title="Copiar link" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 h-7 rounded-lg" style={{ background: '#69a8d9', color: '#fff' }}>
                          {copiado === id ? <Check size={12} /> : <Copy size={12} />} {copiado === id ? 'Copiado' : 'Copiar link'}
                        </button>
                        <button onClick={() => setVer(id)} disabled={!r.preenchido_em} title="Ver os dados preenchidos" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 h-7 rounded-lg disabled:opacity-30" style={{ background: '#22c55e', color: '#fff' }}>
                          <Eye size={12} /> Ver dados
                        </button>
                        <button onClick={() => excluir(r)} title="Excluir link" className="inline-flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {novo && <NovoLinkModal onClose={() => setNovo(false)} onCriado={load} />}
      {ver && <DadosModal id={ver} onClose={() => setVer(null)} />}
    </div>
  )
}

function NovoLinkModal({ onClose, onCriado }: { onClose: () => void; onCriado: () => void }) {
  const [destinatario, setDestinatario] = useState('')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [url, setUrl] = useState('')
  const [copiado, setCopiado] = useState(false)

  async function gerar() {
    if (!destinatario.trim()) { alert('Informe para quem é o link.'); return }
    setSalvando(true)
    try {
      const r = await fetch('/api/cadastro-links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destinatario, observacao: obs }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'erro')
      setUrl(d.url); onCriado()
    } catch (e) { alert('Gerar link: ' + (e as Error).message) }
    finally { setSalvando(false) }
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1500) } catch { prompt('Copie o link:', url) }
  }
  const campo = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6 text-center" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        <h2 className="text-lg font-black text-white">Gerar link de cadastro</h2>
        <p className="text-sm text-gray-500 mt-1">Mesma ficha do cliente novo. Os dados ficam só aqui no relatório.</p>
        {!url ? (
          <>
            <div className="text-left mt-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Para quem é o link</label>
                <input value={destinatario} onChange={e => setDestinatario(e.target.value)} autoFocus placeholder="Nome da pessoa ou empresa"
                  className="w-full h-11 px-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none" style={campo} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Observação (opcional)</label>
                <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex.: indicação do João"
                  className="w-full h-11 px-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none" style={campo} />
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={onClose} className="h-10 px-5 rounded-xl text-sm font-bold" style={{ background: '#ffb752', color: '#fff' }}>Cancelar</button>
              <button onClick={gerar} disabled={salvando} className="h-10 px-5 rounded-xl text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50" style={{ background: '#F47920', color: '#fff' }}>
                {salvando ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />} Gerar link
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-5 rounded-xl p-3 text-sm text-white break-all" style={campo}>{url}</div>
            <div className="flex justify-center gap-2 mt-5">
              <button onClick={copiar} className="h-10 px-5 rounded-xl text-sm font-bold inline-flex items-center gap-2" style={{ background: '#69a8d9', color: '#fff' }}>
                {copiado ? <Check size={15} /> : <Copy size={15} />} {copiado ? 'Copiado' : 'Copiar link'}
              </button>
              <button onClick={onClose} className="h-10 px-5 rounded-xl text-sm font-bold" style={{ background: '#F47920', color: '#fff' }}>Fechar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Bloco({ titulo, campos, dados, extra }: { titulo: string; campos: Field[]; dados: Row; extra?: [string, unknown][] }) {
  const itens: [string, unknown][] = [...campos.map(([k, label]) => [label, dados[k]] as [string, unknown]), ...(extra ?? [])]
  if (!itens.some(([, v]) => v !== undefined && v !== null && s(v) !== '')) return null
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
      <p className="text-[11px] font-black uppercase tracking-wider text-[color:var(--sys-accent)] mb-3">{titulo}</p>
      <div className="grid sm:grid-cols-2 gap-x-5 gap-y-2">
        {itens.map(([label, v]) => (
          <div key={label}>
            <p className="text-[11px] text-gray-500">{label}</p>
            <p className="text-sm text-white break-words">{typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : (s(v) || '—')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DadosModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [l, setL] = useState<Row | null>(null)
  useEffect(() => { fetch(`/api/cadastro-links/${id}`).then(r => r.json()).then(setL).catch(() => setL({})) }, [id])
  const d = (l?.dados ?? {}) as Row
  const socios = ((d.socios as Row[]) ?? []).filter(x => x && Object.values(x).some(v => s(v) !== ''))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl p-6" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        {!l ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[color:var(--sys-accent)]" /></div> : (
          <>
            <div className="text-center mb-5">
              <h2 className="text-lg font-black text-white">{s(d.emp_nome) || s(d.cli_nome_completo) || s(l.destinatario)}</h2>
              <p className="text-sm text-gray-500 mt-1">Link de {s(l.destinatario)} · preenchido {dataHora(l.preenchido_em)}</p>
            </div>
            <Bloco titulo="Dados do responsável" campos={CLI_FIELDS} dados={d} />
            <Bloco titulo="Dados da empresa" campos={EMP_FIELDS} dados={d} extra={[['Usa gás GLP?', d.emp_usa_glp]]} />
            {socios.map((so, i) => <Bloco key={i} titulo={`Sócio ${i + 1}`} campos={l.senha_gov !== undefined ? SOCIO_FIELDS : SOCIO_FIELDS.filter(f => f[0] !== 'senha_gov')} dados={so} />)}
            {l.senha_gov !== undefined && <Bloco titulo="Acesso gov.br" campos={[]} dados={{}} extra={[['Senha do gov.br', l.senha_gov]]} />}
          </>
        )}
      </div>
    </div>
  )
}
