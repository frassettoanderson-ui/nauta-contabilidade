'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { FloatingDots } from '@/components/ui/section-fx'

interface Props { onOpenLead: () => void }

const FLASHLIGHT_R = 180   // raio do cone de luz (px)
const LOGO_HIT_R   = 85    // distância para ativar o reveal

export default function FinalCTASection({ onOpenLead }: Props) {
  const [revealed,    setRevealed]    = useState(false)
  const [revealing,   setRevealing]   = useState(false)   // animação de transição
  const [mousePos,    setMousePos]    = useState({ x: -999, y: -999 })
  const [inSection,   setInSection]   = useState(false)

  const sectionRef = useRef<HTMLElement>(null)
  const logoRef    = useRef<HTMLDivElement>(null)
  const revealedRef = useRef(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (revealedRef.current) return
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })

    // Verifica proximidade com a logo
    const logoEl = logoRef.current
    if (!logoEl) return
    const lr = logoEl.getBoundingClientRect()
    const cx = lr.left + lr.width  / 2 - rect.left
    const cy = lr.top  + lr.height / 2 - rect.top
    const dist = Math.hypot(x - cx, y - cy)

    if (dist < LOGO_HIT_R) {
      revealedRef.current = true
      setRevealing(true)
      // Aguarda animação de flash antes de revelar
      setTimeout(() => setRevealed(true), 900)
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const enter = () => setInSection(true)
    const leave = () => { setInSection(false); setMousePos({ x: -999, y: -999 }) }
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [handleMouseMove])

  /* ─── Fundo do overlay dinâmico ─────────────────────────────── */
  const overlayBg = inSection && !revealing
    ? `radial-gradient(circle ${FLASHLIGHT_R}px at ${mousePos.x}px ${mousePos.y}px,
        rgba(0,0,0,0)    0%,
        rgba(0,0,0,0.75) 50%,
        rgba(0,0,0,0.97) 80%)`
    : 'rgba(0,0,0,0.97)'

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background: '#04030f',
        cursor: revealed ? 'default' : 'none',
        minHeight: '420px',
      }}
      aria-label="CTA final"
    >
      {/* ── Partículas (visíveis após o reveal) ── */}
      {revealed && <FloatingDots containerRef={sectionRef} />}

      {/* ════════════════════════════════════════
          CONTEÚDO REAL — z-10 (sempre no DOM)
      ════════════════════════════════════════ */}
      <div className="relative z-10 py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <div className="flex justify-center mb-8">
          <div className="w-16 h-px bg-[#0BBCD4]" aria-hidden="true" />
        </div>

        {/* LOGO — alvo da lanterna */}
        <div ref={logoRef} className="flex justify-center mb-8">
          <Image
            src="/logo-branca.png"
            alt="Nauta Contabilidade"
            width={180} height={52}
            className="h-12 w-auto object-contain"
            style={{
              filter: revealed
                ? 'drop-shadow(0 0 18px rgba(11,188,212,0.5))'
                : 'none',
              transition: 'filter 0.6s ease',
            }}
          />
        </div>

        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
          style={{ letterSpacing: '-0.02em' }}
        >
          Pronto para simplificar<br />sua contabilidade?
        </h2>

        <p className="text-gray-400 text-lg mb-10">
          Fale com um especialista e receba uma proposta personalizada. Sem compromisso.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onOpenLead} className="btn-primary text-base !py-4 !px-8">
            Solicitar proposta gratuita
            <ArrowRight size={18} />
          </button>
          <a
            href="https://wa.me/5548998211604"
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-base !py-4 !px-8"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Falar no WhatsApp
          </a>
        </div>

        <p className="text-gray-600 text-sm mt-8">
          Resposta em até 24h · Sem spam · Atendimento 100% digital
        </p>
      </div>

      {/* ════════════════════════════════════════
          OVERLAY ESCURO — z-20
          Radial-gradient cria o cone de luz
      ════════════════════════════════════════ */}
      {!revealed && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center transition-opacity"
          style={{
            background:   overlayBg,
            opacity:      revealing ? 0 : 1,
            transition:   revealing
              ? 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), background 0.05s'
              : 'background 0.04s linear',
            pointerEvents: revealing ? 'none' : 'auto',
          }}
        >
          {/* Texto hint — visível quando o mouse está longe */}
          <div
            className="select-none text-center pointer-events-none transition-opacity duration-300"
            style={{
              opacity: inSection ? 0 : 1,
            }}
          >
            <p className="text-white/40 text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Está se sentindo<br />no escuro?
            </p>
            <p className="text-white/20 text-sm tracking-widest uppercase">
              mova o mouse para explorar
            </p>
          </div>
        </div>
      )}

      {/* Flash branco no momento do reveal */}
      {revealing && (
        <div
          className="absolute inset-0 z-25 pointer-events-none"
          style={{
            background: 'rgba(11,188,212,0.08)',
            animation: 'flashReveal 0.9s ease-out forwards',
          }}
          aria-hidden="true"
        />
      )}

      {/* ════════════════════════════════════════
          CURSOR LANTERNA — z-30
      ════════════════════════════════════════ */}
      {!revealed && inSection && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left:   mousePos.x,
            top:    mousePos.y,
            transform: 'translate(-50%, -50%)',
            width:  44,
            height: 44,
          }}
          aria-hidden="true"
        >
          {/* Anel externo */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1.5px solid rgba(255,220,100,0.55)',
              boxShadow: '0 0 12px rgba(255,220,100,0.25), 0 0 32px rgba(255,220,100,0.10)',
            }}
          />
          {/* Ponto central */}
          <div
            className="absolute rounded-full"
            style={{
              width: 4, height: 4,
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              background: 'rgba(255,220,100,0.8)',
              boxShadow: '0 0 6px rgba(255,220,100,0.6)',
            }}
          />
          {/* Crosshair suave */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div style={{ width: 14, height: 1, background: 'rgba(255,220,100,0.3)' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div style={{ width: 1, height: 14, background: 'rgba(255,220,100,0.3)' }} />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes flashReveal {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </section>
  )
}
