'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { WavePath } from '@/components/ui/wave-path'
import { FolderX, ShieldAlert, FileWarning, HelpCircle } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const pains = [
  {
    icon: FolderX,
    title: 'Falta de organização administrativa',
    desc: 'Documentos espalhados, prazos perdidos e processos manuais que consomem tempo valioso do seu negócio.',
  },
  {
    icon: ShieldAlert,
    title: 'Insegurança previdenciária',
    desc: 'Dúvidas sobre contribuições, INSS e benefícios que deixam você vulnerável a problemas futuros.',
  },
  {
    icon: FileWarning,
    title: 'Burocracia fiscal sufocante',
    desc: 'Obrigações fiscais complexas e prazos constantes que drenam sua energia ao invés de ir para o negócio.',
  },
  {
    icon: HelpCircle,
    title: 'Impostos difíceis de entender',
    desc: 'Guias, DAS, DARF — uma sopa de letrinhas que gera confusão e pode resultar em multas desnecessárias.',
  },
]

/* ── Seção principal ── */
interface Props { onOpenLead: () => void }

export default function PainSection({ onOpenLead }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef  = useScrollAnimation()

  return (
    <section
      id="dores"
      ref={sectionRef}
      className="relative pt-24 pb-20 bg-white overflow-hidden"
      aria-labelledby="pain-heading"
    >
      {/* Spotlight suave */}
      <MouseSpotlight containerRef={sectionRef} />

      {/* Partículas */}
      <FloatingDots containerRef={sectionRef} />

      {/* Conteúdo — fica acima dos efeitos */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={scrollRef}>

        {/* Cabeçalho */}
        <div className="mb-4 animate-on-scroll">
          <div className="teal-line" />
          <h2 id="pain-heading" className="text-4xl sm:text-5xl font-black text-[#0f0e1a] leading-tight">
            Entendemos os desafios<br />que pesam no seu dia a dia
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl text-lg">
            Sabemos que gerir uma empresa vai muito além do core business.
          </p>
        </div>

        {/* Wave interativa */}
        <div className="flex flex-col items-center my-12 animate-on-scroll delay-100">
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-2 select-none">
            passe o mouse na linha abaixo
          </p>
          <div className="w-full text-[#0BBCD4]">
            <WavePath />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between w-full gap-4">
            <p className="text-gray-400 text-sm italic max-w-xs leading-relaxed">
              — a corda que segura seu negócio não pode ser a burocracia.
            </p>
            <p className="text-[#0f0e1a] text-2xl sm:text-3xl font-black leading-tight text-right max-w-lg">
              A Nauta corta o nó e te deixa livre<br />
              <span className="text-[#0BBCD4]">para focar no que importa.</span>
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pains.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="rounded-2xl p-7 animate-flip backdrop-blur-sm group flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0BBCD4]/10"
              style={{
                transitionDelay: `${i * 100}ms`,
                background: 'linear-gradient(145deg, rgba(11,188,212,0.06) 0%, rgba(61,59,142,0.04) 100%)',
                border: '1px solid rgba(11,188,212,0.15)',
              }}
            >
              {/* Ícone grande centralizado */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, rgba(11,188,212,0.15), rgba(61,59,142,0.1))' }}
              >
                <Icon className="text-[#0BBCD4]" size={36} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-[#0f0e1a] mb-3 text-base leading-snug">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 animate-on-scroll">
          <button onClick={onOpenLead} className="btn-primary">
            Resolver isso agora
          </button>
        </div>
      </div>
    </section>
  )
}
