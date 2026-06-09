'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import FeaturesGrid, { Feature } from '@/components/ui/features-grid'
import FaqSection, { FaqItem } from '@/components/ui/faq-section'
import ServiceCTA from '@/components/ui/service-cta'
import { Wallet, RefreshCw, TrendingUp, BarChart3, FileText, Landmark } from 'lucide-react'


const features: Feature[] = [
  { icon: Wallet,     title: 'Contas a Pagar e Receber',  desc: 'Gestão completa do AP/AR: cadastro de fornecedores, vencimentos, pagamentos e cobrança sistematizada.' },
  { icon: RefreshCw,  title: 'Conciliação Bancária',       desc: 'Conciliação diária de extratos bancários, identificação de divergências e controle de múltiplas contas.' },
  { icon: TrendingUp, title: 'Fluxo de Caixa',             desc: 'Projeção e controle do fluxo de caixa diário, semanal e mensal para antever necessidades de capital.' },
  { icon: BarChart3,  title: 'DRE Gerencial',              desc: 'Demonstração de resultado gerencial mensal com análise de margens, custos e indicadores de desempenho.' },
  { icon: FileText,   title: 'Emissão de Notas Fiscais',   desc: 'Emissão de NF-e, NFS-e e NFC-e com controle de tributação e envio automático ao cliente.' },
  { icon: Landmark,   title: 'Relacionamento com Bancos',  desc: 'Negociação de taxas, análise de crédito e gestão de tarifas bancárias para redução de custos financeiros.' },
]

const faqs: FaqItem[] = [
  { q: 'O que é BPO Financeiro?', a: 'BPO Financeiro (Business Process Outsourcing) é a terceirização do back-office financeiro da empresa. Em vez de manter uma equipe interna para cuidar de contas a pagar, receber, conciliações e relatórios, você delega essas atividades para nossa equipe especializada.' },
  { q: 'Vocês têm acesso às minhas contas bancárias?', a: 'Sim, por leitura via Open Finance ou por acesso controlado ao internet banking da empresa. Nunca realizamos movimentações financeiras sem autorização prévia e documentada do cliente. Segurança e transparência são inegociáveis.' },
  { q: 'Qual a diferença entre BPO e contabilidade?', a: 'A contabilidade trata das obrigações fiscais, tributárias e societárias da empresa. O BPO Financeiro cuida do dia a dia financeiro: pagamentos, recebimentos, fluxo de caixa e relatórios gerenciais. Os dois serviços se complementam e podem ser contratados juntos.' },
  { q: 'Minha equipe interna pode ser substituída?', a: 'Depende do modelo escolhido. Podemos atuar de forma complementar (suportando o financeiro existente) ou assumir integralmente o setor financeiro, substituindo a necessidade de um time interno. Definimos juntos a melhor estrutura para o seu porte.' },
]

export default function BpoFinanceiroPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Serviços Nauta"
          title={<>BPO <span style={{ color: '#0BBCD4' }}>Financeiro</span><br />Terceirizado</>}
          description="Gestão financeira completa da sua empresa: contas a pagar/receber, conciliação bancária, DRE gerencial e fluxo de caixa. Tudo interno, nada terceirizado."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Serviços' }, { label: 'BPO Financeiro' }]}
          stats={[{ value: '100%', label: 'interno' }, { value: 'Real-time', label: 'dashboard' }, { value: 'Zero', label: 'inadimplência' }]}
          primaryCta={{ label: 'Solicitar proposta gratuita', onClick: () => openLead('BPO Financeiro') }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/5548998211604' }}
          purpleOrb
        />
        <FeaturesGrid
          title="O que está incluído"
          subtitle="Gestão financeira profissional e completa para que você foque no que realmente importa."
          features={features}
        />
        <FaqSection
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre BPO Financeiro."
          items={faqs}
        />
        <ServiceCTA
          title="Delegue o financeiro, foque no negócio"
          subtitle="Gestão financeira profissional sem precisar contratar um CFO."
          onOpenLead={() => openLead('BPO Financeiro')}
          interest="BPO Financeiro"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
