'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import { Calculator, BarChart2, DollarSign, FileText, ArrowRight, Scale, Building2, Search, Download } from 'lucide-react'
import InnerHero from '@/components/ui/inner-hero'

const tools = [
  {
    icon: Calculator,
    title: 'Calculadora Fator R',
    desc: 'Descubra se sua empresa pode usar o Anexo III (menor alíquota) do Simples Nacional calculando o Fator R da folha de pagamento.',
    href: '/ferramentas/calculadora-fator-r',
    tag: 'Simples Nacional',
  },
  {
    icon: BarChart2,
    title: 'Simulador de Regime Tributário',
    desc: 'Compare Simples Nacional, Lucro Presumido e Lucro Real para descobrir qual regime gera menos impostos para o seu faturamento.',
    href: '/ferramentas/simulador-regime-tributario',
    tag: 'Tributário',
  },
  {
    icon: DollarSign,
    title: 'Calculadora Salário Líquido',
    desc: 'Calcule o salário líquido após descontos de INSS e IR com base nas tabelas vigentes de 2024.',
    href: '/ferramentas/calculadora-salario-liquido',
    tag: 'Trabalhista',
  },
  {
    icon: FileText,
    title: 'Simulador de Rescisão',
    desc: 'Calcule as verbas rescisórias em caso de demissão sem justa causa, com justa causa, pedido de demissão ou acordo.',
    href: '/ferramentas/simulador-rescisao',
    tag: 'Trabalhista',
  },
  {
    icon: Scale,
    title: 'Calculadora PJ x CLT',
    desc: 'Compare quanto sobra como CLT (com benefícios) e como PJ (após impostos) para decidir o que compensa mais.',
    href: '/ferramentas/calculadora-pj-x-clt',
    tag: 'Trabalhista',
  },
  {
    icon: Building2,
    title: 'Custo para abrir CNPJ',
    desc: 'Estime quanto custa abrir sua empresa conforme o tipo (MEI, ME, LTDA) e a atividade.',
    href: '/ferramentas/calculadora-custo-abrir-cnpj',
    tag: 'Abertura',
  },
  {
    icon: BarChart2,
    title: 'Simulador da Reforma Tributária',
    desc: 'Estime a carga do novo IVA dual (CBS + IBS) que substitui PIS, COFINS, ISS e ICMS.',
    href: '/ferramentas/calculadora-reforma-tributaria',
    tag: 'Tributário',
  },
  {
    icon: Search,
    title: 'Consulta de CNAE',
    desc: 'Busque o código CNAE da sua atividade e veja em qual anexo do Simples Nacional ela se enquadra.',
    href: '/ferramentas/consulta-cnae',
    tag: 'Abertura',
  },
  {
    icon: FileText,
    title: 'Calculadora de RPA',
    desc: 'Calcule o líquido de um Recibo de Pagamento Autônomo com INSS, Imposto de Renda e ISS.',
    href: '/ferramentas/calculadora-rpa',
    tag: 'Autônomo',
  },
  {
    icon: Download,
    title: 'Planilha de Fluxo de Caixa',
    desc: 'Baixe grátis uma planilha pronta para controlar entradas e saídas do seu negócio mês a mês.',
    href: '/ferramentas/planilha-fluxo-de-caixa',
    tag: 'Planilha',
  },
  {
    icon: Download,
    title: 'Planilha de Controle Financeiro',
    desc: 'Baixe grátis uma planilha para organizar receitas e despesas com resumo automático.',
    href: '/ferramentas/planilha-controle-financeiro',
    tag: 'Planilha',
  },
]

export default function FerramentasPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Ferramentas gratuitas"
          title={<>Decida com<br /><span style={{ color: '#0BBCD4' }}>dados reais.</span></>}
          description="Calculadoras e simuladores gratuitos para tomar as melhores decisões tributárias e trabalhistas — sem precisar de um contador agora."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ferramentas' }]}
          stats={[{ value: '11', label: 'ferramentas gratuitas' }, { value: '+2.000', label: 'usuários' }, { value: '100%', label: 'sem cadastro' }]}
        />

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tools.map(t => (
                <Link key={t.href} href={t.href}
                  className="group p-8 rounded-2xl border border-gray-100 hover:border-[#0BBCD4]/30 hover:shadow-xl transition-all">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-[#0BBCD4]/10 transition-colors">
                      <t.icon size={26} className="text-[#0BBCD4]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-[#0BBCD4] px-2 py-0.5 rounded-full" style={{ background: 'rgba(11,188,212,0.08)' }}>{t.tag}</span>
                        <span className="text-xs text-gray-400 font-medium">Gratuito</span>
                      </div>
                      <h2 className="text-xl font-black text-[#0f0e1a] mb-2" style={{ letterSpacing: '-0.01em' }}>{t.title}</h2>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">{t.desc}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-[#0BBCD4] group-hover:gap-2 transition-all">
                        Abrir calculadora <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-black text-[#0f0e1a] mb-3" style={{ letterSpacing: '-0.02em' }}>Precisa de uma análise personalizada?</h2>
            <p className="text-gray-500 mb-6 text-sm">As ferramentas são estimativas. Para uma análise completa e precisa do seu caso, fale com um de nossos especialistas.</p>
            <button onClick={() => openLead()}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#0BBCD4] hover:bg-[#0999ae] text-white font-bold rounded transition-all hover:shadow-lg hover:shadow-[#0BBCD4]/20 hover:-translate-y-px text-sm">
              Falar com especialista <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
