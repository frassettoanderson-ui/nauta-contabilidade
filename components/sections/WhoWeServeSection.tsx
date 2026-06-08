'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Store, Briefcase, Stethoscope, Code2, ShoppingCart, UserCheck, ArrowRight } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const regimes = [
  { label: 'MEI',              desc: 'Até R$ 81k/ano',       color: '#0BBCD4', bg: 'rgba(11,188,212,0.08)',  border: 'rgba(11,188,212,0.35)' },
  { label: 'Simples Nacional', desc: 'Até R$ 4,8M/ano',      color: '#7c6fff', bg: 'rgba(124,111,255,0.08)', border: 'rgba(124,111,255,0.35)' },
  { label: 'Lucro Presumido',  desc: 'Acima de R$ 4,8M/ano', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)' },
]

const bullets = [
  'Atendimento personalizado para cada perfil',
  'Consultoria proativa, não só emissão de guias',
  'Comunicação por WhatsApp, ágil e direta',
]

const segments = [
  { icon: Briefcase,    label: 'Prestadores de serviço' },
  { icon: Store,        label: 'Comércio' },
  { icon: UserCheck,    label: 'Profissionais liberais' },
  { icon: Stethoscope,  label: 'Saúde' },
  { icon: Code2,        label: 'Tecnologia e Marketing' },
  { icon: ShoppingCart, label: 'E-commerce' },
]

interface Props { onOpenLead: () => void }

export default function WhoWeServeSection({ onOpenLead }: Props) {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section id="quem-atendemos" ref={sectionRef} className="py-24 section-dark overflow-hidden relative" aria-labelledby="who-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* ── Coluna esquerda ── */}
          <div className="animate-from-left">
            <div className="teal-line" />
            <h2 id="who-heading" className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
              Atendemos qualquer tipo de empresa, em qualquer lugar do Brasil
            </h2>
            <p className="text-gray-400 leading-relaxed mb-10 text-base">
              Seja você um MEI que quer crescer, um profissional liberal ou uma empresa consolidada — a Nauta está pronta.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {regimes.map(r => (
                <div key={r.label} className="flex-1 rounded-xl px-4 py-3 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                  <p className="font-bold text-sm mb-0.5" style={{ color: r.color }}>{r.label}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-4 mb-10">
              {bullets.map((item, i) => (
                <li key={item} className="flex items-start gap-3 animate-from-left" style={{ transitionDelay: `${200 + i * 100}ms` }}>
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(11,188,212,0.15)', border: '1px solid rgba(11,188,212,0.3)' }}>
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" stroke="#0BBCD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <button onClick={onOpenLead} className="btn-primary group animate-from-left delay-500">
              Falar com um especialista
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* ── Coluna direita ── */}
          <div className="animate-from-right delay-200">
            <p className="text-xs font-bold text-[#0BBCD4] tracking-widest uppercase mb-5">Segmentos atendidos</p>
            <div className="grid grid-cols-2 gap-3">
              {segments.map(({ icon: Icon, label }, i) => (
                <div key={label}
                  className="group relative rounded-2xl p-5 cursor-default transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', transitionDelay: `${i * 60}ms` }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background='rgba(11,188,212,0.06)'; el.style.border='1px solid rgba(11,188,212,0.2)'; el.style.boxShadow='0 8px 32px rgba(11,188,212,0.08)' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background='rgba(255,255,255,0.03)'; el.style.border='1px solid rgba(255,255,255,0.07)'; el.style.boxShadow='none' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all duration-300" style={{ background: 'rgba(11,188,212,0.08)' }}>
                    <Icon className="text-[#0BBCD4]/60 group-hover:text-[#0BBCD4] transition-colors duration-300" size={20} />
                  </div>
                  <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors duration-300 leading-snug">{label}</p>
                  <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: '#0BBCD4' }} aria-hidden="true" />
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-5 text-center">e muito mais — atendemos qualquer segmento, em qualquer estado.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
