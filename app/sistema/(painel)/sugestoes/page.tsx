'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Plus, X, Lightbulb, Check, Ban, RotateCcw, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { listSugestoes, addSugestao, resolverSugestao, deleteSugestao, type Sugestao, type StatusSugestao } from '@/lib/api'

// Cores dos botões = padrão Obrigô (texto branco forçado inline: nas telas da Nauta .text-white vira escuro)
const COR = { marca: '#F47920', ok: '#88b87f', warn: '#ffb752', danger: '#d15b47' }
const AREAS = ['Onboarding', 'Dashboard', 'Empresas', 'Geração de Contrato', 'Comercial', 'Relatórios', 'Fiscal', 'Pessoal', 'Acessórias', 'Financeiro', 'Configurações', 'Usuários', 'Outro']
const ABAS: { id: StatusSugestao; label: string; icon: typeof Clock; cor: string }[] = [
  { id: 'pendente', label: 'Pendentes', icon: Clock, cor: COR.warn },
  { id: 'concluida', label: 'Concluídas', icon: CheckCircle2, cor: COR.ok },
  { id: 'nao_aprovada', label: 'Não aprovadas', icon: XCircle, cor: COR.danger },
]
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const FIELD = 'w-full px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none'
const dataBR = (iso: string | null) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : ''

export default function SugestoesPage() {
  const { data: session } = useSession()
  const su = session?.user as { id?: string; role?: string } | undefined
  const admin = su?.role === 'admin'
  const [rows, setRows] = useState<Sugestao[] | null>(null)
  const [aba, setAba] = useState<StatusSugestao>('pendente')
  const [nova, setNova] = useState(false)
  const [decidir, setDecidir] = useState<{ s: Sugestao; status: StatusSugestao } | null>(null)

  const load = useCallback(() => { listSugestoes().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])

  const conta = (st: StatusSugestao) => (rows ?? []).filter(r => r.status === st).length
  const lista = (rows ?? []).filter(r => r.status === aba)

  async function reabrir(s: Sugestao) {
    if (!confirm(`Voltar "${s.titulo}" para Pendentes?`)) return
    try { await resolverSugestao(s.id, 'pendente'); load() } catch (e) { alert((e as Error).message) }
  }
  async function excluir(s: Sugestao) {
    if (!confirm(`Excluir a sugestão "${s.titulo}"?`)) return
    try { await deleteSugestao(s.id); load() } catch (e) { alert((e as Error).message) }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
            <Lightbulb size={22} style={{ color: COR.marca }} /> Sugestões
          </h1>
          <p className="text-gray-500 text-sm">Peça aqui as alterações que você precisa no sistema. Cada pedido vira uma solicitação.</p>
        </div>
        <button onClick={() => setNova(true)} className="h-10 px-4 rounded-lg text-sm font-bold inline-flex items-center gap-2" style={{ background: COR.marca, color: '#fff' }}>
          <Plus size={16} /> Nova sugestão
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {ABAS.map(t => {
          const ativo = aba === t.id
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setAba(t.id)}
              className="h-10 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition"
              style={{ background: ativo ? t.cor : 'var(--sys-surface)', color: ativo ? '#fff' : 'var(--sys-text-2, #64748b)', border: `1px solid ${ativo ? t.cor : 'var(--sys-border)'}` }}>
              <Icon size={15} /> {t.label}
              <span className="min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center"
                style={{ background: ativo ? 'rgba(255,255,255,.25)' : 'var(--sys-surface-3)', color: ativo ? '#fff' : 'inherit' }}>{rows ? conta(t.id) : '·'}</span>
            </button>
          )
        })}
      </div>

      {rows === null ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl py-14 px-6 text-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <Lightbulb size={30} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 text-sm">
            {aba === 'pendente' ? 'Nenhuma sugestão pendente.' : aba === 'concluida' ? 'Nenhuma sugestão concluída ainda.' : 'Nenhuma sugestão recusada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(s => {
            const minha = !!su?.id && s.autor_id === su.id
            return (
              <div key={s.id} className="rounded-2xl p-5" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-[15px]">{s.titulo}</h3>
                      {s.area && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, #F47920 14%, transparent)', color: '#c25e12' }}>{s.area}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Pedido por <b className="text-gray-400">{s.autor_nome || '—'}</b> em {dataBR(s.criado_em)}</p>
                    <p className="text-sm text-gray-300 whitespace-pre-line break-words">{s.descricao}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {admin && s.status === 'pendente' && <>
                      <button onClick={() => setDecidir({ s, status: 'concluida' })} className="h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5" style={{ background: COR.ok, color: '#fff' }}>
                        <Check size={14} /> Concluir
                      </button>
                      <button onClick={() => setDecidir({ s, status: 'nao_aprovada' })} className="h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5" style={{ background: COR.danger, color: '#fff' }}>
                        <Ban size={14} /> Não aprovar
                      </button>
                    </>}
                    {admin && s.status !== 'pendente' && (
                      <button onClick={() => reabrir(s)} className="h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5" style={{ background: COR.warn, color: '#fff' }}>
                        <RotateCcw size={14} /> Reabrir
                      </button>
                    )}
                    {s.status === 'pendente' && (minha || admin) && (
                      <button onClick={() => excluir(s)} title="Excluir sugestão" className="h-9 w-9 rounded-lg inline-flex items-center justify-center" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)', color: COR.danger }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {s.status !== 'pendente' && (
                  <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: `color-mix(in srgb, ${s.status === 'concluida' ? COR.ok : COR.danger} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${s.status === 'concluida' ? COR.ok : COR.danger} 35%, transparent)` }}>
                    <p className="text-xs font-semibold" style={{ color: s.status === 'concluida' ? '#4d7f45' : '#a8402f' }}>
                      {s.status === 'concluida' ? 'Concluída' : 'Não aprovada'} em {dataBR(s.resolvido_em)}{s.resolvido_por ? ` por ${s.resolvido_por}` : ''}
                    </p>
                    {s.resposta && <p className="text-gray-300 mt-1 whitespace-pre-line break-words">{s.resposta}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {nova && <NovaModal onClose={() => setNova(false)} onSaved={() => { setNova(false); setAba('pendente'); load() }} />}
      {decidir && <DecidirModal s={decidir.s} status={decidir.status} onClose={() => setDecidir(null)} onSaved={() => { setDecidir(null); load() }} />}
    </div>
  )
}

function NovaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [area, setArea] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)

  async function salvar() {
    if (!titulo.trim()) { alert('Informe um título para a sugestão.'); return }
    if (!descricao.trim()) { alert('Descreva a alteração que você precisa.'); return }
    setSaving(true)
    try { await addSugestao({ titulo, area: area || undefined, descricao }); onSaved() }
    catch (e) { alert((e as Error).message); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'color-mix(in srgb, #F47920 15%, transparent)' }}>
            <Lightbulb size={24} style={{ color: COR.marca }} />
          </div>
          <h2 className="text-lg font-black text-white">Nova sugestão</h2>
          <p className="text-sm text-gray-500 mt-1">Conte o que precisa mudar no sistema.</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120} placeholder="Ex.: Filtro por responsável na lista de empresas" className={`${FIELD} h-11`} style={FS} autoFocus />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Parte do sistema</label>
            <select value={area} onChange={e => setArea(e.target.value)} className={`${FIELD} h-11`} style={FS}>
              <option value="">Selecione…</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">O que precisa mudar</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={6} placeholder="Descreva a alteração, onde fica e por que ajuda no dia a dia." className={`${FIELD} py-2.5 resize-y`} style={FS} />
          </div>
          <button onClick={salvar} disabled={saving} className="w-full h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: COR.marca, color: '#fff' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Enviar sugestão
          </button>
        </div>
      </div>
    </div>
  )
}

