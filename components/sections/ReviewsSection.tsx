'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Star, Quote } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const reviews = [
  {
    name:   'Isadora Goerdt',
    time:   'Há 4 dias',
    text:   'A Nauta é uma contabilidade extremamente acolhedora e parceira, os profissionais são excelentes, atualizados e prestativos.',
    stars:  5,
    badge:  'Recente',
  },
  {
    name:   'Tiago Evaldt',
    time:   'Há 2 semanas',
    text:   'Anderson me passou a confiança que precisa para fechar negócio. Atendimento e preço diferenciado.',
    stars:  5,
    badge:  'Local Guide',
  },
  {
    name:   'Renata Schilling',
    time:   'Há 3 semanas',
    text:   'Precisei do serviço, foram super atenciosos e rápidos, super recomendo.',
    stars:  5,
  },
  {
    name:   'Janailson da Silva',
    time:   'Há 3 semanas',
    text:   'Para quem, como eu, está empreendendo pela primeira vez, ter esse suporte paciente e transparente faz toda a diferença.',
    stars:  5,
  },
  {
    name:   'Hiago Souza',
    time:   'Há 4 semanas',
    text:   'Excelente o atendimento.',
    stars:  5,
  },
  {
    name:   'Karina Andressa',
    time:   'Há 5 semanas',
    text:   'Atendimento super rápido e muito atencioso.',
    stars:  5,
  },
  {
    name:   'Asirlei Martins',
    time:   'Há 5 semanas',
    text:   'Super recomendo!! Muito bem atendida! Parabéns.',
    stars:  5,
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />
      ))}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const colors   = [
    'bg-[#0BBCD4]/20 text-[#0BBCD4]',
    'bg-[#3D3B8E]/30 text-purple-300',
    'bg-emerald-500/20 text-emerald-400',
    'bg-orange-500/20 text-orange-400',
    'bg-pink-500/20 text-pink-400',
    'bg-blue-500/20 text-blue-400',
    'bg-teal-500/20 text-teal-400',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

export default function ReviewsSection() {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section id="avaliacoes" ref={sectionRef} className="py-24 section-dark overflow-hidden relative" aria-labelledby="reviews-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>

        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14 animate-on-scroll">
          <div>
            <div className="teal-line" />
            <h2 id="reviews-heading" className="text-4xl sm:text-5xl font-black text-white leading-tight">
              O que nossos clientes<br />estão dizendo
            </h2>
          </div>

          {/* Nota geral Google */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg px-6 py-4 lg:mb-2 w-fit">
            <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-2xl font-black text-white">5,0</span>
                <StarRating count={5} />
              </div>
              <p className="text-gray-400 text-xs">{reviews.length} avaliações no Google</p>
            </div>
          </div>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reviews.map((review, i) => (
            <div
              key={review.name}
              className="relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-[#0BBCD4]/30 rounded-lg p-5 transition-all duration-300 flex flex-col animate-zoom-in"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Quote decorativo */}
              <Quote size={20} className="text-[#0BBCD4]/30 mb-3" aria-hidden="true" />

              {/* Texto */}
              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-4">
                "{review.text}"
              </p>

              {/* Footer do card */}
              <div className="border-t border-white/10 pt-4 flex items-center gap-3">
                <Avatar name={review.name} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm truncate">{review.name}</p>
                    {review.badge && (
                      <span className="text-[10px] bg-[#0BBCD4]/15 text-[#0BBCD4] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                        {review.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating count={review.stars} />
                    <span className="text-gray-500 text-xs">{review.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Link Google */}
        <div className="text-center mt-10 animate-on-scroll delay-400">
          <a
            href="https://g.page/r/nautacontabilidade/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/15 hover:border-[#0BBCD4]/50 text-gray-400 hover:text-white text-sm font-medium px-6 py-3 rounded transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Ver todas as avaliações no Google
          </a>
        </div>
      </div>
    </section>
  )
}
