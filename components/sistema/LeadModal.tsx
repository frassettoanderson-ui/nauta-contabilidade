'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  X, Loader2, MessageCircle, Mail, Trash2, Send, Bell, Check, Plus, CalendarClock,
  Pencil, Save, FileText, ClipboardCheck,
} from 'lucide-react'
import {
  getLeadDetail, updateLead, deleteLead, addAtividade, addLembrete, toggleLembrete, deleteLembrete,
  getClienteByLead, listUsuarios, type LeadDetail, type UsuarioRow,
} from '@/lib/api'
import { ETAPAS, INTERESSES } from '@/lib/crm-config'
import { isCadastroCompleto } from '@/lib/cadastro'
import ClassBar from './ClassBar'

const todayStr = () => new Date().toISOString().slice(0, 10)
const dOnly = (s: string) => s.slice(0, 10)
const FS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

export default function LeadModal({ leadId, onClose, onChanged, mode = 'view' }: { leadId: string; onClose: () => void; onChanged: () => void; mode?: 'view' | 'edit' | 'lembrete' }) {
  const [d, setD] = useState<LeadDetail | null>(null)
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState({ nome: '', whatsapp: '', email: '', interesse: '' })
  const [novaAtiv, setNovaAtiv] = useState('')
  const [lembDesc, setLembDesc] = useState('')
  const [lembData, setLembData] = useState(todayStr())
  const [lembHora, setLembHora] = useState('09:00')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as unknown as { role?: string })?.role
  const podeAtribuir = role === 'admin' || role === 'gerente'
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  useEffect(() => { if (podeAtribuir) listUsuarios().then(setUsuarios).catch(() => {}) }, [podeAtribuir])

  async function setResponsavel(id: string) {
    if (!d) return
    const u = usuarios.find(x => x.id === id)
    setD({ ...(d as LeadDetail & { responsavel_id?: string; responsavel_nome?: string }), responsavel_id: id || undefined, responsavel_nome: u?.username })
    await updateLead(leadId, { responsavel_id: id || null, responsavel_nome: u?.username || null })
    onChanged()
  }

  const load = useCallback(() => {
    getLeadDetail(leadId).then(d => {
      setD(d)
      if (mode === 'edit') { setEdit({ nome: d.nome, whatsapp: d.whatsapp || '', email: d.email || '', interesse: d.interesse || '' }); setEditing(true) }
    })
    getClienteByLead(leadId).then(c => setCadastroCompleto(isCadastroCompleto(c))).catch(() => setCadastroCompleto(false))
  }, [leadId, mode])
  useEffect(() => { load() }, [load])

  function startEdit() {
    if (!d) return
    setEdit({ nome: d.nome, whatsapp: d.whatsapp || '', email: d.email || '', interesse: d.interesse || '' })
    setEditing(true)
  }
  async function saveEdit() {
    setBusy(true)
    await updateLead(leadId, edit); await load(); onChanged(); setEditing(false); setBusy(false)
  }

  async function setEtapa(etapa: string) {
    if (!d) return
    if (etapa === 'fechado' && !(d as unknown as { valor_honorario?: unknown }).valor_honorario) {
      alert('Para mover para Fechado, use o botão "Fechado" no funil (em "Em negociação") e informe os valores de honorário/abertura.')
      return
    }
    setD({ ...d, etapa }); await updateLead(leadId, { etapa }); onChanged()
  }
  async function setClass(classificacao: number) {
    if (!d) return
    setD({ ...d, classificacao }); await updateLead(leadId, { classificacao }); onChanged()
  }
  async function addAtiv() {
    if (!novaAtiv.trim()) return
    setBusy(true); await addAtividade(leadId, novaAtiv); setNovaAtiv(''); await load(); setBusy(false)
  }
  async function addLemb() {
    if (!lembDesc.trim() || !lembData) return
    setBusy(true); await addLembrete(leadId, lembDesc, lembData, lembHora); setLembDesc(''); setLembData(todayStr()); setLembHora('09:00'); await load(); onChanged(); setBusy(false)
  }
  async function toggleLemb(id: string, c: boolean) {
    await toggleLembrete(leadId, id, c); await load(); onChanged()
  }
  async function delLemb(id: string) {
    await deleteLembrete(leadId, id); await load(); onChanged()
  }
  async function remover() {
    if (!confirm('Excluir este lead? Esta ação não pode ser desfeita.')) return
    await deleteLead(leadId); onChanged(); onClose()
  }

  const waLink = (tel: string) => `https://wa.me/55${(tel || '').replace(/\D/g, '')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,4,20,0.8)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#0f0e1a', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        {!d ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="min-w-0 flex-1 pr-3">
                {editing ? (
                  <input value={edit.nome} onChange={e => setEdit(s => ({ ...s, nome: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg text-lg font-black text-white outline-none" style={FS} />
                ) : (
                  <h2 className="text-xl font-black text-white truncate">{d.nome}</h2>
                )}
                {!editing && <p className="text-gray-500 text-xs mt-0.5">{d.interesse || 'Sem interesse definido'}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!editing && (() => {
                  const piscando = d.etapa === 'fechado' && !cadastroCompleto
                  return (
                    <button onClick={() => router.push(`/sistema/clientes/cadastrar?lead=${leadId}`)} title="Cadastro completo"
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${piscando ? 'animate-pulse' : 'hover:bg-white/5'}`}
                      style={piscando ? { background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' } : { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <ClipboardCheck size={19} />
                    </button>
                  )
                })()}
                {!editing && <button onClick={startEdit} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-[#0BBCD4] hover:bg-white/5" title="Editar"><Pencil size={18} /></button>}
                <button onClick={remover} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10" title="Excluir"><Trash2 size={18} /></button>
                <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
            </div>

            {/* Modo edição */}
            {editing ? (
              <div className="space-y-3 mb-5">
                <input value={edit.whatsapp} onChange={e => setEdit(s => ({ ...s, whatsapp: e.target.value }))} placeholder="WhatsApp"
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none" style={FS} />
                <input value={edit.email} onChange={e => setEdit(s => ({ ...s, email: e.target.value }))} placeholder="E-mail"
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none" style={FS} />
                <select value={edit.interesse} onChange={e => setEdit(s => ({ ...s, interesse: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none" style={{ ...FS, colorScheme: 'dark' }}>
                  <option value="">Selecione o interesse</option>
                  {INTERESSES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={busy} className="flex-1 h-10 rounded-xl font-bold text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Salvar</>}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 h-10 rounded-xl text-sm text-gray-400" style={FS}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                {/* Etapa */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {ETAPAS.map(et => (
                    <button key={et.id} onClick={() => setEtapa(et.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: d.etapa === et.id ? et.color : 'rgba(255,255,255,0.05)', color: d.etapa === et.id ? '#fff' : '#9ca3af' }}>
                      {et.label}
                    </button>
                  ))}
                </div>

                {/* Contato */}
                <div className="flex gap-2 mb-4">
                  <a href={waLink(d.whatsapp)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white" style={{ background: '#25D366' }}>
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                  <a href={`mailto:${d.email}`}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white" style={FS}>
                    <Mail size={15} /> E-mail
                  </a>
                </div>

                <div className="rounded-xl p-4 mb-4 space-y-1.5 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-gray-400"><span className="text-gray-600">WhatsApp:</span> {d.whatsapp || '—'}</p>
                  <p className="text-gray-400"><span className="text-gray-600">E-mail:</span> {d.email || '—'}</p>
                  <p className="text-gray-400"><span className="text-gray-600">Criado em:</span> {format(new Date(d.criado_em), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>

                {/* Responsável */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 mb-1.5">Responsável</p>
                  {podeAtribuir ? (
                    <select value={(d as unknown as { responsavel_id?: string }).responsavel_id || ''} onChange={e => setResponsavel(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl text-sm text-white outline-none" style={{ ...FS, colorScheme: 'dark' }}>
                      <option value="">Sem responsável</option>
                      {usuarios.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-300">{(d as unknown as { responsavel_nome?: string }).responsavel_nome || '—'}</p>
                  )}
                </div>

                {/* Classificação */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Nível de interesse</p>
                  <ClassBar value={d.classificacao} onChange={setClass} size="md" />
                </div>
              </>
            )}

            {!editing && (
              <>
                {/* Lembretes */}
                <div className="mb-5">
                  <p className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Bell size={15} className="text-[#0BBCD4]" /> Lembretes</p>
                  <div className="space-y-2 mb-3">
                    <input value={lembDesc} onChange={e => setLembDesc(e.target.value)} placeholder="Pendência..."
                      className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none" style={FS} />
                    <div className="flex gap-2">
                      <input type="date" value={lembData} onChange={e => setLembData(e.target.value)}
                        className="flex-1 h-10 px-2 rounded-lg text-xs text-white outline-none" style={{ ...FS, colorScheme: 'dark' }} />
                      <input type="time" value={lembHora} onChange={e => setLembHora(e.target.value)}
                        className="h-10 px-2 rounded-lg text-xs text-white outline-none" style={{ ...FS, colorScheme: 'dark' }} />
                      <button onClick={addLemb} disabled={busy} className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(11,188,212,0.15)', border: '1px solid rgba(11,188,212,0.25)' }}>
                        <Plus size={16} className="text-[#0BBCD4]" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {d.lembretes.length === 0 && <p className="text-gray-600 text-xs">Nenhum lembrete.</p>}
                    {d.lembretes.map(l => {
                      const venceu = !l.concluido && dOnly(l.data) <= todayStr()
                      return (
                        <div key={l.id} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: venceu ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${venceu ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                          <button onClick={() => toggleLemb(l.id, !l.concluido)} className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: l.concluido ? '#22c55e' : 'transparent', border: `1px solid ${l.concluido ? '#22c55e' : 'rgba(255,255,255,0.2)'}` }}>
                            {l.concluido && <Check size={12} className="text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${l.concluido ? 'text-gray-600 line-through' : 'text-gray-200'}`}>{l.descricao}</p>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: venceu ? '#f59e0b' : '#6b7280' }}>
                              <CalendarClock size={11} /> {format(new Date(dOnly(l.data) + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}{l.hora ? ` às ${String(l.hora).slice(0, 5)}` : ''}{venceu && ' · pendente'}
                            </p>
                          </div>
                          <button onClick={() => delLemb(l.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 shrink-0" title="Excluir lembrete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Atividades */}
                <div>
                  <p className="text-sm font-bold text-white mb-3">Registro de atividades</p>
                  <div className="flex gap-2 mb-3">
                    <textarea value={novaAtiv} onChange={e => setNovaAtiv(e.target.value)} rows={2} placeholder="O que foi tratado com o cliente..."
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none resize-none" style={FS} />
                    <button onClick={addAtiv} disabled={busy || !novaAtiv.trim()} className="w-10 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'rgba(11,188,212,0.15)', border: '1px solid rgba(11,188,212,0.25)' }}>
                      {busy ? <Loader2 size={15} className="animate-spin text-[#0BBCD4]" /> : <Send size={15} className="text-[#0BBCD4]" />}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {d.atividades.length === 0 && <p className="text-gray-600 text-xs">Nenhuma atividade registrada.</p>}
                    {d.atividades.map(a => (
                      <div key={a.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{a.descricao}</p>
                        <p className="text-[11px] text-gray-600 mt-1.5">{a.autor ? `${a.autor} · ` : ''}{format(new Date(a.criado_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gerar contrato (quando fechado) */}
                {d.etapa === 'fechado' && (
                  cadastroCompleto ? (
                    <button onClick={() => alert('Geração de contrato será habilitada em breve.')}
                      className="mt-5 w-full h-11 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      <FileText size={16} /> Gerar contrato
                    </button>
                  ) : (
                    <div className="mt-5">
                      <button disabled className="w-full h-11 rounded-xl font-bold text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <FileText size={16} /> Gerar contrato
                      </button>
                      <button onClick={() => router.push(`/sistema/clientes/cadastrar?lead=${leadId}`)}
                        className="w-full mt-2 text-xs font-bold text-red-400 animate-pulse">
                        Cadastro do cliente incompleto, clique aqui
                      </button>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
