'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, X, Send, Paperclip, Loader2, ArrowLeft, ChevronDown, XCircle, Zap } from 'lucide-react'
import {
  chatContatos, chatConversas, chatSite, chatAbrirDM, chatMensagens, chatEnviar, chatMarcarLido, chatEncerrar, chatNudge, uploadDoc,
  type ChatContato, type ChatConversa, type ChatConversaSite, type ChatMensagem,
} from '@/lib/api'
import { getSocket } from '@/lib/socket-client'

const ROLE: Record<string, string> = { admin: 'Admin', gerente: 'Gerente', comercial: 'Comercial', fiscal: 'Fiscal', pessoal: 'Pessoal', atendente: 'Atendente' }
const ehImagem = (s: string) => /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(s || '')

function Avatar({ foto, nome, online, size = 40, glow }: { foto?: string | null; nome: string; online?: boolean; size?: number; glow?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${glow ? 'chat-unread-glow' : ''}`} style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
        {foto
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={foto} alt={nome} className="w-full h-full object-cover" />
          : <span className="text-sm font-bold text-[#0BBCD4]">{(nome || '?').trim().charAt(0).toUpperCase()}</span>}
      </div>
      {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: 'var(--sys-modal)' }} />}
    </div>
  )
}

export default function ChatButton() {
  const { data: session } = useSession()
  const meId = (session?.user as unknown as { id?: string })?.id
  const meRole = (session?.user as unknown as { role?: string })?.role ?? ''
  const meNome = session?.user?.name ?? ''

  const [open, setOpen] = useState(false)
  const [contatos, setContatos] = useState<ChatContato[]>([])
  const [conversas, setConversas] = useState<ChatConversa[]>([])
  const [siteConvs, setSiteConvs] = useState<ChatConversaSite[]>([])
  const [ativo, setAtivo] = useState<{ conversaId: string; nome: string; foto: string | null; subtitulo: string; online: boolean; site?: boolean } | null>(null)
  const [secSite, setSecSite] = useState(true)
  const [secEquipe, setSecEquipe] = useState(true)
  const [shake, setShake] = useState(false)
  const [toasts, setToasts] = useState<{ id: string; tipo: string; conversaId: string; titulo: string; texto?: string; setor?: string }[]>([])

  function tocarNudge() {
    try { const a = new Audio('/atencao.wav'); a.volume = 0.6; a.play().catch(() => {}) } catch { /* ignora */ }
  }
  function tocarNotif() {
    try { const a = new Audio('/notificacao.mp3'); a.volume = 0.5; a.play().catch(() => {}) } catch { /* ignora */ }
  }
  function balancar() { setShake(true); setTimeout(() => setShake(false), 750) }

  function abrirToast(t: { id: string; tipo: string; conversaId: string; titulo: string; setor?: string }) {
    setOpen(true)
    if (t.tipo === 'site') setAtivo({ conversaId: t.conversaId, nome: t.titulo, foto: null, subtitulo: `Via site · ${ROLE[t.setor ?? ''] ?? t.setor ?? ''}`, online: false, site: true })
    else {
      const conv = conversas.find(c => c.id === t.conversaId)
      setAtivo(conv
        ? { conversaId: conv.id, nome: conv.outro_nome || t.titulo, foto: conv.outro_foto, subtitulo: (ROLE[conv.outro_role ?? ''] ?? conv.outro_role ?? '') + (conv.outro_online ? ' · online' : ''), online: !!conv.outro_online }
        : { conversaId: t.conversaId, nome: t.titulo, foto: null, subtitulo: '', online: false })
    }
    setToasts(ts => ts.filter(x => x.id !== t.id))
  }
  const [msgs, setMsgs] = useState<ChatMensagem[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  const equipeUnread = conversas.reduce((s, c) => s + Number(c.nao_lidas || 0), 0)
  const siteUnread = siteConvs.reduce((s, c) => s + Number(c.nao_lidas || 0), 0)
  const naoLidasTotal = equipeUnread + siteUnread

  // Presença + conversas (polling)
  const carregarListas = useCallback(() => {
    chatContatos().then(setContatos).catch(() => {})
    chatConversas().then(setConversas).catch(() => {})
    chatSite().then(setSiteConvs).catch(() => {})
  }, [])

  useEffect(() => {
    if (!meId) return
    carregarListas()
    const t = setInterval(carregarListas, 8000)
    return () => clearInterval(t)
  }, [meId, carregarListas])

  // Salas (pessoal + setor) + nudge + notificações
  useEffect(() => {
    if (!meId) return
    const socket = getSocket()
    const joinRooms = () => {
      socket.emit('join', `user:${meId}`)
      if (meRole) socket.emit('join', `setor:${meRole}`)
      if (meRole === 'admin' || meRole === 'gerente') socket.emit('join', 'setor:all')
    }
    joinRooms()
    socket.on('connect', joinRooms)

    const onNudge = (data: { conversaId: string; deNome: string }) => {
      setOpen(true)
      const conv = conversas.find(c => c.id === data.conversaId)
      if (conv) setAtivo({ conversaId: conv.id, nome: conv.outro_nome || data.deNome, foto: conv.outro_foto, subtitulo: (ROLE[conv.outro_role ?? ''] ?? conv.outro_role ?? '') + (conv.outro_online ? ' · online' : ''), online: !!conv.outro_online })
      else setAtivo(a => (a?.conversaId === data.conversaId ? a : { conversaId: data.conversaId, nome: data.deNome, foto: null, subtitulo: '', online: false }))
      balancar(); tocarNudge()
    }
    socket.on('nudge', onNudge)

    const onNotif = (data: { tipo: string; conversaId: string; titulo: string; texto?: string; setor?: string }) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(t => [...t.slice(-3), { id, ...data }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 7000)
      tocarNotif()
      carregarListas()
    }
    socket.on('notif', onNotif)

    return () => { socket.off('nudge', onNudge); socket.off('notif', onNotif); socket.off('connect', joinRooms) }
  }, [meId, meRole, conversas, carregarListas])

  async function chamarAtencao() {
    if (!ativo) return
    try { await chatNudge(ativo.conversaId); balancar(); tocarNudge() } catch { /* ignora */ }
  }

  // Mensagens da conversa ativa (Socket.IO em tempo real + fallback)
  useEffect(() => {
    if (!ativo) return
    let parar = false
    const load = () => chatMensagens(ativo.conversaId).then(m => { if (!parar) setMsgs(m) }).catch(() => {})
    load()
    chatMarcarLido(ativo.conversaId).catch(() => {})

    const socket = getSocket()
    socket.emit('join', ativo.conversaId)
    const onMsg = (data: { conversaId: string; msg: ChatMensagem }) => {
      if (data?.conversaId !== ativo.conversaId) return
      setMsgs(m => m.some(x => x.id === data.msg.id) ? m : [...m, data.msg])
      chatMarcarLido(ativo.conversaId).catch(() => {})
      carregarListas()
    }
    socket.on('nova-msg', onMsg)

    const t = setInterval(load, 12000) // fallback caso o socket caia
    return () => { parar = true; clearInterval(t); socket.emit('leave', ativo.conversaId); socket.off('nova-msg', onMsg) }
  }, [ativo, carregarListas])

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function abrirContato(c: ChatContato) {
    const { conversaId } = await chatAbrirDM(c.id)
    setAtivo({ conversaId, nome: c.nome_completo || c.username, foto: c.foto_url, subtitulo: (ROLE[c.role] ?? c.role) + (c.online ? ' · online' : ''), online: c.online })
  }

  function abrirSite(c: ChatConversaSite) {
    setAtivo({ conversaId: c.id, nome: c.visitante_nome || 'Visitante', foto: null, subtitulo: `Via site · ${ROLE[c.setor ?? ''] ?? c.setor ?? 'Atendimento'}`, online: false, site: true })
  }

  async function encerrarAtivo() {
    if (!ativo || !confirm('Encerrar este atendimento? Ele vai para o histórico.')) return
    try { await chatEncerrar(ativo.conversaId); setAtivo(null); carregarListas() }
    catch { alert('Erro ao encerrar.') }
  }

  async function enviar() {
    if (!ativo || (!texto.trim() && !enviando)) return
    const t = texto.trim(); if (!t) return
    setTexto('')
    const novo = await chatEnviar(ativo.conversaId, t).catch(() => null)
    if (novo) setMsgs(m => m.some(x => x.id === novo.id) ? m : [...m, novo])
    carregarListas()
  }

  async function enviarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !ativo) return
    setEnviando(true)
    try {
      const r = await uploadDoc(f)
      const novo = await chatEnviar(ativo.conversaId, '', r.url, f.name)
      setMsgs(m => m.some(x => x.id === novo.id) ? m : [...m, novo])
      carregarListas()
    } catch { alert('Erro ao enviar arquivo.') }
    finally { setEnviando(false); e.target.value = '' }
  }

  const unreadDe = (outroId: string | null) => conversas.find(c => c.outro_id === outroId)?.nao_lidas

  return (
    <>
      {/* Toasts de notificação */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 w-72">
          {toasts.map(t => (
            <button key={t.id} onClick={() => abrirToast(t)}
              className="animate-chat-in text-left rounded-xl p-3 flex items-start gap-3 shadow-2xl hover:brightness-110 transition-all"
              style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: t.tipo === 'site' ? 'rgba(124,111,255,0.15)' : 'rgba(11,188,212,0.15)' }}>
                <MessageCircle size={16} style={{ color: t.tipo === 'site' ? '#a99bff' : '#0BBCD4' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{t.tipo === 'site' ? 'Novo atendimento do site' : 'Nova conversa'}</p>
                <p className="text-[11px] text-gray-400 truncate">{t.titulo}{t.tipo === 'site' ? ` · ${ROLE[t.setor ?? ''] ?? t.setor ?? ''}` : (t.texto ? `: ${t.texto}` : '')}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-40">
        <button onClick={() => setOpen(o => !o)} aria-label="Chat"
          className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #0BBCD4, #6355e0)', boxShadow: '0 4px 16px rgba(11,188,212,0.35)' }}>
          {open ? <X size={20} className="text-white" /> : <MessageCircle size={20} className="text-white" />}
          {!open && naoLidasTotal > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{naoLidasTotal}</span>
          )}
        </button>
      </div>

      {open && (
        <div className={`fixed z-40 flex overflow-hidden shadow-2xl ${shake ? 'chat-shake' : 'animate-chat-in'}
            inset-0 lg:inset-auto lg:bottom-20 lg:right-5 lg:w-[680px] lg:h-[520px] lg:rounded-2xl`}
          style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>

          {/* Lista de contatos */}
          <div className={`w-full lg:w-64 flex flex-col border-r ${ativo ? 'hidden lg:flex' : 'flex'}`} style={{ borderColor: 'var(--sys-border)' }}>
            <div className="h-14 px-4 flex items-center justify-between shrink-0 border-b" style={{ borderColor: 'var(--sys-border)' }}>
              <span className="font-black text-white">Chat</span>
              <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Atendimentos do site */}
              {siteConvs.length > 0 && (
                <div className="border-b" style={{ borderColor: 'var(--sys-border)' }}>
                  <button onClick={() => setSecSite(v => !v)} className="w-full flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-left">
                    <ChevronDown size={13} className={`text-gray-500 transition-transform ${secSite ? '' : '-rotate-90'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Atendimentos do site</span>
                    {siteUnread > 0 && <span className="ml-auto min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{siteUnread}</span>}
                  </button>
                  <div className="chat-collapse" style={{ gridTemplateRows: secSite ? '1fr' : '0fr' }}><div>
                    {siteConvs.map(c => {
                      const nl = Number(c.nao_lidas || 0)
                      return (
                        <button key={c.id} onClick={() => abrirSite(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${nl > 0 ? 'chat-unread-glow' : ''}`} style={{ background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)' }}>
                            <MessageCircle size={16} className="text-[#a99bff]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{c.visitante_nome || 'Visitante'}</p>
                            <p className="text-[11px] text-gray-500 truncate">{ROLE[c.setor ?? ''] ?? c.setor} · {c.ultima_msg || 'novo'}</p>
                          </div>
                          {nl > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{nl}</span>}
                        </button>
                      )
                    })}
                  </div></div>
                </div>
              )}

              <button onClick={() => setSecEquipe(v => !v)} className="w-full flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-left">
                <ChevronDown size={13} className={`text-gray-500 transition-transform ${secEquipe ? '' : '-rotate-90'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Equipe</span>
                {equipeUnread > 0 && <span className="ml-auto min-w-4 h-4 px-1 rounded-full bg-[#0BBCD4] text-white text-[9px] font-bold flex items-center justify-center">{equipeUnread}</span>}
              </button>
              <div className="chat-collapse" style={{ gridTemplateRows: secEquipe ? '1fr' : '0fr' }}><div>
                {contatos.length === 0 && <p className="text-gray-600 text-xs text-center py-8">Nenhum contato.</p>}
                {contatos.map(c => {
                  const nl = Number(unreadDe(c.id) || 0)
                  return (
                    <button key={c.id} onClick={() => abrirContato(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left">
                      <Avatar foto={c.foto_url} nome={c.nome_completo || c.username} online={c.online} glow={nl > 0} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{c.nome_completo || c.username}</p>
                        <p className="text-[11px] text-gray-500">{ROLE[c.role] ?? c.role}{c.online ? ' · online' : ''}</p>
                      </div>
                      {nl > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-[#0BBCD4] text-white text-[10px] font-bold flex items-center justify-center">{nl}</span>}
                    </button>
                  )
                })}
              </div></div>
            </div>
          </div>

          {/* Conversa */}
          <div className={`flex-1 flex flex-col ${ativo ? 'flex' : 'hidden lg:flex'}`}>
            {!ativo ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Selecione um contato para conversar</div>
            ) : (
              <>
                <div className="h-14 px-3 flex items-center gap-3 shrink-0 border-b" style={{ borderColor: 'var(--sys-border)' }}>
                  <button onClick={() => setAtivo(null)} className="lg:hidden text-gray-400"><ArrowLeft size={20} /></button>
                  <Avatar foto={ativo.foto} nome={ativo.nome} online={ativo.online} size={34} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{ativo.nome}</p>
                    <p className="text-[11px] text-gray-500">{ativo.subtitulo}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {!ativo.site && (
                      <button onClick={chamarAtencao} title="Chamar atenção"
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 h-7 rounded-lg" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                        <Zap size={13} /> Chamar atenção
                      </button>
                    )}
                    {ativo.site && (
                      <button onClick={encerrarAtivo} title="Encerrar atendimento"
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 h-7 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                        <XCircle size={13} /> Encerrar
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white hidden lg:block p-1"><X size={18} /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: 'var(--sys-bg)' }}>
                  {msgs.map(m => {
                    const meu = m.autor_id === meId
                    return (
                      <div key={m.id} className={`flex animate-msg-in ${meu ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[78%] rounded-2xl px-3 py-2" style={{ background: meu ? 'linear-gradient(135deg, #0BBCD4, #0999ae)' : 'var(--sys-surface-3)' }}>
                          {m.arquivo_url && (ehImagem(m.arquivo_nome || m.arquivo_url)
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer"><img src={m.arquivo_url} alt={m.arquivo_nome || ''} className="rounded-lg max-h-48 mb-1" /></a>
                            : <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm underline mb-1" style={{ color: meu ? '#fff' : '#0BBCD4' }}><Paperclip size={13} /> {m.arquivo_nome || 'arquivo'}</a>)}
                          {m.texto && <p className={`text-sm whitespace-pre-wrap break-words ${meu ? 'text-white' : 'text-gray-200'}`}>{m.texto}</p>}
                          <p className={`text-[10px] mt-0.5 ${meu ? 'text-white/60' : 'text-gray-500'}`}>{new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={fimRef} />
                </div>

                <div className="p-2.5 flex items-center gap-2 shrink-0 border-t" style={{ borderColor: 'var(--sys-border)' }}>
                  <label className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-gray-400 hover:text-white" style={{ background: 'var(--sys-surface-3)' }}>
                    {enviando ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                    <input type="file" className="hidden" onChange={enviarArquivo} disabled={enviando} />
                  </label>
                  <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviar()}
                    placeholder="Mensagem..." className="flex-1 h-9 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
                  <button onClick={enviar} disabled={!texto.trim()} className="w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
