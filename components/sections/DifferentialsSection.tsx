'use client'

import { useRef, useEffect, useState } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Shield, Globe2, Vote, Clock, Users2, Smartphone } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const differentials = [
  { icon: Shield,     title: 'BPO 100% Interno',        desc: 'Nada é terceirizado. Sua empresa é gerida por uma equipe dedicada e de confiança.', color: '#0BBCD4' },
  { icon: Globe2,     title: 'Atendimento Nacional',     desc: 'Atendemos de Norte a Sul do Brasil, 100% online, com a mesma qualidade.',           color: '#7c6fff' },
  { icon: Clock,      title: '+10 anos de experiência',  desc: 'Fundada em 2013, com histórico sólido de clientes satisfeitos em todo o país.',       color: '#0BBCD4' },
  { icon: Users2,     title: 'Equipe consultiva',        desc: 'Não somos só emissores de guias. Somos parceiros estratégicos do seu negócio.',        color: '#7c6fff' },
  { icon: Smartphone, title: 'App próprio',              desc: 'Acesse documentos, relatórios e comunique-se com o seu contador pelo nosso app.',      color: '#0BBCD4' },
]

/* ── Contador animado ── */
function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1800
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 4)
          setCount(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

interface Props { onOpenLead: (interest?: string) => void }

export default function DifferentialsSection({ onOpenLead }: Props) {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section id="diferenciais" ref={sectionRef} className="py-24 bg-white relative overflow-hidden" aria-labelledby="diff-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>

        <div className="mb-14 animate-from-left">
          <div className="teal-line" />
          <h2 id="diff-heading" className="text-4xl sm:text-5xl font-black text-[#0f0e1a] leading-tight">
            Por que escolher a Nauta?
          </h2>
        </div>

        {/* ── Cards redesenhados ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {differentials.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={title}
              className={`group relative rounded-2xl p-6 overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${i % 2 === 0 ? 'animate-from-left' : 'animate-from-right'}`}
              style={{
                transitionDelay: `${i * 80}ms`,
                background: 'rgba(15,14,26,0.03)',
                border: '1px solid rgba(15,14,26,0.08)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = color === '#0BBCD4' ? 'rgba(11,188,212,0.04)' : 'rgba(124,111,255,0.04)'
                el.style.border = `1px solid ${color === '#0BBCD4' ? 'rgba(11,188,212,0.25)' : 'rgba(124,111,255,0.25)'}`
                el.style.boxShadow = color === '#0BBCD4'
                  ? '0 20px 60px rgba(11,188,212,0.12), 0 4px 20px rgba(11,188,212,0.08)'
                  : '0 20px 60px rgba(124,111,255,0.12), 0 4px 20px rgba(124,111,255,0.08)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(15,14,26,0.03)'
                el.style.border = '1px solid rgba(15,14,26,0.08)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* Glow de fundo no hover */}
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                style={{ background: color === '#0BBCD4' ? 'rgba(11,188,212,0.15)' : 'rgba(124,111,255,0.15)' }}
                aria-hidden="true"
              />

              {/* Ícone */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: color === '#0BBCD4' ? 'rgba(11,188,212,0.10)' : 'rgba(124,111,255,0.10)',
                  border: `1px solid ${color === '#0BBCD4' ? 'rgba(11,188,212,0.20)' : 'rgba(124,111,255,0.20)'}`,
                }}
              >
                <Icon size={22} style={{ color }} aria-hidden="true" />
              </div>

              <h3 className="font-bold text-[#0f0e1a] text-sm mb-2 leading-snug">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>

              {/* Linha decorativa na base */}
              <div
                className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 ease-out"
                style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>

        {/* ── Card Eleitoral animado ── */}
        <div className="animate-zoom-in delay-400">
          <div
            className="relative rounded-2xl p-8 lg:p-12 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0d0c1e 0%, #1a1830 50%, #0f0e1a 100%)',
              border: '1px solid rgba(11,188,212,0.15)',
            }}
          >
            {/* Border shimmer animado */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(11,188,212,0.15) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmerBorder 3s linear infinite',
              }}
              aria-hidden="true"
            />

            {/* Orbs decorativos */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(11,188,212,0.08) 0%, transparent 70%)' }} aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(61,59,142,0.12) 0%, transparent 70%)' }} aria-hidden="true" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">

              {/* Ícone com pulse */}
              <div className="relative shrink-0">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.3)' }}
                >
                  <Vote className="text-[#0BBCD4]" size={30} aria-hidden="true" />
                </div>
                {/* Pulse rings */}
                <span className="absolute inset-0 rounded-xl animate-ping" style={{ background: 'rgba(11,188,212,0.08)', animationDuration: '2s' }} aria-hidden="true" />
                <span className="absolute -inset-2 rounded-xl animate-ping" style={{ background: 'rgba(11,188,212,0.04)', animationDuration: '2s', animationDelay: '0.5s' }} aria-hidden="true" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-2xl font-black text-white">Contabilidade Eleitoral Especializada</h3>

                  {/* Badge pulsante */}
                  <span
                    className="relative inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider"
                    style={{ background: 'rgba(11,188,212,0.15)', color: '#0BBCD4', border: '1px solid rgba(11,188,212,0.3)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0BBCD4] animate-pulse" aria-hidden="true" />
                    +<AnimatedCount target={400} /> aprovações
                  </span>
                </div>

                <p className="text-gray-400 leading-relaxed max-w-2xl text-sm">
                  Somos referência nacional em contabilidade eleitoral com mais de 400 prestações de contas aprovadas junto à Justiça Eleitoral. Atendemos candidatos de todos os portes e cargos com segurança, agilidade e total conformidade legal.
                </p>
              </div>

              <button
                onClick={() => onOpenLead('Contabilidade Eleitoral')}
                className="btn-primary shrink-0 whitespace-nowrap"
              >
                Quero saber mais
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS da animação shimmer */}
      <style jsx>{`
        @keyframes shimmerBorder {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </section>
  )
}
