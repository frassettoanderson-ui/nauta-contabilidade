'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import FeaturesGrid, { Feature } from '@/components/ui/features-grid'
import FaqSection, { FaqItem } from '@/components/ui/faq-section'
import ServiceCTA from '@/components/ui/service-cta'
import { ReceiptText, FileSearch, BarChart2, CreditCard, AlertCircle, ShieldCheck } from 'lucide-react'


const features: Feature[] = [
  { icon: ReceiptText,  title: 'Apuração de Tributos',             desc: 'Cálculo mensal de ICMS, PIS, COFINS, ISS, IRPJ, CSLL conforme o regime tributário da empresa.' },
  { icon: FileSearch,   title: 'Obrigações Acessórias',             desc: 'Entrega de SPED Fiscal, ECF, DCTF, DEFIS, PGDAS e demais declarações dentro dos prazos legais.' },
  { icon: BarChart2,    title: 'Análise de Créditos Tributários',   desc: 'Identificação e aproveitamento de créditos de PIS/COFINS e ICMS para redução legal da carga fiscal.' },
  { icon: CreditCard,   title: 'Parcelamento de Débitos Fiscais',   desc: 'Apoio em REFIS, PERT e programas de parcelamento junto à Receita Federal e SEFAZ.' },
  { icon: AlertCircle,  title: 'Atendimento a Fiscalizações',       desc: 'Suporte técnico em notificações, autuações e processos administrativos tributários.' },
  { icon: ShieldCheck,  title: 'Conformidade Tributária Contínua',  desc: 'Monitoramento da legislação tributária para garantir conformidade permanente.' },
]

const faqs: FaqItem[] = [
  { q: 'O que são obrigações acessórias?', a: 'Obrigações acessórias são declarações e escriturações que as empresas devem entregar periodicamente ao governo, como SPED Fiscal, ECF, DCTF e DEFIS. O não cumprimento gera multas automáticas que podem comprometer o caixa da empresa.' },
  { q: 'Como funciona a apuração de impostos?', a: 'A apuração varia conforme o regime tributário da empresa. No Simples Nacional, o cálculo é unificado via PGDAS. No Lucro Presumido e Lucro Real, apuramos IRPJ, CSLL, PIS e COFINS separadamente, com diferentes bases de cálculo e alíquotas.' },
  { q: 'Vocês cuidam de parcelamentos fiscais?', a: 'Sim. Apoiamos a adesão a programas como REFIS e PERT, elaborando o pedido, selecionando a melhor modalidade e acompanhando os pagamentos mensais para manter a empresa em dia com a Receita Federal e SEFAZ.' },
  { q: 'Há risco de multa se eu trocar de contador?', a: 'Não. Cuidamos de toda a migração contábil e fiscal, incluindo a regularização de eventuais pendências anteriores. O processo é transparente e não há interrupção nas obrigações acessórias.' },
]

export default function FiscalPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Serviços Nauta"
          title={<>Gestão <span style={{ color: '#0BBCD4' }}>Fiscal</span><br />e Tributária</>}
          description="Apuração de tributos, entrega de obrigações acessórias e conformidade fiscal contínua. Sua empresa sempre em dia com Receita Federal, SEFAZ e Prefeitura."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Serviços' }, { label: 'Fiscal' }]}
          stats={[{ value: '100%', label: 'no prazo' }, { value: 'Zero', label: 'multas por atraso' }, { value: '+10', label: 'obrigações gerenciadas' }]}
          primaryCta={{ label: 'Solicitar proposta gratuita', onClick: () => openLead('Gestão Fiscal') }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/554899245194' }}
          purpleOrb
        />
        <FeaturesGrid
          title="O que está incluído"
          subtitle="Gestão completa das obrigações fiscais e tributárias para sua empresa operar sem riscos."
          features={features}
        />
        <FaqSection
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre gestão fiscal e tributária."
          items={faqs}
        />
        <ServiceCTA
          title="Chega de preocupação com o fiscal"
          subtitle="Delegue a gestão tributária para especialistas e foque no crescimento."
          onOpenLead={() => openLead('Gestão Fiscal')}
          interest="Fiscal"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
