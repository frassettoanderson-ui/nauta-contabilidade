'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import FeaturesGrid, { Feature } from '@/components/ui/features-grid'
import FaqSection, { FaqItem } from '@/components/ui/faq-section'
import ServiceCTA from '@/components/ui/service-cta'
import { Building, FileEdit, GitMerge, Archive, Award, ShieldAlert } from 'lucide-react'


const features: Feature[] = [
  { icon: Building,    title: 'Abertura de Empresa',          desc: 'CNPJ, Inscrição Estadual e Municipal, Alvará de funcionamento e registro no órgão de classe quando necessário.' },
  { icon: FileEdit,    title: 'Alteração Contratual',         desc: 'Mudança de sócios, endereço, atividade (CNAE), capital social, nome empresarial e objeto social.' },
  { icon: GitMerge,    title: 'Transformação e Fusão Societária', desc: 'Transformação de MEI em ME, LTDA em SA, fusão, cisão e incorporação de empresas com suporte jurídico.' },
  { icon: Archive,     title: 'Encerramento de Empresa',      desc: 'Baixa do CNPJ, cancelamento de inscrições estadual e municipal com quitação de obrigações pendentes.' },
  { icon: Award,       title: 'Registro em Conselhos de Classe', desc: 'Registro em CRM, CREA, CRO, OAB, CRP e demais conselhos profissionais vinculados à empresa.' },
  { icon: ShieldAlert, title: 'Regularização de Empresas',    desc: 'Regularização de empresas irregulares ou com débitos junto à Receita Federal, SEFAZ e Prefeitura.' },
]

const faqs: FaqItem[] = [
  { q: 'Quanto tempo leva para abrir uma empresa?', a: 'O prazo varia de 5 a 15 dias úteis dependendo do município e do tipo de atividade. Municípios com Portal de Empresas integrado ao gov.br costumam ser mais ágeis. Atividades de risco alto (saúde, alimentos) podem exigir vistorias adicionais.' },
  { q: 'Qual o custo para abrir um CNPJ?', a: 'Para LTDA simples, não há taxa federal. O custo envolve apenas emolumentos estaduais da Junta Comercial (varia por estado) e, em alguns municípios, taxa de Alvará. Fornecemos um orçamento completo antes de iniciar o processo.' },
  { q: 'Posso mudar o sócio da minha empresa?', a: 'Sim. A entrada ou saída de sócios é feita por alteração contratual registrada na Junta Comercial (ou cartório, no caso de sociedades simples). Cuidamos de toda a redação do instrumento e do protocolo nos órgãos competentes.' },
  { q: 'Atendem outros estados além de SC?', a: 'Sim. Atendemos empresas em todo o Brasil de forma 100% digital. Temos experiência com Juntas Comerciais, Prefeituras e Receita Federal de todos os estados, sem necessidade de deslocamento por parte do cliente.' },
]

export default function LegalizacaoSocietarioPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Serviços Nauta"
          title={<>Legalização e<br /><span style={{ color: '#0BBCD4' }}>Regularização</span> de Empresas</>}
          description="Abertura, alteração, transformação e encerramento de empresas. Atuamos em todo o Brasil para formalizar seu negócio com rapidez e segurança jurídica."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Serviços' }, { label: 'Legalização / Societário' }]}
          stats={[{ value: 'Todo', label: 'o Brasil' }, { value: 'Rápido', label: 'sem burocracia' }, { value: 'Jurídico', label: 'segurança total' }]}
          primaryCta={{ label: 'Solicitar proposta gratuita', onClick: () => openLead('Legalização / Societário') }}
          secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/5548998211604' }}
        />
        <FeaturesGrid
          title="O que está incluído"
          subtitle="Tudo o que sua empresa precisa para nascer, crescer e se transformar com segurança jurídica."
          features={features}
        />
        <FaqSection
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre abertura e regularização de empresas."
          items={faqs}
        />
        <ServiceCTA
          title="Abra ou regularize sua empresa"
          subtitle="Do CNPJ ao Alvará: cuide disso com quem entende de burocracia."
          onOpenLead={() => openLead('Legalização / Societário')}
          interest="Legalização / Societário"
        />
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
