'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, Send, MessageSquare } from 'lucide-react'

export default function FloatingChat() {
  const [open,    setOpen]    = useState(false)
  const [message, setMessage] = useState('')
  const [sent,    setSent]    = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /* foca o input ao abrir */
  useEffect(() => {
    if (open && !sent) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, sent])

  function handleSend() {
    if (!message.trim()) return
    const text = encodeURIComponent(message.trim())
    window.open(`https://wa.me/5548998211604?text=${text}`, '_blank')
    setSent(true)
    setMessage('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSend()
  }

  function handleClose() {
    setOpen(false)
    setSent(false)
    setMessage('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Janela do chat */}
      <div className={`transition-all duration-300 origin-bottom-right ${
        open
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}>
        <div className="w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="bg-[#3D3B8E] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <Image
                    src="/icone-branca.png"
                    alt="Nauta"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#3D3B8E]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Nauta Contabilidade</p>
                <p className="text-white/60 text-xs mt-0.5">Normalmente responde em minutos</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar chat"
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Corpo */}
          <div className="px-4 py-5 min-h-[160px] flex flex-col justify-between bg-gray-50">
            {!sent ? (
              <>
                {/* Mensagem da Nauta */}
                <div className="flex items-start gap-2 mb-4">
                  <div className="w-7 h-7 bg-[#3D3B8E] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Image src="/icone-branca.png" alt="" width={14} height={14} className="object-contain" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[220px]">
                    <p className="text-gray-700 text-sm leading-snug">
                      Olá! 👋 Em que podemos te ajudar?
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1">agora</p>
                  </div>
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2.5 shadow-sm">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    aria-label="Enviar"
                    className="w-8 h-8 bg-[#0BBCD4] hover:bg-[#0999ae] disabled:opacity-40 rounded-full flex items-center justify-center transition-colors shrink-0"
                  >
                    <Send size={14} className="text-white" />
                  </button>
                </div>
              </>
            ) : (
              /* Confirmação após enviar */
              <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-green-500" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold text-sm mb-1">Mensagem enviada!</p>
                <p className="text-gray-400 text-xs">Você foi redirecionado para o WhatsApp. Responderemos em breve.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center justify-center gap-1">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-green-500" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span className="text-gray-400 text-[10px]">Conversa via WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Botão flutuante */}
      <button
        onClick={() => { setOpen(o => !o); setSent(false) }}
        aria-label={open ? 'Fechar chat' : 'Abrir chat'}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          open
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-[#3D3B8E] hover:bg-[#272561]'
        }`}
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageSquare size={22} className="text-white" />
        }

        {/* Pulse quando fechado */}
        {!open && (
          <span className="absolute w-14 h-14 rounded-full bg-[#3D3B8E] animate-ping opacity-20" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
