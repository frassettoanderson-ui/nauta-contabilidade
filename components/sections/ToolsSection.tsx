'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Calculator, PieChart, DollarSign, FileX, ArrowRight, Sparkles } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const tools = [
  {
    icon:   Calculator,
    title:  'Calculadora Fator R',
    desc:   'Descubra se vale a pena enquadrar seus serviços como Anexo III para pagar menos impostos.',
    href:   '/ferramentas/calculadora-fator-r',
    accent: '#0BBCD4',
    tag:    'MEI & Simples',
  },
  {
    icon:   PieChart,
    title:  'Simulador de Regime Tributário',
    desc:   'Simule qual regime tributário é mais vantajoso para o seu negócio: Simples, Presumido ou Real.',
    href:   '/ferramentas/simulador-regime-tributario',
    accent: '#7c6fff',
    tag:    'Planejamento',
  },
  {
    icon:   DollarSign,
    title:  'Calculadora Salário Líquido',
    desc:   'Calcule o salário líquido do colaborador com todos os descontos de INSS e IR.',
    href:   '/ferramentas/calculadora-salario-liquido',
    accent: '#0BBCD4',
    tag:    'RH & Folha',
  },
  {
    icon:   FileX,
    title:  'Simulador de Rescisão',
    desc:   'Simule os valores de rescisão de contrato de trabalho: aviso prévio, FGTS e mais.',
    href:   '/ferramentas/simulador-rescisao',
    accent: '#7c6fff',
    tag:    'Trabalhista',
  },
]

export default function ToolsSection() {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section
      id="ferramentas"
      ref={sectionRef}
      className="py-24 section-dark relative overflow-hidden"
      aria-labelledby="tools-heading"
    >
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />

      {/* Orbs decorativos */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(11,188,212,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80"
          style={{ background: 'radial-gradient(circle, rgba(124,111,255,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 animate-from-left">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.25)' }}>
                <Sparkles size={14} className="text-[#0BBCD4]" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: '#0BBCD4' }}>
                100% Gratuito
              </span>
            </div>
            <h2 id="tools-heading" className="text-4xl sm:text-5xl font-black text-white leading-tight"
              style={{ letterSpacing: '-0.02em' }}>
              Ferramentas para<br />
              <span className="text-[#0BBCD4]">decisões inteligentes.</span>
            </h2>
          </div>
          <p className="text-gray-400 max-w-sm leading-relaxed text-base lg:text-right">
            Calculadoras e simuladores para você tomar as melhores decisões financeiras — sem precisar de um contador agora.
          </p>
        </div>

        {/* ── Grid de cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tools.map(({ icon: Icon, title, desc, href, accent, tag }, i) => (
            <Link
              key={href}
              href={href}
              className={`group relative rounded-2xl p-6 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 ${i % 2 === 0 ? 'animate-from-left' : 'animate-from-right'}`}
              style={{
                transitionDelay: `${i * 80}ms`,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = accent === '#0BBCD4' ? 'rgba(11,188,212,0.05)' : 'rgba(124,111,255,0.05)'
                el.style.border = `1px solid ${accent === '#0BBCD4' ? 'rgba(11,188,212,0.25)' : 'rgba(124,111,255,0.25)'}`
                el.style.boxShadow = accent === '#0BBCD4'
                  ? '0 20px 60px rgba(11,188,212,0.12), 0 4px 20px rgba(0,0,0,0.3)'
                  : '0 20px 60px rgba(124,111,255,0.12), 0 4px 20px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,0.03)'
                el.style.border = '1px solid rgba(255,255,255,0.07)'
                el.style.boxShadow = 'none'
              }}
              aria-label={title}
            >
              {/* Glow de fundo */}
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
                style={{ background: accent === '#0BBCD4' ? 'rgba(11,188,212,0.2)' : 'rgba(124,111,255,0.2)' }}
                aria-hidden="true" />

              {/* Tag */}
              <span className="self-start text-[10px] font-bold px-2.5 py-1 rounded-full mb-5 uppercase tracking-wider"
                style={{
                  background: accent === '#0BBCD4' ? 'rgba(11,188,212,0.10)' : 'rgba(124,111,255,0.10)',
                  color: accent,
                  border: `1px solid ${accent === '#0BBCD4' ? 'rgba(11,188,212,0.20)' : 'rgba(124,111,255,0.20)'}`,
                }}>
                {tag}
              </span>

              {/* Ícone */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: accent === '#0BBCD4' ? 'rgba(11,188,212,0.10)' : 'rgba(124,111,255,0.10)',
                  border: `1px solid ${accent === '#0BBCD4' ? 'rgba(11,188,212,0.20)' : 'rgba(124,111,255,0.20)'}`,
                }}>
                <Icon size={22} style={{ color: accent }} aria-hidden="true" />
              </div>

              <h3 className="font-bold text-white text-sm mb-2 leading-snug">{title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed flex-1">{desc}</p>

              {/* CTA */}
              <div className="flex items-center gap-1.5 mt-5 text-xs font-bold transition-all duration-200 group-hover:gap-2.5"
                style={{ color: accent }}>
                Usar ferramenta
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
              </div>

              {/* Linha decorativa na base */}
              <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-500 ease-out"
                style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
                aria-hidden="true" />
            </Link>
          ))}
        </div>

        {/* ── Rodapé: CTA + badge de confiança ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 animate-from-left delay-500">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f0e1a]"
                  style={{ background: `hsl(${220 + i * 30}, 60%, 40%)` }} />
              ))}
            </div>
            <p className="text-gray-400 text-sm">
              <span className="text-white font-bold">+2.000 empresários</span> já usaram nossas ferramentas
            </p>
          </div>

          <Link
            href="/ferramentas"
            className="inline-flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm"
            style={{
              background: 'linear-gradient(135deg, #2d2b8a, #3D3B8E)',
              boxShadow: '0 8px 24px rgba(61,59,142,0.35)',
            }}
          >
            Ver todas as ferramentas
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
