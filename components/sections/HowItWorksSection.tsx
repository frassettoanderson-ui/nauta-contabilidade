'use client'

import { useRef, useState } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { ArrowRight } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const steps = [
  {
    title: 'Solicite a troca',
    detail: 'Clique em "Trocar de contador" e preencha um breve formulário. Você pode trocar em qualquer época do ano — sem multas ou complicações legais.',
    tip: '⏱ Leva menos de 2 minutos',
  },
  {
    title: 'Análise gratuita',
    detail: 'Nossa equipe analisa seu regime tributário, histórico contábil e necessidades. Te orientamos sobre cada próximo passo com clareza e sem jargões.',
    tip: '📋 Sem custo e sem compromisso',
  },
  {
    title: 'Nós cuidamos de tudo',
    detail: 'Comunicamos seu contador anterior, buscamos a documentação e fazemos toda a transição contábil. Você não precisa fazer absolutamente nada.',
    tip: '✅ Zero burocracia para você',
  },
  {
    title: 'Empresa em dia!',
    detail: 'Sua contabilidade passa a ser gerenciada pela Nauta. Acesse o app, fale com seu contador e dedique 100% da energia ao crescimento do negócio.',
    tip: '🚀 Bem-vindo à Nauta!',
  },
]

export default function HowItWorksSection() {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState<number | null>(null)

  return (
    <section id="como-funciona" ref={sectionRef} className="py-24 section-dark relative overflow-hidden" aria-labelledby="how-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>

        {/* Cabeçalho */}
        <div className="text-center mb-20 animate-on-scroll">
          <div className="teal-line mx-auto" />
          <h2 id="how-heading" className="text-4xl sm:text-5xl font-black text-white mt-4">
            Trocar de contador é fácil<span className="text-[#0BBCD4]">.</span>
          </h2>
          <p className="text-gray-400 mt-3 text-lg">
            Você pode trocar em qualquer época do ano.
          </p>
        </div>

        {/* ── Desktop: linha horizontal ── */}
        <div className="hidden md:block animate-on-scroll delay-100">

          {/* Linha + círculos */}
          <div className="relative flex items-center justify-between mb-12">

            {/* Linha de fundo */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px"
              style={{ background: 'linear-gradient(to right, rgba(11,188,212,0.15), rgba(11,188,212,0.5), rgba(61,59,142,0.5), rgba(11,188,212,0.15))' }}
              aria-hidden="true"
            />

            {steps.map((step, i) => (
              <div
                key={i}
                className="relative z-10 flex flex-col items-center"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {/* Pulse ring */}
                {active === i && (
                  <span className="absolute rounded-full animate-ping"
                    style={{ inset: '-14px', background: 'rgba(11,188,212,0.10)' }}
                    aria-hidden="true" />
                )}

                {/* Anel externo */}
                <div
                  className="absolute rounded-full transition-all duration-300"
                  style={{
                    inset: '-5px',
                    border: `1.5px solid ${active === i ? 'rgba(11,188,212,0.65)' : 'rgba(11,188,212,0.18)'}`,
                    borderRadius: '50%',
                  }}
                  aria-hidden="true"
                />

                {/* Círculo */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300"
                  style={{
                    background: active === i
                      ? 'linear-gradient(135deg, #0BBCD4 0%, #3D3B8E 100%)'
                      : 'linear-gradient(135deg, #1c1a35 0%, #252042 100%)',
                    boxShadow: active === i
                      ? '0 0 0 10px rgba(11,188,212,0.07), 0 8px 36px rgba(11,188,212,0.4)'
                      : '0 4px 24px rgba(0,0,0,0.5)',
                    transform: active === i ? 'scale(1.14)' : 'scale(1)',
                  }}
                >
                  <span
                    className="font-black transition-all duration-200"
                    style={{
                      fontSize: '30px',
                      color: active === i ? 'white' : 'rgba(11,188,212,0.65)',
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Textos abaixo — alinhados com cada círculo */}
          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="text-center px-2 cursor-default transition-all duration-300"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <h3
                  className="font-bold text-base mb-2 transition-colors duration-200"
                  style={{ color: active === i ? '#0BBCD4' : 'white' }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  {step.detail}
                </p>
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200"
                  style={{
                    background: active === i ? 'rgba(11,188,212,0.15)' : 'rgba(11,188,212,0.07)',
                    color: '#0BBCD4',
                  }}
                >
                  {step.tip}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile: lista vertical ── */}
        <div className="md:hidden space-y-0 animate-on-scroll">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            return (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-black text-2xl text-white"
                    style={{ background: 'linear-gradient(135deg,#0BBCD4,#3D3B8E)', boxShadow: '0 0 20px rgba(11,188,212,0.25)' }}
                  >
                    {i + 1}
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 my-2"
                      style={{ background: 'linear-gradient(to bottom,rgba(11,188,212,0.4),rgba(61,59,142,0.2))' }} />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-white font-bold text-lg mt-1 mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-2">{step.detail}</p>
                  <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(11,188,212,0.1)', color: '#0BBCD4' }}>
                    {step.tip}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 animate-on-scroll delay-200">
          <button className="btn-primary inline-flex items-center gap-2 group">
            Trocar de contador agora
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  )
}
