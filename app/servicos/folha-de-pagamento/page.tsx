'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import FeaturesGrid, { Feature } from '@/components/ui/features-grid'
import FaqSection, { FaqItem } from '@/components/ui/faq-section'
import ServiceCTA from '@/components/ui/service-cta'
import { Users, FileText, CreditCard, Calendar, ClipboardList, FileCheck } from 'lucide-react'


const features: Feature[] = [
  { icon: Users,         title: 'Processamento Mensal da Folha', desc: 'Cálculo preciso de salários, adicionais, DSR, horas extras, benefícios e deduções de todos os colaboradores.' },
  { icon: FileText,      title: 'eSocial Completo',              desc: 'Transmissão de todos os eventos S-2200, S-2206, S-2299, S-1200 e demais eventos para o ambiente eSocial.' },
  { icon: CreditCard,    title: 'FGTS e INSS',                   desc: 'Recolhimento correto do FGTS mensal e INSS patronal, incluindo GPS e GFIP/SEFIP quando aplicável.' },
  { icon: Calendar,      title: '13º Salário e Férias',          desc: 'Cálculo e controle de 13º salário, férias vencidas e proporcionais, avos e médias variáveis.' },
  { icon: ClipboardList, title: 'Admissão e Demissão',           desc: 'Preparação de toda a documentação: contrato de trabalho, TRCT, homologação e entrega de verbas rescisórias.' },
  { icon: FileCheck,     title: 'CAGED e RAIS',                  desc: 'Transmissão do CAGED mensal e RAIS anual com todas as movimentações de empregados.' },
]

const faqs: FaqItem[] = [
  { q: 'O que é o eSocial?', a: 'O eSocial é o sistema do governo federal que unifica a entrega de informações trabalhistas, previdenciárias e fiscais dos empregados. Todas as empresas com funcionários CLT são obrigadas a transmitir os eventos no prazo, sob pena de multas e impedimentos.' },
  { q: 'Em quanto tempo devo enviar documentos de admissão?', a: 'Pelo eSocial, o evento de admissão (S-2200) deve ser transmitido até o dia anterior ao início das atividades do colaborador. O atraso gera pendência no sistema e pode impedir a emissão da CTPS digital e o recolhimento correto do FGTS.' },
  { q: 'Vocês calculam rescisão e aviso prévio?', a: 'Sim. Calculamos todos os tipos de rescisão: pedido de demissão, dispensa sem justa causa, dispensa com justa causa, rescisão por acordo mútuo (§ 6º da CLT) e término de contrato por prazo determinado, com o TRCT devidamente assinado.' },
  { q: 'Como recebo os holerites?', a: 'Os holerites são enviados digitalmente por portal seguro ou WhatsApp até o 5º dia útil de cada mês. Você pode repassar diretamente aos colaboradores ou disponibilizá-los via app, sem necessidade de impressão.' },
]

export default function FolhaDePagamentoPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Serviços Nauta"
          title={<>Folha de Pagamento<br /><span style={{ color: '#0BBCD4' }}>e eSocial</span></>}
          description="Processamento da folha, admissões, demissões, eSocial completo e FGTS para empresas de qualquer porte. Holerites digitais e 100% em conformidade."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Serviços' }, { label: 'Folha de Pagamento' }]}
          stats={[{ value: '100%', label: 'eSocial compliant' }, { value: 'Zero', label: 'erros na folha' }, { value: 'Digital', label: 'holerites online' }]}
          primaryCta={{ label: 'Solicitar proposta gratuita', onClick: () => openLead('Folha de Pagamento') }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/5548998211604' }}
          purpleOrb
        />
        <FeaturesGrid
          title="O que está incluído"
          subtitle="Gestão completa da folha de pagamento e cumprimento de todas as obrigações trabalhistas."
          features={features}
        />
        <FaqSection
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre folha de pagamento e eSocial."
          items={faqs}
        />
        <ServiceCTA
          title="Sua folha em dia, todo mês"
          subtitle="Processo 100% digital, sem erros e sempre dentro dos prazos legais."
          onOpenLead={() => openLead('Folha de Pagamento')}
          interest="Folha de Pagamento"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
