'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import FaqSection, { FaqItem } from '@/components/ui/faq-section'
import ServiceCTA from '@/components/ui/service-cta'
import { Landmark, CreditCard, UserCheck, FileText, Scale, Users, CheckCircle } from 'lucide-react'

const features = [
  { icon: CreditCard, title: 'Conta Bancária Eleitoral', desc: 'Abertura e gerenciamento da conta bancária exclusiva para a campanha, exigida pela legislação eleitoral.' },
  { icon: UserCheck, title: 'Registro de Candidatura', desc: 'Suporte ao registro junto ao TRE/TSE com toda a documentação contábil necessária.' },
  { icon: FileText, title: 'SPCE — Sistema de Prestação de Contas', desc: 'Gerenciamento completo do sistema oficial da Justiça Eleitoral, com lançamentos, conciliações e relatórios.' },
  { icon: Landmark, title: 'Receitas e Despesas Eleitorais', desc: 'Registro de todas as doações recebidas (Fundo Eleitoral, doações de pessoa física e do partido) e despesas da campanha.' },
  { icon: Scale, title: 'Prestação de Contas Final', desc: 'Elaboração e envio da prestação de contas final à Justiça Eleitoral dentro do prazo legal, minimizando riscos de reprovação.' },
  { icon: Users, title: 'Todos os Cargos e Eleições', desc: 'Atendemos candidatos a vereador, prefeito, deputado estadual e federal, senador, governador e presidente.' },
]

const cargos = ['Vereador', 'Prefeito', 'Deputado Estadual', 'Deputado Federal', 'Senador', 'Governador', 'Presidente']

const faqs: FaqItem[] = [
  {
    q: 'Quem precisa de contabilidade eleitoral?',
    a: 'Todo candidato que tiver receitas ou despesas de campanha é obrigado a prestar contas à Justiça Eleitoral, independentemente do cargo disputado ou do resultado nas urnas. Mesmo quem não foi eleito precisa apresentar a prestação de contas final.',
  },
  {
    q: 'Quando devo começar a contabilidade eleitoral?',
    a: 'O ideal é iniciar assim que ocorrer o registro da candidatura no TRE. As receitas e despesas devem ser registradas no SPCE desde o início da campanha. Começar tarde aumenta o risco de inconsistências que podem levar à reprovação das contas.',
  },
  {
    q: 'O que acontece se a prestação de contas for reprovada?',
    a: 'A reprovação pode gerar multa para o candidato, impossibilidade de receber recursos do Fundo Eleitoral em eleições futuras e, em casos graves de irregularidades, cassação do mandato. Por isso, a escolha de um contador eleitoral experiente é fundamental.',
  },
  {
    q: 'Vocês atendem candidatos de qualquer partido?',
    a: 'Sim. Atendemos candidatos de todos os partidos políticos, em qualquer estado do Brasil, para todos os cargos eletivos. Nosso trabalho é estritamente técnico e contábil, sem qualquer vinculação político-partidária.',
  },
  {
    q: 'Como funciona o atendimento durante a campanha?',
    a: 'Atribuímos um contador responsável dedicado à sua campanha. Durante o período eleitoral, o atendimento é prioritário por WhatsApp e videochamada. Você nos envia os comprovantes de receitas e despesas e cuidamos de todo o lançamento e conciliação no SPCE.',
  },
]

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true
        const duration = 1500
        const steps = 60
        const increment = target / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= target) {
            setCount(target)
            clearInterval(timer)
          } else {
            setCount(Math.floor(current))
          }
        }, duration / steps)
      }
    }, { threshold: 0.5 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function ContabilidadeEleitoralPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Especialidade Nauta"
          title={<>Contabilidade<br /><span style={{ color: '#0BBCD4' }}>Eleitoral</span> Especializada</>}
          description="+400 prestações de contas aprovadas na Justiça Eleitoral. Atendemos candidatos a todos os cargos em todo o Brasil."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Serviços' }, { label: 'Contabilidade Eleitoral' }]}
          stats={[{ value: '+400', label: 'prestações aprovadas' }, { value: 'Todos', label: 'os cargos' }, { value: 'Todo', label: 'o Brasil' }]}
          primaryCta={{ label: 'Solicitar proposta eleitoral', onClick: () => openLead('Contabilidade Eleitoral') }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/554899245194' }}
          purpleOrb
        />

        {/* Features — seção personalizada mantida */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black text-[#0f0e1a] mb-3" style={{ letterSpacing: '-0.02em' }}>O que está incluído</h2>
            <p className="text-gray-500 mb-12 max-w-2xl">Cobertura completa de todas as obrigações contábeis eleitorais exigidas pela Justiça Eleitoral.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(f => (
                <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-[#0BBCD4]/30 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                    <f.icon size={22} className="text-[#0BBCD4]" />
                  </div>
                  <h3 className="font-bold text-[#0f0e1a] mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contador animado + cargos — seção única mantida */}
        <section className="py-20" style={{ background: 'linear-gradient(135deg, #0a0918 0%, #111035 50%, #0f0e1a 100%)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <p className="text-6xl sm:text-7xl font-black mb-2" style={{ color: '#0BBCD4' }}>
                  +<AnimatedCounter target={400} />
                </p>
                <p className="text-gray-300 text-xl font-semibold mb-4">prestações de contas aprovadas</p>
                <p className="text-gray-500 leading-relaxed max-w-md">Mais de 400 candidatos confiaram à Nauta Contabilidade a gestão de suas campanhas eleitorais, com 100% das prestações aprovadas pela Justiça Eleitoral.</p>
              </div>
              <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-[#0BBCD4] font-bold text-sm uppercase tracking-widest mb-6">Cargos atendidos</p>
                <div className="space-y-3">
                  {cargos.map(cargo => (
                    <div key={cargo} className="flex items-center gap-3">
                      <CheckCircle size={15} className="text-[#0BBCD4] shrink-0" />
                      <span className="text-white/70 text-sm">{cargo}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-xs text-gray-500">Atendimento em todo o Brasil</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FaqSection
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre contabilidade eleitoral."
          items={faqs}
        />

        <ServiceCTA
          title="Sua campanha começa com contabilidade"
          subtitle="Evite reprovações e multas. Conte com especialistas que já aprovaram +400 prestações."
          onOpenLead={() => openLead('Contabilidade Eleitoral')}
          interest="Contabilidade Eleitoral"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
