'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'
import { DisplayCard } from '@/components/ui/display-cards'
import { BookOpen, Calculator, Users, Building2, BarChart3, TrendingUp, Vote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SparklesText } from '@/components/ui/sparkles-text'

const services = [
  {
    icon: <BookOpen className="text-[#0BBCD4]" size={20} />,
    title: 'Contábil',
    description: 'Escrituração contábil completa, balanços e demonstrações financeiras com precisão.',
    href: '/servicos/contabil',
  },
  {
    icon: <Calculator className="text-[#0BBCD4]" size={20} />,
    title: 'Fiscal',
    description: 'Apuração de impostos, entrega de obrigações acessórias e gestão tributária.',
    href: '/servicos/fiscal',
  },
  {
    icon: <Users className="text-[#0BBCD4]" size={20} />,
    title: 'Folha de Pagamento',
    description: 'Processamento da folha, eSocial, férias, 13º e encargos com total conformidade.',
    href: '/servicos/folha-de-pagamento',
  },
  {
    icon: <Building2 className="text-[#0BBCD4]" size={20} />,
    title: 'Legalização / Societário',
    description: 'Abertura, alteração e encerramento de empresas com agilidade e segurança.',
    href: '/servicos/legalizacao-societario',
  },
  {
    icon: <BarChart3 className="text-[#0BBCD4]" size={20} />,
    title: 'BPO Financeiro',
    description: 'Gestão financeira 100% interna: contas a pagar/receber, fluxo de caixa e conciliação.',
    href: '/servicos/bpo-financeiro',
  },
  {
    icon: <TrendingUp className="text-[#0BBCD4]" size={20} />,
    title: 'Planejamento Tributário',
    description: 'Estratégias legais para reduzir a carga tributária e maximizar os resultados.',
    href: '/servicos/planejamento-tributario',
  },
  {
    icon: <Vote className="text-white" size={20} />,
    title: 'Contabilidade Eleitoral',
    description: '+400 prestações aprovadas junto à Justiça Eleitoral. Nossa especialidade.',
    badge: 'Especialidade',
    highlight: true,
    href: '/servicos/contabilidade-eleitoral',
  },
]

// Divide em grupos de 3 (último grupo pode ter menos)
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

// Offsets do efeito stacked para cada posição dentro do grupo
const stackOffsets = [
  '[grid-area:stack] hover:-translate-y-32 grayscale hover:grayscale-0 before:absolute before:inset-0 before:rounded-2xl before:bg-[#0f0e1a]/60 before:content-[\'\'] hover:before:opacity-0 before:transition-opacity before:duration-500',
  '[grid-area:stack] translate-x-16 translate-y-12 hover:-translate-y-10 grayscale hover:grayscale-0 before:absolute before:inset-0 before:rounded-2xl before:bg-[#0f0e1a]/40 before:content-[\'\'] hover:before:opacity-0 before:transition-opacity before:duration-500',
  '[grid-area:stack] translate-x-32 translate-y-24 hover:translate-y-14',
]

interface Props { onOpenLead: (interest?: string) => void }

export default function ServicesSection({ onOpenLead }: Props) {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)
  const groups     = chunkArray(services, 3)

  return (
    <section id="servicos" ref={sectionRef} className="py-24 bg-[#0f0e1a] overflow-visible relative" aria-labelledby="services-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>

        {/* Cabeçalho */}
        <div className="mb-20 animate-on-scroll">
          <div className="teal-line" />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mt-0">
            <h2 id="services-heading" className="text-4xl sm:text-5xl leading-tight">
              <SparklesText
                text="Nossos serviços"
                className="text-4xl sm:text-5xl text-white"
                sparklesCount={12}
                colors={{ first: '#0BBCD4', second: '#7c6fff' }}
              />
            </h2>
            <div className="flex items-center gap-3 lg:mb-2">
              <div className="w-px h-10 bg-[#0BBCD4]" aria-hidden="true" />
              <p className="text-gray-400 text-base max-w-xs">
                Tudo que sua empresa precisa em um só lugar.
              </p>
            </div>
          </div>
        </div>

        {/* Grupos de DisplayCards */}
        <div className="flex flex-wrap justify-center gap-24 lg:gap-40" style={{ alignItems: 'flex-end' }}>
          {groups.map((group, gi) => (
            <div
              key={gi}
              className="grid [grid-template-areas:'stack'] place-items-center animate-on-scroll overflow-visible"
              style={{ transitionDelay: `${gi * 150}ms` }}
            >
              {group.map((svc, si) => {
                const isHighlight = (svc as typeof services[0]).highlight
                return (
                  <DisplayCard
                    key={svc.title}
                    icon={svc.icon}
                    title={svc.title}
                    description={svc.description}
                    badge={(svc as typeof services[0]).badge}
                    href={(svc as typeof services[0]).href}
                    className={cn(
                      stackOffsets[si] ?? stackOffsets[2],
                      'cursor-pointer',
                      isHighlight
                        ? 'border-[#0BBCD4]/40 bg-[#1a1830]'
                        : 'border-white/8 bg-[#13112a]',
                    )}
                    titleClassName={isHighlight ? 'text-white' : 'text-white'}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legenda */}
        <p className="text-center text-white/15 text-xs tracking-widest uppercase mt-20 select-none animate-on-scroll">
          clique em qualquer serviço para saber mais
        </p>

      </div>
    </section>
  )
}
