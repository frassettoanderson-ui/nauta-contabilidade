'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import FeaturesGrid, { Feature } from '@/components/ui/features-grid'
import FaqSection, { FaqItem } from '@/components/ui/faq-section'
import ServiceCTA from '@/components/ui/service-cta'
import { FileText, BarChart2, TrendingUp, DollarSign, BookOpen, ClipboardList, Award } from 'lucide-react'


const features: Feature[] = [
  { icon: BookOpen,      title: 'Escrituração Contábil',            desc: 'Registro sistemático de todos os fatos contábeis da sua empresa, garantindo conformidade com as normas brasileiras (NBC TG e IFRS).' },
  { icon: BarChart2,     title: 'Balanço Patrimonial',              desc: 'Elaboração periódica evidenciando ativos, passivos e patrimônio líquido com análise vertical e horizontal.' },
  { icon: TrendingUp,    title: 'DRE – Demonstração do Resultado',  desc: 'Apuração do resultado do exercício com análise de receitas, custos e despesas operacionais por centro de custo.' },
  { icon: DollarSign,    title: 'Fluxo de Caixa',                   desc: 'Controle dos recursos financeiros que entram e saem — fundamental para a gestão de liquidez e planejamento.' },
  { icon: ClipboardList, title: 'DLPA – Lucros e Prejuízos Acumulados', desc: 'Transparência na distribuição de lucros e movimentação do patrimônio líquido ao longo do exercício.' },
  { icon: FileText,      title: 'Relatórios Gerenciais Mensais',    desc: 'Dashboards e relatórios personalizados até o 10º dia útil do mês para decisões baseadas em dados reais.' },
  { icon: Award,         title: 'Laudos e Pareceres Contábeis',     desc: 'Emissão de laudos técnicos para fins legais, societários, bancários ou de auditoria com assinatura do CRC.' },
]

const faqs: FaqItem[] = [
  { q: 'O que é escrituração contábil?', a: 'Escrituração contábil é o processo de registrar todos os eventos econômico-financeiros de uma empresa em livros contábeis (Diário e Razão), seguindo as normas do CFC e do CPC. É obrigatória para a maioria das empresas e serve como base para apuração de impostos, tomada de decisão e prestação de contas.' },
  { q: 'Com que frequência recebo relatórios?', a: 'Fornecemos relatórios mensais com DRE, balanço e fluxo de caixa até o décimo dia útil do mês seguinte. Para clientes do BPO Financeiro integrado, o acesso é em tempo real via dashboard.' },
  { q: 'Vocês atendem qualquer regime tributário?', a: 'Sim. Atendemos MEI, Simples Nacional, Lucro Presumido e Lucro Real, adaptando os procedimentos contábeis às exigências de cada regime.' },
  { q: 'Preciso enviar documentos físicos?', a: 'Não. Todo o processo é 100% digital. Você envia notas fiscais, extratos e comprovantes pelo nosso portal ou WhatsApp, e nossa equipe cuida de todo o restante.' },
]

export default function ContabilPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Serviços Nauta"
          title={<>Contabilidade<br /><span style={{ color: '#0BBCD4' }}>Contábil</span> Completa</>}
          description="Escrituração, balanço, DRE e demonstrações financeiras para empresas de todo o Brasil. Conformidade total, relatórios mensais que realmente informam."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Serviços' }, { label: 'Contábil' }]}
          stats={[{ value: '+10 anos', label: 'de experiência' }, { value: '100%', label: 'digital' }, { value: 'CRC-SC', label: 'registrada' }]}
          primaryCta={{ label: 'Solicitar proposta gratuita', onClick: () => openLead('Contabilidade Contábil') }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/5548998211604' }}
          purpleOrb
        />
        <FeaturesGrid
          title="O que está incluído"
          subtitle="Tudo o que sua empresa precisa para ter uma contabilidade rigorosa e relatórios que realmente informam."
          features={features}
        />
        <FaqSection
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre contabilidade contábil."
          items={faqs}
        />
        <ServiceCTA
          title="Pronto para ter uma contabilidade de verdade?"
          subtitle="Fale com um especialista e receba uma proposta personalizada sem compromisso."
          onOpenLead={() => openLead('Contabilidade Contábil')}
          interest="Contábil"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
