'use client'

/**
 * ServiceCTA — seção CTA final premium para páginas de serviço.
 * Fundo mesh animado, aurora orbs, trust badges.
 */

import { ArrowRight, MessageCircle, Shield, Clock, Star } from 'lucide-react'

interface Props {
  title?: string
  subtitle?: string
  onOpenLead: () => void
  accent?: string
  interest?: string
}

const trust = [
  { icon: Shield, label: 'Sem compromisso' },
  { icon: Clock,  label: 'Resposta em 24h' },
  { icon: Star,   label: '+400 empresas atendidas' },
]

export default function ServiceCTA({
  title = 'Pronto para começar?',
  subtitle = 'Fale com um especialista e receba uma proposta personalizada sem compromisso.',
  onOpenLead,
  accent = '#0BBCD4',
  interest,
}: Props) {
  const accentRgb = accent === '#0BBCD4' ? '11,188,212' : '124,111,255'

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#050412', padding: '5rem 0' }}
    >
      {/* Mesh animado */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 50%, rgba(${accentRgb},0.09) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 50%, rgba(61,59,142,0.09) 0%, transparent 60%)
          `,
          animation: 'ctaMeshShift 12s ease-in-out infinite alternate',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">

        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
          style={{
            color: accent,
            background: `rgba(${accentRgb},0.08)`,
            border: `1px solid rgba(${accentRgb},0.2)`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          Consultoria gratuita
        </div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          {title}
        </h2>
        <p className="text-gray-400 text-base mb-10 leading-relaxed">{subtitle}</p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <button
            onClick={() => onOpenLead()}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
              boxShadow: `0 8px 32px rgba(${accentRgb},0.30)`,
            }}
          >
            {interest ? `Solicitar proposta — ${interest}` : 'Solicitar proposta gratuita'}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a
            href="https://wa.me/554899245194"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-sm text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
          >
            <MessageCircle size={16} />
            Falar no WhatsApp
          </a>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {trust.map(t => (
            <div key={t.label} className="flex items-center gap-1.5 text-gray-500 text-xs">
              <t.icon size={13} style={{ color: accent }} />
              {t.label}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ctaMeshShift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </section>
  )
}
