'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { ArrowRight, Clock, BookOpen } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const posts = [
  {
    slug:     'mei-ou-simples-nacional',
    category: 'Regimes Tributários',
    title:    'MEI ou Simples Nacional: qual é o melhor para o seu negócio?',
    excerpt:  'Entenda as diferenças entre os regimes e descubra qual deles pode gerar mais economia para a sua empresa em 2024.',
    date:     '12 Mar 2024',
    readTime: '5 min',
    accent:   '#0BBCD4',
    gradient: 'linear-gradient(135deg, rgba(11,188,212,0.15) 0%, rgba(61,59,142,0.20) 100%)',
    icon:     '📊',
  },
  {
    slug:     'o-que-e-bpo-financeiro',
    category: 'BPO Financeiro',
    title:    'O que é BPO Financeiro e por que sua empresa precisa disso',
    excerpt:  'Terceirizar a gestão financeira pode transformar a saúde do seu negócio. Veja como funciona e quais são os benefícios.',
    date:     '28 Fev 2024',
    readTime: '4 min',
    accent:   '#0BBCD4',
    gradient: 'linear-gradient(135deg, rgba(11,188,212,0.18) 0%, rgba(11,188,212,0.05) 100%)',
    icon:     '💼',
  },
  {
    slug:     'contabilidade-eleitoral-passo-a-passo',
    category: 'Contabilidade Eleitoral',
    title:    'Contabilidade Eleitoral: tudo o que você precisa saber antes de se candidatar',
    excerpt:  'Quais são as obrigações contábeis de candidatos? Veja o passo a passo completo para não ter problemas com a Justiça Eleitoral.',
    date:     '15 Fev 2024',
    readTime: '7 min',
    accent:   '#7c6fff',
    gradient: 'linear-gradient(135deg, rgba(124,111,255,0.18) 0%, rgba(61,59,142,0.12) 100%)',
    icon:     '🗳️',
  },
]

export default function BlogSection() {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section id="blog" ref={sectionRef} className="py-24 section-dark relative overflow-hidden" aria-labelledby="blog-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />

      {/* Orb decorativo */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse, rgba(124,111,255,0.05) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-14 animate-from-left">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.25)' }}>
                <BookOpen size={14} className="text-[#0BBCD4]" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#0BBCD4' }}>
                Conteúdo gratuito
              </span>
            </div>
            <h2 id="blog-heading" className="text-4xl sm:text-5xl font-black text-white leading-tight"
              style={{ letterSpacing: '-0.02em' }}>
              Blog da Nauta.
            </h2>
            <p className="text-gray-400 mt-2 text-base">Conhecimento contábil direto ao ponto.</p>
          </div>

          <Link
            href="/blog"
            className="flex items-center gap-2 font-bold text-sm transition-all duration-200 hover:gap-3 shrink-0"
            style={{ color: '#0BBCD4' }}
          >
            Ver todos os artigos
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map(({ slug, category, title, excerpt, date, readTime, accent, gradient }, i) => (
            <Link
              key={slug}
              href={`/blog/${slug}`}
              className={`group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 ${i === 0 ? 'animate-from-left' : i === 1 ? 'animate-zoom-in' : 'animate-from-right'}`}
              style={{
                transitionDelay: `${i * 100}ms`,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.border = `1px solid ${accent === '#0BBCD4' ? 'rgba(11,188,212,0.3)' : 'rgba(124,111,255,0.3)'}`
                el.style.boxShadow = accent === '#0BBCD4'
                  ? '0 24px 64px rgba(11,188,212,0.12), 0 4px 20px rgba(0,0,0,0.4)'
                  : '0 24px 64px rgba(124,111,255,0.12), 0 4px 20px rgba(0,0,0,0.4)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.border = '1px solid rgba(255,255,255,0.07)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* Header do card — área visual de destaque */}
              <div className="relative h-40 flex items-end p-5 overflow-hidden" style={{ background: gradient }}>
                {/* Glow no fundo */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${accent}22 0%, transparent 70%)` }}
                  aria-hidden="true" />

                {/* Linhas decorativas */}
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" aria-hidden="true">
                  <svg viewBox="0 0 128 128" fill="none" className="w-full h-full opacity-10">
                    <circle cx="96" cy="32" r="48" stroke="white" strokeWidth="1"/>
                    <circle cx="96" cy="32" r="72" stroke="white" strokeWidth="0.5"/>
                  </svg>
                </div>

                {/* Categoria pill */}
                <span className="relative z-10 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: accent === '#0BBCD4' ? 'rgba(11,188,212,0.18)' : 'rgba(124,111,255,0.18)',
                    color: accent,
                    border: `1px solid ${accent === '#0BBCD4' ? 'rgba(11,188,212,0.35)' : 'rgba(124,111,255,0.35)'}`,
                    backdropFilter: 'blur(8px)',
                  }}>
                  {category}
                </span>
              </div>

              {/* Corpo do card */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-white text-sm leading-snug mb-2.5 transition-colors duration-200 group-hover:text-[#0BBCD4]"
                  style={{ letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed flex-1 mb-4">{excerpt}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <span>{date}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" aria-hidden="true" />
                    <Clock size={11} aria-hidden="true" />
                    <span>{readTime} de leitura</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
                    style={{ color: accent }}>
                    Ler <ArrowRight size={11} />
                  </div>
                </div>
              </div>

              {/* Linha de destaque na base */}
              <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-500 ease-out"
                style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
                aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
