'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

// Botão de chat no canto superior direito — funcionalidade em breve.
export default function ChatButton() {
  const [hint, setHint] = useState(false)

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        onMouseEnter={() => setHint(true)}
        onMouseLeave={() => setHint(false)}
        onClick={() => setHint(true)}
        aria-label="Chat (em breve)"
        className="relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #0BBCD4, #6355e0)', boxShadow: '0 4px 16px rgba(11,188,212,0.35)' }}>
        <MessageCircle size={20} className="text-white" />
      </button>
      {hint && (
        <div className="absolute right-0 bottom-full mb-2 px-3 py-1.5 rounded-lg text-xs text-gray-300 whitespace-nowrap"
          style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
          Chat em breve
        </div>
      )}
    </div>
  )
}