function DecidirModal({ s, status, onClose, onSaved }: { s: Sugestao; status: StatusSugestao; onClose: () => void; onSaved: () => void }) {
  const concluir = status === 'concluida'
  const cor = concluir ? COR.ok : COR.danger
  const [resposta, setResposta] = useState('')
  const [saving, setSaving] = useState(false)

  async function salvar() {
    setSaving(true)
    try { await resolverSugestao(s.id, status, resposta || undefined); onSaved() }
    catch (e) { alert((e as Error).message); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `color-mix(in srgb, ${cor} 18%, transparent)` }}>
            {concluir ? <Check size={24} style={{ color: cor }} /> : <Ban size={24} style={{ color: cor }} />}
          </div>
          <h2 className="text-lg font-black text-white">{concluir ? 'Concluir sugestão' : 'Não aprovar sugestão'}</h2>
          <p className="text-sm text-gray-500 mt-1 break-words">{s.titulo}</p>
        </div>
        <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wide text-center">
          {concluir ? 'Comentário (opcional)' : 'Motivo (opcional)'}
        </label>
        <textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={4}
          placeholder={concluir ? 'Ex.: Já está no ar, o filtro fica no topo da lista.' : 'Ex.: Já existe em Relatórios > Empresas.'}
          className={`${FIELD} py-2.5 resize-y mb-4`} style={FS} />
        <button onClick={salvar} disabled={saving} className="w-full h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: cor, color: '#fff' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : concluir ? <Check size={15} /> : <Ban size={15} />} {concluir ? 'Confirmar conclusão' : 'Confirmar recusa'}
        </button>
      </div>
    </div>
  )
}
