'use client'

/**
 * FeaturesGrid — grade de features/serviços premium.
 * Cards com number badge, hover glow, stagger entrance, border animada.
 */

import { useRef, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  desc: string
  accent?: string   // override da cor de accent
}

interface Props {
  title?: string
  subtitle?: string
  features: Feature[]
  accent?: string   // '#0BBCD4' | '#7c6fff'
  cols?: 2 | 3      // default 3
  dark?: boolean    // seção dark (default false = white)
}

function useStaggerReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.feat-card'))
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = cards.indexOf(entry.target as HTMLElement)
          ;(entry.target as HTMLElement).style.transitionDelay = `${idx * 60}ms`
          ;(entry.target as HTMLElement).classList.add('feat-visible')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })
    cards.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [ref])
}

export default function FeaturesGrid({
  title = 'O que está incluído',
  subtitle,
  features,
  accent = '#0BBCD4',
  cols = 3,
  dark = false,
}: Props) {
  const gridRef = useRef<HTMLElement>(null)
  useStaggerReveal(gridRef as React.RefObject<HTMLElement>)

  const accentRgb = accent === '#0BBCD4' ? '11,188,212' : '124,111,255'

  const bg  = dark ? '#0f0e1a'  : '#ffffff'
  const bgAlt = dark ? '#0a0918' : '#f9fafb'
  const headColor = dark ? '#ffffff' : '#0f0e1a'
  const subColor  = dark ? '#9ca3af' : '#6b7280'
  const cardBg    = dark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const cardBorderIdle = dark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const descColor = dark ? '#9ca3af' : '#6b7280'
  const titleColor = dark ? '#f3f4f6' : '#111827'
  const numColor   = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'

  const gridClass = cols === 2
    ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'

  return (
    <section
      ref={gridRef as React.RefObject<HTMLElement>}
      style={{ background: bg, padding: '5rem 0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-12">
            {title && (
              <h2
                className="text-3xl sm:text-4xl font-black mb-3"
                style={{ color: headColor, letterSpacing: '-0.025em' }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="max-w-2xl text-base leading-relaxed" style={{ color: subColor }}>
                {subtitle}
              </p>
            )}
            {/* Linha decorativa */}
            <div className="mt-5 flex gap-1.5">
              <div className="h-0.5 w-10 rounded-full" style={{ background: accent }} />
              <div className="h-0.5 w-4 rounded-full" style={{ background: `rgba(${accentRgb},0.3)` }} />
              <div className="h-0.5 w-2 rounded-full" style={{ background: `rgba(${accentRgb},0.15)` }} />
            </div>
          </div>
        )}

        {/* Grid */}
        <div className={gridClass}>
          {features.map((f, i) => {
            const cardAccent = f.accent || accent
            const cardAccentRgb = cardAccent === '#0BBCD4' ? '11,188,212' : '124,111,255'
            return (
              <div
                key={f.title}
                className="feat-card group relative rounded-2xl p-6 flex flex-col overflow-hidden cursor-default"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorderIdle}`,
                  opacity: 0,
                  transform: 'translateY(20px)',
                  transition: 'opacity 0.5s ease-out, transform 0.5s ease-out, border-color 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = `rgba(${cardAccentRgb},0.35)`
                  el.style.boxShadow = `0 16px 48px rgba(${cardAccentRgb},0.10), 0 4px 16px rgba(0,0,0,0.15)`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = cardBorderIdle
                  el.style.boxShadow = 'none'
                }}
              >
                {/* Number badge */}
                <span
                  className="absolute top-5 right-5 text-4xl font-black leading-none select-none pointer-events-none"
                  style={{ color: numColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Glow no hover */}
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
                  style={{ background: `rgba(${cardAccentRgb},0.15)` }}
                />

                {/* Ícone */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 shrink-0"
                  style={{
                    background: `rgba(${cardAccentRgb},0.09)`,
                    border: `1px solid rgba(${cardAccentRgb},0.18)`,
                  }}
                >
                  <f.icon size={20} style={{ color: cardAccent }} />
                </div>

                <h3
                  className="font-bold text-sm leading-snug mb-2.5 transition-colors duration-200"
                  style={{ color: titleColor, letterSpacing: '-0.01em' }}
                >
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed flex-1" style={{ color: descColor }}>
                  {f.desc}
                </p>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
                  style={{ background: `linear-gradient(to right, ${cardAccent}, transparent)` }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .feat-card.feat-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  )
}
