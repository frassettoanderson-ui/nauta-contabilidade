'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Send, MessageSquare } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'

interface Bolha { de: 'bot' | 'me'; texto: string }
type Step = 'inicio' | 'cli_nome' | 'cli_empresa' | 'cli_setor' | 'nc_nome' | 'nc_tel' | 'nc_email' | 'nc_interesse' | 'chat'

const SETORES = [
  { label: 'Comercial', setor: 'comercial' },
  { label: 'Fiscal', setor: 'fiscal' },
  { label: 'Departamento Pessoal', setor: 'pessoal' },
  { label: 'Atendimento', setor: 'atendente' },
]
const INTERESSES = ['Abrir minha empresa', 'Trocar de contador', 'Deixar de ser MEI', 'BPO Financeiro', 'Contabilidade Eleitoral', 'Outro']

export default function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('inicio')
  const [thread, setThread] = useState<Bolha[]>([{ de: 'bot', texto: 'Olá! 👋 Sou o atendente virtual da Nauta Contabilidade. Você já é cliente da Nauta?' }])
  const [input, setInput] = useState('')
  const [dados, setDados] = useState<{ nome?: string; empresa?: string; telefone?: string; email?: string; interesse?: string }>({})
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [nomeCliente, setNomeCliente] = useState('')
  const [serverMsgs, setServerMsgs] = useState<{ id: string; autor_tipo: string; texto: string | null }[]>([])
  const [atendenteDigitando, setAtendenteDigitando] = useState(false)
  const digEmitRef = useRef<number | null>(null)
  const digRecvRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  // Retoma conversa salva
  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('nauta-site-chat') : null
    if (id) { setConversaId(id); setStep('chat') }
    const nm = typeof window !== 'undefined' ? localStorage.getItem('nauta-site-chat-nome') : null
    if (nm) setNomeCliente(nm)
  }, [])

  const scrollFim = () => setTimeout(() => fimRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  useEffect(() => { if (open) scrollFim() }, [open, thread, serverMsgs])
  useEffect(() => { if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 200) }, [open, step])

  const addBot = (texto: string) => setThread(t => [...t, { de: 'bot', texto }])
  const addMe = (texto: string) => setThread(t => [...t, { de: 'me', texto }])

  // Polling das mensagens quando conectado
  const carregar = useCallback(() => {
    if (!conversaId) return
    fetch(`/api/site-chat/mensagens?conversaId=${conversaId}`).then(r => r.json()).then(setServerMsgs).catch(() => {})
  }, [conversaId])
  useEffect(() => {
    if (step !== 'chat' || !conversaId) return
    carregar()
    const socket = getSocket()
    socket.emit('join', conversaId)
    const onMsg = (data: { conversaId: string }) => { if (data?.conversaId === conversaId) { setAtendenteDigitando(false); carregar() } }
    socket.on('nova-msg', onMsg)
    const onDig = (p: { conversaId: string }) => {
      if (p?.conversaId !== conversaId) return
      setAtendenteDigitando(true)
      if (digRecvRef.current) clearTimeout(digRecvRef.current)
      digRecvRef.current = window.setTimeout(() => setAtendenteDigitando(false), 3000)
    }
    const onParou = (p: { conversaId: string }) => { if (p?.conversaId === conversaId) setAtendenteDigitando(false) }
    socket.on('digitando', onDig)
    socket.on('parou', onParou)
    const t = setInterval(carregar, 10000) // fallback
    return () => { clearInterval(t); socket.emit('leave', conversaId); socket.off('nova-msg', onMsg); socket.off('digitando', onDig); socket.off('parou', onParou) }
  }, [step, conversaId, carregar])

  function aoDigitarSite(v: string) {
    setInput(v)
    if (step !== 'chat' || !conversaId) return
    const socket = getSocket()
    socket.emit('digitando', { conversaId, nome: nomeCliente || 'Cliente' })
    if (digEmitRef.current) clearTimeout(digEmitRef.current)
    digEmitRef.current = window.setTimeout(() => socket.emit('parou', { conversaId }), 1800)
  }

  async function finalizar(ehCliente: boolean, setor: string, d: typeof dados) {
    addBot('Perfeito! Estou te transferindo para o setor responsável. Em breve um atendente fala com você por aqui. 😊')
    try {
      const r = await fetch('/api/site-chat/iniciar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ehCliente, setor, ...d }),
      }).then(r => r.json())
      if (r.conversaId) {
        localStorage.setItem('nauta-site-chat', r.conversaId)
        localStorage.setItem('nauta-site-chat-nome', d.nome ?? 'Visitante')
        setNomeCliente(d.nome ?? '')
        setConversaId(r.conversaId)
        setStep('chat')
      }
    } catch { addBot('Tivemos um problema ao transferir. Tente novamente em instantes.') }
  }

  function escolherSetor(label: string, setor: string) {
    addMe(label)
    finalizar(true, setor, { nome: dados.nome, empresa: dados.empresa })
  }
  function escolherInteresse(interesse: string) {
    addMe(interesse)
    const d = { ...dados, interesse }
    setDados(d)
    finalizar(false, 'comercial', d)
  }

  function responderTexto() {
    const v = input.trim(); if (!v) return
    addMe(v); setInput('')
    if (step === 'cli_nome') { setDados(d => ({ ...d, nome: v })); addBot('Qual o nome da sua empresa?'); setStep('cli_empresa') }
    else if (step === 'cli_empresa') { setDados(d => ({ ...d, empresa: v })); addBot('Com qual setor você quer falar?'); setStep('cli_setor') }
    else if (step === 'nc_nome') { setDados(d => ({ ...d, nome: v })); addBot('Qual o seu telefone/WhatsApp?'); setStep('nc_tel') }
    else if (step === 'nc_tel') { setDados(d => ({ ...d, telefone: v })); addBot('E o seu e-mail?'); setStep('nc_email') }
    else if (step === 'nc_email') { setDados(d => ({ ...d, email: v })); addBot('Por último: qual assunto você procura?'); setStep('nc_interesse') }
    else if (step === 'chat' && conversaId) {
      const nome = localStorage.getItem('nauta-site-chat-nome') ?? 'Visitante'
      getSocket().emit('parou', { conversaId })
      fetch('/api/site-chat/mensagem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversaId, nome, texto: v }) }).then(carregar)
    }
  }

  function reiniciar() {
    localStorage.removeItem('nauta-site-chat'); localStorage.removeItem('nauta-site-chat-nome')
    setConversaId(null); setServerMsgs([]); setDados({})
    setThread([{ de: 'bot', texto: 'Olá! 👋 Você já é cliente da Nauta?' }]); setStep('inicio')
  }

  const encerrada = serverMsgs.some(m => m.autor_tipo === 'bot' && (m.texto || '').includes('Atendimento encerrado'))
  const usaInput = ['cli_nome', 'cli_empresa', 'nc_nome', 'nc_tel', 'nc_email', 'chat'].includes(step) && !(step === 'chat' && encerrada)
  const placeholder = step === 'nc_email' ? 'seu@email.com' : step === 'nc_tel' ? '(00) 00000-0000' : step === 'chat' ? 'Digite sua mensagem...' : 'Digite aqui...'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div className={`transition-all duration-300 origin-bottom-right ${open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
        <div className="w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col" style={{ height: 460 }}>
          {/* Header */}
          <div className="bg-[#3D3B8E] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <Image src="/icone-branca.png" alt="Nauta" width={22} height={22} className="object-contain" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#3D3B8E]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Nauta Contabilidade</p>
                <p className="text-white/60 text-xs mt-0.5">{step === 'chat' ? 'Atendimento' : 'Atendente virtual'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar chat" className="text-white/60 hover:text-white p-1"><X size={18} /></button>
          </div>

          {/* Corpo */}
          <div className="flex-1 overflow-y-auto px-3 py-4 bg-gray-50 space-y-2">
            {/* Triagem (thread local) */}
            {step !== 'chat' && thread.map((b, i) => (
              <div key={i} className={`flex ${b.de === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[220px] px-3.5 py-2 text-sm leading-snug rounded-2xl ${b.de === 'me' ? 'bg-[#0BBCD4] text-white rounded-br-none' : 'bg-white text-gray-700 shadow-sm rounded-tl-none'}`}>{b.texto}</div>
              </div>
            ))}

            {/* Conversa conectada */}
            {step === 'chat' && (
              <>
                {!encerrada && (
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 bg-[#3D3B8E] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Image src="/icone-branca.png" alt="" width={14} height={14} className="object-contain" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-sm max-w-[230px]">
                      <p className="text-gray-700 text-sm leading-snug">Certo{nomeCliente ? `, ${nomeCliente.split(' ')[0]}` : ''}! Já avisei o responsável sobre o seu contato e dentro de alguns instantes nosso time vai te atender!! 🙌</p>
                    </div>
                  </div>
                )}
                {serverMsgs.filter(m => m.autor_tipo !== 'bot').map(m => {
                  const meu = m.autor_tipo === 'visitante'
                  return (
                    <div key={m.id} className={`flex ${meu ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[220px] px-3.5 py-2 text-sm leading-snug rounded-2xl ${meu ? 'bg-[#0BBCD4] text-white rounded-br-none' : 'bg-white text-gray-700 shadow-sm rounded-tl-none'}`}>{m.texto}</div>
                    </div>
                  )
                })}
                {atendenteDigitando && !encerrada && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2 shadow-sm">
                      <span className="text-gray-500 text-sm italic">digitando…</span>
                    </div>
                  </div>
                )}
                {encerrada && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-500 mb-2">🔒 Este atendimento foi encerrado.</p>
                    <button onClick={reiniciar} className="h-9 px-4 rounded-lg text-sm font-bold text-white bg-[#3D3B8E]">Iniciar novo atendimento</button>
                  </div>
                )}
              </>
            )}

            {/* Botões de escolha */}
            {step === 'inicio' && (
              <div className="flex gap-2 pt-1">
                <button onClick={() => { addMe('Sim, sou cliente'); addBot('Que bom! Qual o seu nome?'); setStep('cli_nome') }} className="flex-1 h-9 rounded-lg text-sm font-bold text-white bg-[#3D3B8E]">Sim, sou cliente</button>
                <button onClick={() => { addMe('Ainda não'); addBot('Sem problemas! Qual o seu nome?'); setStep('nc_nome') }} className="flex-1 h-9 rounded-lg text-sm font-bold text-[#3D3B8E] border border-[#3D3B8E]">Ainda não</button>
              </div>
            )}
            {step === 'cli_setor' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {SETORES.map(s => <button key={s.setor} onClick={() => escolherSetor(s.label, s.setor)} className="h-9 rounded-lg text-xs font-bold text-white bg-[#3D3B8E] px-2">{s.label}</button>)}
              </div>
            )}
            {step === 'nc_interesse' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {INTERESSES.map(i => <button key={i} onClick={() => escolherInteresse(i)} className="h-9 rounded-lg text-xs font-bold text-white bg-[#3D3B8E] px-2">{i}</button>)}
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {/* Input */}
          {usaInput && (
            <div className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <input ref={inputRef} value={input} onChange={e => aoDigitarSite(e.target.value)} onKeyDown={e => e.key === 'Enter' && responderTexto()}
                placeholder={placeholder} className="flex-1 text-sm text-gray-700 outline-none bg-gray-100 rounded-full px-4 py-2.5 placeholder-gray-400" />
              <button onClick={responderTexto} disabled={!input.trim()} aria-label="Enviar" className="w-9 h-9 bg-[#0BBCD4] hover:bg-[#0999ae] disabled:opacity-40 rounded-full flex items-center justify-center shrink-0">
                <Send size={15} className="text-white" />
              </button>
            </div>
          )}
          {step === 'chat' && !encerrada && (
            <button onClick={reiniciar} className="text-[10px] text-gray-400 hover:text-gray-600 py-1.5 bg-white">Encerrar e iniciar novo atendimento</button>
          )}
        </div>
      </div>

      {/* Botão flutuante */}
      <button onClick={() => setOpen(o => !o)} aria-label={open ? 'Fechar chat' : 'Abrir chat'}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${open ? 'bg-gray-700 hover:bg-gray-600' : 'bg-[#3D3B8E] hover:bg-[#272561]'}`}>
        {open ? <X size={22} className="text-white" /> : <MessageSquare size={22} className="text-white" />}
        {!open && <span className="absolute w-14 h-14 rounded-full bg-[#3D3B8E] animate-ping opacity-20" aria-hidden="true" />}
      </button>
    </div>
  )
}
