'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import ServiceCTA from '@/components/ui/service-cta'
import { ArrowRight, Store, Briefcase, Stethoscope, Code, Rocket, ShoppingCart, User, Building } from 'lucide-react'

const segments = [
  {
    num: '01',
    icon: User,
    title: 'MEI',
    subtitle: 'Microempreendedor Individual',
    desc: 'Da formalização à gestão, ajudamos o MEI a crescer com organização. Incluindo análise para migração ao Simples Nacional quando necessário.',
    tags: ['DAS MEI', 'DASN-SIMEI', 'Faturamento anual até R$ 81 mil', 'Migração para LTDA'],
  },
  {
    num: '02',
    icon: Store,
    title: 'Simples Nacional',
    subtitle: 'Micro e Pequenas Empresas',
    desc: 'Contabilidade consultiva para MPE com foco em redução da carga tributária, controle financeiro e relatórios gerenciais mensais.',
    tags: ['Faturamento até R$ 4,8 mi/ano', 'Todos os anexos', 'Fator R', 'Apuração mensal'],
  },
  {
    num: '03',
    icon: Building,
    title: 'Lucro Presumido',
    subtitle: 'Empresas em crescimento',
    desc: 'Para empresas que superaram o limite do Simples ou onde o Lucro Presumido é mais vantajoso. Gestão completa de IRPJ, CSLL, PIS e COFINS.',
    tags: ['IRPJ 15% + Adicional 10%', 'CSLL 9%', 'PIS/COFINS cumulativo', 'ECF anual'],
  },
  {
    num: '04',
    icon: Briefcase,
    title: 'Profissionais Liberais',
    subtitle: 'Médicos, advogados, engenheiros e outros',
    desc: 'Contabilidade especializada para profissionais liberais com foco em otimização tributária via PJ, INSS, pró-labore e distribuição de lucros.',
    tags: ['Clínicas', 'Escritórios', 'Consultórios', 'Sociedades profissionais'],
  },
  {
    num: '05',
    icon: ShoppingCart,
    title: 'Comércio e E-commerce',
    subtitle: 'Varejo físico e digital',
    desc: 'Gestão fiscal do ICMS, substituição tributária, emissão de notas e controle de estoque para comércios físicos e lojas online.',
    tags: ['ICMS / DIFAL', 'Substituição tributária', 'NF-e', 'Marketplaces'],
  },
  {
    num: '06',
    icon: Code,
    title: 'Tecnologia e Marketing Digital',
    subtitle: 'Startups, SaaS, agências',
    desc: 'Entendemos o modelo de negócio digital. Otimização via ISS, regime tributário adequado e relatórios que fazem sentido para empresas de tech.',
    tags: ['ISS digital', 'SaaS', 'Influenciadores PJ', 'Agências digitais'],
  },
  {
    num: '07',
    icon: Stethoscope,
    title: 'Saúde',
    subtitle: 'Clínicas, consultórios e laboratórios',
    desc: 'Contabilidade especializada para o setor de saúde, incluindo registro em conselhos de classe, ISS médico e gestão de sociedades.',
    tags: ['CRM / CRO / CFM', 'ISS Saúde', 'Clínicas LTDA', 'Cooperativas'],
  },
  {
    num: '08',
    icon: Rocket,
    title: 'Startups e Inovação',
    subtitle: 'Empresas de alto crescimento',
    desc: 'Suporte contábil e societário para startups em fase de tração, captação e escala. Relatórios para investidores e due diligence.',
    tags: ['Due diligence', 'Captação de investimento', 'Stock options', 'Holding'],
  },
]

export default function QuemAtendemos() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Quem atendemos"
          title={<>Atendemos empresas<br /><span style={{ color: '#0BBCD4' }}>de todo o Brasil</span></>}
          description="Da startup ao estabelecimento consolidado: contabilidade consultiva e digital para todos os regimes e segmentos."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Quem Atendemos' }]}
          stats={[{ value: '+500', label: 'clientes ativos' }, { value: '27', label: 'estados atendidos' }, { value: '10+', label: 'anos de experiência' }]}
          primaryCta={{ label: 'Falar com um especialista', onClick: () => openLead() }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/554899245194' }}
        />

        {/* Segmentos */}
        <section className="py-20 section-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Segmentos que atendemos</h2>
              <p className="text-gray-400 max-w-2xl">Temos expertise em diferentes regimes e setores para oferecer a melhor contabilidade para cada tipo de negócio.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {segments.map(s => (
                <div key={s.title} className="p-8 rounded-2xl transition-all hover:-translate-y-px"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start gap-5">
                    <div className="shrink-0">
                      <p className="text-4xl font-black leading-none mb-3" style={{ color: 'rgba(11,188,212,0.25)' }}>{s.num}</p>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(11,188,212,0.1)', border: '1px solid rgba(11,188,212,0.2)' }}>
                        <s.icon size={20} className="text-[#0BBCD4]" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-white text-lg leading-tight">{s.title}</h3>
                      <p className="text-[#0BBCD4] text-sm font-medium mb-3">{s.subtitle}</p>
                      <p className="text-gray-400 text-sm leading-relaxed mb-4">{s.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {s.tags.map(tag => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nacional */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block text-[#0BBCD4] font-bold text-xs uppercase tracking-widest mb-4 px-3 py-1 rounded-full" style={{ background: 'rgba(11,188,212,0.08)', border: '1px solid rgba(11,188,212,0.2)' }}>
                  100% Digital
                </span>
                <h2 className="text-3xl font-black text-[#0f0e1a] mb-6" style={{ letterSpacing: '-0.02em' }}>
                  Contabilidade sem fronteiras
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Desde 2013 atendemos empresas de todo o Brasil de forma 100% digital. Você está em São Paulo, Manaus, Recife ou Florianópolis — não importa. Nosso processo é inteiramente online e o atendimento acontece por WhatsApp, videochamada e portal digital.
                </p>
                <ul className="space-y-3">
                  {[
                    'Reuniões por videochamada em qualquer horário',
                    'Documentos enviados digitalmente, sem papel',
                    'Portal online para acompanhar sua contabilidade',
                    'Atendimento ágil via WhatsApp',
                    'Certidões e obrigações acessórias em dia em qualquer estado',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <ArrowRight size={14} className="text-[#0BBCD4] shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(135deg, #0f0e1a 0%, #1a1830 100%)' }}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '+13', label: 'anos de experiência' },
                    { value: '+400', label: 'prestações eleitorais aprovadas' },
                    { value: '100%', label: 'digital e online' },
                    { value: 'Brasil', label: 'atendimento em todo o país' },
                  ].map(stat => (
                    <div key={stat.label} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-3xl font-black mb-1" style={{ color: '#0BBCD4' }}>{stat.value}</p>
                      <p className="text-gray-400 text-xs leading-snug">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <ServiceCTA
          title="Seu segmento está aqui. Vamos conversar?"
          subtitle="Fale com um especialista e receba uma proposta personalizada para o seu tipo de negócio."
          onOpenLead={() => openLead()}
          interest="Quem Atendemos"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
