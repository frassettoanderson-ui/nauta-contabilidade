'use client'

/**
 * InnerHero — hero premium para páginas internas.
 * Aurora mesh com orbs animados, typography refinada, breadcrumb.
 */

import { useEffect, useRef, ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Crumb { label: string; href?: string }

interface Props {
  eyebrow?: string
  title: ReactNode        // pode ter <span> colorido
  description: string
  breadcrumbs?: Crumb[]
  stats?: { value: string; label: string }[]
  primaryCta?: { label: string; onClick: () => void }
  secondaryCta?: { label: string; href: string }
  accentColor?: string   // default #0BBCD4
  purpleOrb?: boolean    // adiciona orb roxo à direita
}

const WA_SVG = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

export default function InnerHero({
  eyebrow = 'Serviços Nauta',
  title,
  description,
  breadcrumbs = [],
  stats,
  primaryCta,
  secondaryCta,
  accentColor = '#0BBCD4',
  purpleOrb = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null)

  /* Parallax suave nos orbs */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const orb1 = section.querySelector<HTMLElement>('.hero-orb-1')
    const orb2 = section.querySelector<HTMLElement>('.hero-orb-2')
    const handler = (e: MouseEvent) => {
      const r = section.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width  - 0.5  // -0.5 → +0.5
      const ny = (e.clientY - r.top)  / r.height - 0.5
      if (orb1) orb1.style.transform = `translate(${nx * 24}px, ${ny * 18}px)`
      if (orb2) orb2.style.transform = `translate(${-nx * 18}px, ${-ny * 14}px)`
    }
    section.addEventListener('mousemove', handler, { passive: true })
    return () => section.removeEventListener('mousemove', handler)
  }, [])

  const accentRgb = accentColor === '#0BBCD4' ? '11,188,212' : '124,111,255'

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20"
      style={{ background: '#0a0918' }}
    >
      {/* ── Grid de linhas sutis ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 100%)',
        }}
      />

      {/* ── Orb teal (esquerda/cima) ── */}
      <div
        className="hero-orb-1 absolute pointer-events-none transition-transform duration-700 ease-out"
        aria-hidden="true"
        style={{
          top: '-10%', left: '10%',
          width: 600, height: 500,
          background: `radial-gradient(ellipse, rgba(${accentRgb},0.12) 0%, transparent 70%)`,
          filter: 'blur(1px)',
          animation: 'orbFloat1 14s ease-in-out infinite',
        }}
      />

      {/* ── Orb roxo (direita/baixo) ── */}
      {purpleOrb && (
        <div
          className="hero-orb-2 absolute pointer-events-none transition-transform duration-700 ease-out"
          aria-hidden="true"
          style={{
            bottom: '-5%', right: '5%',
            width: 500, height: 400,
            background: 'radial-gradient(ellipse, rgba(124,111,255,0.10) 0%, transparent 70%)',
            filter: 'blur(1px)',
            animation: 'orbFloat2 18s ease-in-out infinite',
          }}
        />
      )}

      {/* ── Grain noise overlay ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]" aria-hidden="true"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-700">/</span>}
                {c.href
                  ? <Link href={c.href} className="hover:text-[#0BBCD4] transition-colors duration-150">{c.label}</Link>
                  : <span className="text-gray-300">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}

        {/* Eyebrow */}
        <div className="mb-5 animate-[heroFadeUp_0.6s_ease-out_both]">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full"
            style={{
              color: accentColor,
              background: `rgba(${accentRgb},0.08)`,
              border: `1px solid rgba(${accentRgb},0.22)`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
            {eyebrow}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] sm:leading-[1.0] mb-6 animate-[heroFadeUp_0.6s_0.1s_ease-out_both]"
          style={{ letterSpacing: '-0.03em' }}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-2xl animate-[heroFadeUp_0.6s_0.2s_ease-out_both]"
          style={{ lineHeight: '1.7' }}
        >
          {description}
        </p>

        {/* CTAs */}
        {(primaryCta || secondaryCta) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-14 animate-[heroFadeUp_0.6s_0.3s_ease-out_both]">
            {primaryCta && (
              <button
                onClick={primaryCta.onClick}
                className="group inline-flex items-center gap-2 px-7 py-3.5 font-bold text-sm text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  boxShadow: `0 8px 28px rgba(${accentRgb},0.28)`,
                }}
              >
                {primaryCta.label}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-sm text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}
              >
                {WA_SVG}
                {secondaryCta.label}
              </a>
            )}
          </div>
        )}

        {/* Stats row */}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-x-10 gap-y-4 animate-[heroFadeUp_0.6s_0.4s_ease-out_both]">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-2xl font-black text-white" style={{ color: accentColor }}>{s.value}</span>
                <span className="text-xs text-gray-500 mt-0.5">{s.label}</span>
              </div>
            ))}
            {/* Dividers */}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -15px) scale(1.04); }
          66%       { transform: translate(-10px, 10px) scale(0.97); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-18px, 12px) scale(1.05); }
          70%       { transform: translate(10px, -8px) scale(0.96); }
        }
      `}</style>
    </section>
  )
}
