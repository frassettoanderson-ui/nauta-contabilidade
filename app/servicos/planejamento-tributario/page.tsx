'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import FeaturesGrid, { Feature } from '@/components/ui/features-grid'
import FaqSection, { FaqItem } from '@/components/ui/faq-section'
import ServiceCTA from '@/components/ui/service-cta'
import { Target, TrendingDown, Building2, Landmark, Search, Gift } from 'lucide-react'


const features: Feature[] = [
  { icon: Target,       title: 'Análise de Regime Tributário',  desc: 'Comparativo anual entre Simples Nacional, Lucro Presumido e Lucro Real para identificar o regime mais vantajoso.' },
  { icon: TrendingDown, title: 'Elisão Fiscal',                 desc: 'Estratégias legais para redução da carga tributária: escolha correta de CNAE, aproveitamento de créditos e incentivos.' },
  { icon: Building2,    title: 'Reorganização Societária',      desc: 'Reestruturação do modelo societário para otimização fiscal: holdings, separação de atividades, participações.' },
  { icon: Landmark,     title: 'Holdings e Patrimônio',         desc: 'Constituição de holding patrimonial para proteção de bens, planejamento sucessório e eficiência tributária.' },
  { icon: Search,       title: 'Créditos Tributários',          desc: 'Levantamento de créditos tributários não aproveitados: PIS/COFINS, ICMS, IR pago a maior.' },
  { icon: Gift,         title: 'Incentivos Fiscais',            desc: 'Identificação de incentivos estaduais e municipais disponíveis para o setor de atuação da empresa.' },
]

const faqs: FaqItem[] = [
  { q: 'Qual a diferença entre elisão e evasão fiscal?', a: 'Elisão fiscal é a redução legal da carga tributária por meio de estratégias permitidas pela lei — é o que fazemos. Evasão fiscal é a sonegação, ou seja, omitir receitas ou falsificar documentos para pagar menos impostos, o que é crime. Nosso trabalho é 100% dentro da lei.' },
  { q: 'Quando devo fazer o planejamento tributário?', a: 'O ideal é realizar o planejamento em outubro ou novembro para o ano seguinte, pois a opção pelo regime tributário é feita em janeiro. Porém, é possível fazer análises intermediárias ao longo do ano para identificar oportunidades de crédito e reorganização societária.' },
  { q: 'Posso mudar de regime no meio do ano?', a: 'Em geral não. A opção pelo Simples Nacional, Lucro Presumido ou Lucro Real é feita uma única vez por ano, em janeiro, e vale para todo o exercício. Por isso o planejamento antecipado é essencial para não perder a janela de escolha.' },
  { q: 'Qual a economia média dos clientes?', a: 'A economia varia conforme o porte, setor e situação atual de cada empresa, mas nossos clientes costumam economizar entre 15% e 40% na carga tributária após o planejamento. O impacto é maior em empresas que nunca fizeram uma análise formal de regime.' },
]

export default function PlanejamentoTributarioPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Serviços Nauta"
          title={<>Planejamento<br /><span style={{ color: '#7c6fff' }}>Tributário</span> Estratégico</>}
          description="Reduza legalmente sua carga tributária com análise de regime, elisão fiscal e reorganização societária. Estratégia que pode economizar até 40% em impostos."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Serviços' }, { label: 'Planejamento Tributário' }]}
          stats={[{ value: 'Até 40%', label: 'de economia em impostos' }, { value: 'Legal', label: '100% elisão fiscal' }, { value: 'Anual', label: 'revisão do planejamento' }]}
          primaryCta={{ label: 'Solicitar proposta gratuita', onClick: () => openLead('Planejamento Tributário') }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/554899245194' }}
          purpleOrb
        />
        <FeaturesGrid
          title="O que está incluído"
          subtitle="Estratégias tributárias legais para reduzir impostos e proteger o patrimônio da empresa."
          features={features}
        />
        <FaqSection
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre planejamento tributário."
          items={faqs}
        />
        <ServiceCTA
          title="Quanto você está pagando a mais de impostos?"
          subtitle="Faça uma análise tributária gratuita e descubra quanto pode economizar legalmente."
          onOpenLead={() => openLead('Planejamento Tributário')}
          interest="Planejamento Tributário"
          accent="#7c6fff"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
