'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import AnimatedTextCycle from '@/components/ui/animated-text-cycle'
import { useCountUp } from '@/hooks/useCountUp'

const CYCLE_WORDS = [
  'crescer de verdade',
  'pagar menos impostos',
  'estar em dia',
  'ter mais segurança',
  'focar no que importa',
  'escalar com controle',
]

/* ── Stat individual com count-up ── */
function StatItem({
  target, prefix = '', suffix = '', label, delay = 0,
}: { target: number; prefix?: string; suffix?: string; label: string; delay?: number }) {
  const { count, start } = useCountUp(target, 1600)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { start(); observer.disconnect() } },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [start])

  return (
    <div
      ref={ref}
      className="flex flex-col opacity-0 animate-[fadeUp_0.6s_ease-out_forwards]"
      style={{ animationDelay: `${0.5 + delay}s` }}
    >
      <span className="text-4xl sm:text-6xl font-black text-[#0BBCD4] leading-none tabular-nums">
        {prefix}{count}{suffix}
      </span>
      <span className="text-gray-400 text-sm mt-1 leading-snug">{label}</span>
    </div>
  )
}

/* ── Bloco com todos os stats ── */
function HeroStats() {
  return (
    <div className="mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-white/10">
      <div className="flex flex-wrap gap-x-8 sm:gap-x-12 gap-y-6">
        <StatItem target={10}  prefix="+" suffix=" anos" label="de experiência"          delay={0}   />
        <StatItem target={400} prefix="+"               label="prestações eleitorais"    delay={0.1} />
        <StatItem target={100}             suffix="%"   label="digital e online"         delay={0.2} />
      </div>
    </div>
  )
}

interface HeroSectionProps { onOpenLead: (interest?: string) => void }

export default function HeroSection({ onOpenLead }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0f0e1a]" aria-label="Hero">

      {/* Imagem de fundo */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.png"
          alt="Empreendedor analisando dados do negócio"
          fill priority sizes="100vw"
          className="object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0e1a] via-[#0f0e1a]/85 to-[#0f0e1a]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e1a] via-transparent to-transparent" />
      </div>

      {/* Linha teal decorativa esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#0BBCD4] to-transparent z-10" aria-hidden="true" />

      {/* Conteúdo */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 w-full">
        <div className="max-w-3xl">

          {/* Tag */}
          <div className="inline-flex items-center gap-2 mb-6 opacity-0 animate-[fadeUp_0.6s_ease-out_0.1s_forwards]">
            <span className="w-8 h-px bg-[#0BBCD4]" aria-hidden="true" />
            <span className="text-[#0BBCD4] text-sm font-semibold uppercase tracking-widest">
              Desde 2013 · 100% Digital · Todo o Brasil
            </span>
          </div>

          {/* H1 com AnimatedTextCycle */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] sm:leading-[1.05] mb-6 opacity-0 animate-[fadeUp_0.6s_ease-out_0.2s_forwards]">
            Contabilidade digital para o seu negócio{' '}
            <AnimatedTextCycle
              words={CYCLE_WORDS}
              interval={3000}
              className="text-[#0BBCD4]"
            />
          </h1>

          {/* Subtítulo */}
          <p className="text-gray-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl opacity-0 animate-[fadeUp_0.6s_ease-out_0.3s_forwards]">
            Atendimento consultivo e personalizado, 100% online, para empresas de todos os portes em qualquer lugar do Brasil.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 opacity-0 animate-[fadeUp_0.6s_ease-out_0.4s_forwards]">
            <button onClick={() => onOpenLead('Trocar de contador')} className="btn-primary group">
              Trocar de contador
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => onOpenLead('Abrir minha empresa')} className="btn-secondary">
              Abrir minha empresa <ArrowRight size={16} />
            </button>
            <button onClick={() => onOpenLead('Deixar de ser MEI')} className="btn-secondary">
              Deixar de ser MEI <ArrowRight size={16} />
            </button>
          </div>

          {/* Números rápidos com count-up */}
          <HeroStats />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-40">
        <span className="text-white text-xs tracking-widest uppercase">scroll</span>
        <ChevronDown size={16} className="text-[#0BBCD4] animate-bounce" aria-hidden="true" />
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
