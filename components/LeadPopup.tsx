'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, CheckCircle, Loader2, ArrowRight, MessageCircle, ChevronRight } from 'lucide-react'
import { saveLead } from '@/lib/api'

const INTERESTS = [
  'Trocar de contador',
  'Abrir minha empresa',
  'Deixar de ser MEI',
  'BPO Financeiro',
  'Contabilidade Eleitoral',
  'Outro',
]

const TRUST = ['+10 anos de experiência', 'Atendimento em todo o Brasil', 'BPO 100% interno', 'Resposta em até 24h']

interface LeadPopupProps { isOpen: boolean; onClose: () => void; interest?: string }
type Status = 'idle' | 'loading' | 'success' | 'error'
type View   = 'form' | 'whatsapp' | 'success'

export default function LeadPopup({ isOpen, onClose, interest }: LeadPopupProps) {
  const [form,     setForm]     = useState({ nome: '', whatsapp: '', email: '', interesse: interest || '' })
  const [status,   setStatus]   = useState<Status>('idle')
  const [view,     setView]     = useState<View>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [focused,  setFocused]  = useState<string | null>(null)

  useEffect(() => { if (interest) setForm(f => ({ ...f, interesse: interest })) }, [interest])
  useEffect(() => { if (isOpen) { setView('form'); setStatus('idle'); setErrorMsg('') } }, [isOpen])
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const realClose = useCallback(() => {
    onClose()
    setTimeout(() => {
      setView('form'); setStatus('idle')
      setForm({ nome: '', whatsapp: '', email: '', interesse: interest || '' })
      setErrorMsg('')
    }, 300)
  }, [onClose, interest])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') realClose()
  }, [realClose])

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  function handleFormClose() {
    // Se o formulário ainda não foi enviado, mostra a tela de WhatsApp antes de fechar
    const preenchido = form.nome.trim() || form.whatsapp.trim() || form.email.trim()
    if (!preenchido) {
      setView('whatsapp')
    } else {
      realClose()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const formatWhatsApp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.whatsapp || !form.email || !form.interesse) {
      setErrorMsg('Preencha todos os campos para continuar.')
      return
    }
    setErrorMsg(''); setStatus('loading')
    try {
      await saveLead({ nome: form.nome, whatsapp: form.whatsapp, email: form.email, interesse: form.interesse })
      setStatus('success'); setView('success')
    } catch {
      setStatus('error')
      setErrorMsg('Erro ao enviar. Tente pelo WhatsApp.')
    }
  }

  if (!isOpen) return null

  /* Input style helper */
  const inputStyle = (name: string) => ({
    width: '100%',
    height: '48px',
    padding: '0 14px',
    fontSize: '14px',
    background: focused === name ? '#fff' : '#f8f9fc',
    border: `1.5px solid ${focused === name ? '#0BBCD4' : '#e4e6ef'}`,
    borderRadius: '10px',
    color: '#1a1830',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
    boxShadow: focused === name ? '0 0 0 4px rgba(11,188,212,0.10)' : 'none',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: 'rgba(5,4,20,0.75)' }}
        onClick={view === 'form' ? handleFormClose : realClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[820px] rounded-3xl overflow-hidden flex shadow-2xl"
        style={{
          animation: 'popupIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Coluna esquerda — branding premium ── */}
        <div
          className="hidden sm:flex flex-col justify-between px-8 py-10 w-[280px] shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(155deg, #11103a 0%, #1e1c5e 40%, #2a2875 70%, #3D3B8E 100%)' }}
        >
          {/* Orbs decorativos */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(11,188,212,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 -left-10 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(61,59,142,0.35) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(11,188,212,0.04) 0%, transparent 70%)' }} />

          {/* Logo */}
          <div className="relative z-10 flex justify-center">
            <Image
              src="/logo-vertical-branca.png"
              alt="Nauta Contabilidade"
              width={200} height={160}
              className="w-44 h-auto object-contain"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}
            />
          </div>

          {/* Divider + trust */}
          <div className="relative z-10">
            <div className="w-8 h-px mb-6" style={{ background: 'linear-gradient(to right, #0BBCD4, transparent)' }} />
            <ul className="space-y-3.5">
              {TRUST.map(t => (
                <li key={t} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(11,188,212,0.15)', border: '1px solid rgba(11,188,212,0.3)' }}>
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" stroke="#0BBCD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-white/70 text-xs leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rodapé esquerdo */}
          <p className="relative z-10 text-white/25 text-[10px] tracking-widest uppercase">
            nautacontabilidade.com.br
          </p>
        </div>

        {/* ── Coluna direita — conteúdo ── */}
        <div className="flex-1 flex flex-col bg-white min-w-0">

          {/* Mobile header */}
          <div className="sm:hidden px-5 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #11103a, #3D3B8E)' }}>
            <Image src="/logo-branca.png" alt="Nauta" width={100} height={30} className="h-7 w-auto" />
            <button onClick={view === 'form' ? handleFormClose : realClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }} aria-label="Fechar">
              <X size={14} className="text-white" />
            </button>
          </div>

          {/* Header direito */}
          <div className="flex items-start justify-between px-7 pt-7 pb-0">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1"
                style={{ color: '#0BBCD4' }}>
                {view === 'success' ? 'Enviado com sucesso' : view === 'whatsapp' ? 'Canal alternativo' : 'Atendimento especializado'}
              </p>
              <h2 className="text-2xl font-black leading-tight" style={{ color: '#0f0e1a', letterSpacing: '-0.02em' }}>
                {view === 'whatsapp' ? 'Prefere o WhatsApp?' :
                 view === 'success'  ? 'Recebemos seu contato!' :
                 'Fale com um especialista'}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                {view === 'whatsapp' ? 'Fale direto, sem formulário.' :
                 view === 'success'  ? 'Entraremos em contato em breve.' :
                 'Rápido, gratuito e sem compromisso.'}
              </p>
            </div>
            <button
              onClick={view === 'form' ? handleFormClose : realClose}
              aria-label="Fechar"
              className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center ml-4 shrink-0 transition-all duration-200 hover:scale-110"
              style={{ background: '#f1f5f9', color: '#64748b' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Linha divisória com gradiente */}
          <div className="mx-7 mt-5 h-px" style={{ background: 'linear-gradient(to right, rgba(11,188,212,0.3), rgba(61,59,142,0.15), transparent)' }} />

          {/* Corpo */}
          <div className="px-7 py-6 overflow-y-auto">

            {/* ── SUCESSO ── */}
            {view === 'success' && (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <CheckCircle className="text-green-500" size={32} />
                </div>
                <h3 className="text-base font-bold text-[#0f0e1a] mb-2">Tudo certo!</h3>
                <p className="text-gray-500 text-sm mb-7 max-w-xs leading-relaxed">
                  Nossa equipe vai entrar em contato em breve. Ou, se preferir, fale agora pelo WhatsApp.
                </p>
                <a href="https://wa.me/5548998211604" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Falar no WhatsApp
                </a>
              </div>
            )}

            {/* ── WHATSAPP ── */}
            {view === 'whatsapp' && (
              <div className="flex flex-col items-center text-center py-4">
                {/* Ícone WhatsApp elegante */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.06))', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#22c55e" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  {/* Dot pulsante */}
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                    <span className="w-4 h-4 rounded-full bg-green-400 animate-ping absolute" />
                    <span className="w-2 h-2 rounded-full bg-white relative z-10" />
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#0f0e1a] mb-2 leading-snug" style={{ letterSpacing: '-0.01em' }}>
                  Formulários não são<br/>para todo mundo.
                </h3>
                <p className="text-gray-500 text-sm mb-7 max-w-xs leading-relaxed">
                  Sem problema! Fale diretamente com um de nossos especialistas pelo WhatsApp. É rápido e sem burocracia.
                </p>

                <a href="https://wa.me/5548998211604" target="_blank" rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 text-white font-bold px-7 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 8px 28px rgba(34,197,94,0.35)' }}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Falar no WhatsApp agora
                </a>

                <button onClick={() => setView('form')}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#3D3B8E]"
                  style={{ color: '#94a3b8' }}>
                  Prefiro preencher o formulário
                  <ChevronRight size={12} />
                </button>
              </div>
            )}

            {/* ── FORMULÁRIO ── */}
            {view === 'form' && (
              <form onSubmit={handleSubmit} noValidate>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="nome" className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                      Nome completo <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="nome" name="nome" type="text"
                      value={form.nome} onChange={handleChange}
                      placeholder="Seu nome"
                      onFocus={() => setFocused('nome')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('nome')}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="whatsapp" className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                      WhatsApp <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="whatsapp" name="whatsapp" type="tel"
                      value={form.whatsapp}
                      onChange={e => setForm(f => ({ ...f, whatsapp: formatWhatsApp(e.target.value) }))}
                      placeholder="(00) 00000-0000"
                      onFocus={() => setFocused('whatsapp')}
                      onBlur={() => setFocused(null)}
                      style={inputStyle('whatsapp')}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                    E-mail <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="email" name="email" type="email"
                    value={form.email} onChange={handleChange}
                    placeholder="seu@email.com"
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('email')}
                    required
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="interesse" className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                    O que você precisa? <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="interesse" name="interesse"
                    value={form.interesse} onChange={handleChange}
                    onFocus={() => setFocused('interesse')}
                    onBlur={() => setFocused(null)}
                    style={{ ...inputStyle('interesse'), cursor: 'pointer' }}
                    required
                  >
                    <option value="" disabled>Selecione uma opção</option>
                    {INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-600 text-xs" role="alert">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2.5 text-white font-bold py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #2d2b8a 0%, #3D3B8E 50%, #4d47b0 100%)',
                    boxShadow: '0 8px 24px rgba(61,59,142,0.4), 0 2px 6px rgba(61,59,142,0.2)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {status === 'loading'
                    ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                    : <>Quero ser contactado <ArrowRight size={16} /></>
                  }
                </button>

                {/* Trust footer */}
                <div className="flex items-center justify-center gap-1.5 mt-3.5">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Seus dados estão protegidos. Não fazemos spam.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  )
}
