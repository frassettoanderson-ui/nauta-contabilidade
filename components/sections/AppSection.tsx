'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { FileText, Bell, MessageSquare, CheckCircle } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const features = [
  { icon: FileText,      label: 'Documentos e relatórios na palma da mão' },
  { icon: Bell,          label: 'Notificações de vencimentos e obrigações' },
  { icon: MessageSquare, label: 'Chat direto com seu contador' },
  { icon: CheckCircle,   label: 'Acompanhamento em tempo real' },
]

export default function AppSection() {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section id="app" ref={sectionRef} className="py-24 section-darker relative overflow-hidden" aria-labelledby="app-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />

      {/* Fundo gradiente decorativo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(11,188,212,0.05) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(61,59,142,0.07) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Coluna esquerda: texto ── */}
          <div className="animate-from-left">
            <div className="mb-6">
              <Image src="/logo-branca.png" alt="Nauta Contabilidade" width={160} height={46} className="h-9 w-auto object-contain" />
            </div>

            <span className="inline-block text-[#0BBCD4] font-semibold text-xs uppercase tracking-widest mb-3"
              style={{ background: 'rgba(11,188,212,0.08)', border: '1px solid rgba(11,188,212,0.2)', borderRadius: '99px', padding: '4px 14px' }}>
              Tecnologia a seu favor
            </span>

            <h2 id="app-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-4 mb-5 leading-tight">
              Sua contabilidade<br />
              <span className="text-[#0BBCD4]">no bolso.</span>
            </h2>

            <p className="text-gray-400 leading-relaxed mb-8 text-base max-w-md">
              Tenha total controle da sua empresa pelo celular. Acesse documentos, acompanhe obrigações e fale com seu contador onde estiver.
            </p>

            <ul className="space-y-3 mb-10">
              {features.map(({ icon: Icon, label }, i) => (
                <li key={label}
                  className="flex items-center gap-3 animate-from-left"
                  style={{ transitionDelay: `${200 + i * 80}ms` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{ background: 'rgba(11,188,212,0.10)', border: '1px solid rgba(11,188,212,0.20)' }}>
                    <Icon size={16} className="text-[#0BBCD4]" aria-hidden="true" />
                  </div>
                  <span className="text-gray-300 text-sm">{label}</span>
                </li>
              ))}
            </ul>

            {/* Store buttons */}
            <div className="flex flex-col sm:flex-row gap-3 animate-from-left delay-600">
              <a href="https://vip.acessorias.com/nautacontabilidade" target="_blank" rel="noopener noreferrer" aria-label="Baixar na App Store"
                className="group flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(11,188,212,0.08)'; e.currentTarget.style.border='1px solid rgba(11,188,212,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.12)' }}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="text-xs text-gray-400 leading-none">Disponível na</p>
                  <p className="font-bold text-sm text-white leading-tight">App Store</p>
                </div>
              </a>

              <a href="https://play.google.com/store/apps/details?id=com.nautacontabilidade&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" aria-label="Baixar no Google Play"
                className="group flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(11,188,212,0.08)'; e.currentTarget.style.border='1px solid rgba(11,188,212,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.12)' }}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0" aria-hidden="true">
                  <path d="M3.18 23.76c.35.2.74.24 1.12.1L15.34 12 12 8.66 3.18 23.76zM20.46 10.53l-2.6-1.49-3.22 3.22 3.22 3.22 2.6-1.49c.75-.43.75-1.5 0-1.93l-.0-.53zM2.04 1.21C1.77 1.5 1.6 1.93 1.6 2.46v19.08c0 .53.17.96.44 1.25L12 12 2.04 1.21zM15.34 12L4.3.14c-.38-.14-.77-.1-1.12.1L12 12l3.34 0z"/>
                </svg>
                <div>
                  <p className="text-xs text-gray-400 leading-none">Disponível no</p>
                  <p className="font-bold text-sm text-white leading-tight">Google Play</p>
                </div>
              </a>
            </div>
          </div>

          {/* ── Coluna direita: imagem do celular ── */}
          <div className="relative flex justify-center items-center animate-from-right delay-300">

            {/* Glow de fundo em camadas */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div className="w-72 h-72 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(11,188,212,0.18) 0%, rgba(61,59,142,0.10) 50%, transparent 80%)' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div className="w-48 h-48 rounded-full blur-2xl"
                style={{ background: 'rgba(11,188,212,0.12)', animation: 'floatGlow 4s ease-in-out infinite' }} />
            </div>

            {/* Imagem do celular com float animation */}
            <div
              className="relative z-10"
              style={{ animation: 'floatPhone 4s ease-in-out infinite' }}
            >
              <Image
                src="/app-mockup.png"
                alt="App Nauta Contabilidade"
                width={320}
                height={640}
                className="w-auto max-w-xs lg:max-w-sm object-contain drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 40px 80px rgba(11,188,212,0.25)) drop-shadow(0 20px 40px rgba(0,0,0,0.6))',
                }}
                priority
              />
            </div>

            {/* Badge flutuante: avaliação */}
            <div
              className="absolute top-8 -left-4 lg:-left-8 z-20 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm"
              style={{
                background: 'rgba(15,14,26,0.85)',
                border: '1px solid rgba(11,188,212,0.25)',
                animation: 'floatBadge1 5s ease-in-out infinite',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 fill-yellow-400" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className="text-white text-xs font-bold">5,0</span>
              <span className="text-gray-400 text-xs">Google Play</span>
            </div>

            {/* Badge flutuante: clientes */}
            <div
              className="absolute bottom-12 -right-4 lg:-right-8 z-20 px-3 py-2 rounded-xl backdrop-blur-sm"
              style={{
                background: 'rgba(15,14,26,0.85)',
                border: '1px solid rgba(61,59,142,0.35)',
                animation: 'floatBadge2 5s ease-in-out infinite',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <p className="text-[#0BBCD4] font-black text-base leading-none">400+</p>
              <p className="text-gray-400 text-xs mt-0.5">Clientes ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes floatPhone {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(-1deg); }
        }
        @keyframes floatGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.2); opacity: 1; }
        }
        @keyframes floatBadge1 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes floatBadge2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(6px); }
        }
      `}</style>
    </section>
  )
}
