'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import { ArrowRight, Info } from 'lucide-react'
import InnerHero from '@/components/ui/inner-hero'

// Tabela Simples Nacional Anexo III (serviços)
const SIMPLES_III = [
  { limite: 180000, aliquota: 0.06, deducao: 0 },
  { limite: 360000, aliquota: 0.112, deducao: 9360 },
  { limite: 720000, aliquota: 0.135, deducao: 17640 },
  { limite: 1800000, aliquota: 0.16, deducao: 35640 },
  { limite: 3600000, aliquota: 0.21, deducao: 125640 },
  { limite: 4800000, aliquota: 0.33, deducao: 648000 },
]

// Tabela Simples Nacional Anexo I (comércio)
const SIMPLES_I = [
  { limite: 180000, aliquota: 0.04, deducao: 0 },
  { limite: 360000, aliquota: 0.073, deducao: 5940 },
  { limite: 720000, aliquota: 0.095, deducao: 13860 },
  { limite: 1800000, aliquota: 0.107, deducao: 22500 },
  { limite: 3600000, aliquota: 0.143, deducao: 87300 },
  { limite: 4800000, aliquota: 0.19, deducao: 378000 },
]

function calcularSimples(receita: number, tabela: typeof SIMPLES_I): number {
  if (receita <= 0) return 0
  const faixa = tabela.find(f => receita <= f.limite) || tabela[tabela.length - 1]
  const aliquotaEfetiva = (receita * faixa.aliquota - faixa.deducao) / receita
  return Math.max(0, aliquotaEfetiva * receita)
}

function calcularLucroPresumido(receita: number, atividade: string): number {
  const presuncao = atividade === 'servicos' ? 0.32 : 0.08
  const baseIRPJ = receita * presuncao
  const baseCSLL = receita * (atividade === 'servicos' ? 0.32 : 0.12)

  const irpj = baseIRPJ * 0.15 + Math.max(0, baseIRPJ - 60000) * 0.10
  const csll = baseCSLL * 0.09
  const pisCofins = atividade === 'servicos'
    ? receita * (0.0065 + 0.03)
    : receita * (0.0065 + 0.03)

  return irpj + csll + pisCofins
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatPct(v: number): string {
  return (v * 100).toFixed(2) + '%'
}

export default function SimuladorRegimePage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  const [faturamento, setFaturamento] = useState('')
  const [atividade, setAtividade] = useState('servicos')
  const [resultado, setResultado] = useState<{
    simples: number; lp: number; simplesAliq: number; lpAliq: number; receita: number
  } | null>(null)

  const calcular = () => {
    const receita = parseFloat(faturamento.replace(/\./g, '').replace(',', '.')) || 0
    if (receita <= 0) return

    const tabela = atividade === 'servicos' ? SIMPLES_III : SIMPLES_I
    const simples = calcularSimples(receita, tabela)
    const lp = calcularLucroPresumido(receita, atividade)

    setResultado({
      receita,
      simples,
      lp,
      simplesAliq: simples / receita,
      lpAliq: lp / receita,
    })
  }

  const melhor = resultado ? (resultado.simples <= resultado.lp ? 'simples' : 'lp') : null

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Ferramenta gratuita"
          title={<>Simulador de<br /><span style={{ color: '#7c6fff' }}>Regime Tributário</span></>}
          description="Compare Simples Nacional, Lucro Presumido e Lucro Real. Descubra qual regime gera menos imposto para o seu faturamento e atividade."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ferramentas', href: '/ferramentas' }, { label: 'Simulador de Regime' }]}
          stats={[{ value: '3', label: 'regimes comparados' }, { value: 'Estimativa', label: 'de economia' }, { value: 'Grátis', label: 'sem cadastro' }]}
          accentColor="#7c6fff"
          purpleOrb
        />

        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="p-5 rounded-2xl mb-8 flex gap-4" style={{ background: 'rgba(11,188,212,0.04)', border: '1px solid rgba(11,188,212,0.15)' }}>
              <Info size={20} className="text-[#0BBCD4] shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Esta simulação é uma estimativa simplificada. O cálculo real envolve variáveis adicionais como deduções, créditos e particularidades da atividade. Consulte nosso time para uma análise completa.
              </p>
            </div>

            {/* Inputs */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Faturamento Anual Estimado</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 500.000,00"
                  value={faturamento}
                  onChange={e => setFaturamento(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">Receita bruta anual prevista</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Atividade</label>
                <select
                  value={atividade}
                  onChange={e => setAtividade(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50 cursor-pointer"
                >
                  <option value="servicos">Prestação de Serviços</option>
                  <option value="comercio">Comércio / Indústria</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Simples: Anexo III (serv.) ou Anexo I (comércio)</p>
              </div>
            </div>

            <button onClick={calcular}
              className="w-full py-4 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm mb-8"
              style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 8px 20px rgba(11,188,212,0.25)' }}>
              Simular regimes tributários
            </button>

            {/* Resultados */}
            {resultado && (
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-black text-[#0f0e1a]" style={{ letterSpacing: '-0.01em' }}>Resultado da simulação</h2>
                <p className="text-sm text-gray-500 mb-4">Faturamento anual: <strong>{formatBRL(resultado.receita)}</strong></p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Simples */}
                  <div className={`p-6 rounded-2xl border-2 transition-all ${melhor === 'simples' ? 'border-[#0BBCD4]' : 'border-gray-100'}`}
                    style={{ background: melhor === 'simples' ? 'rgba(11,188,212,0.04)' : 'white' }}>
                    {melhor === 'simples' && (
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 text-[#0BBCD4]" style={{ background: 'rgba(11,188,212,0.12)' }}>
                        Mais vantajoso
                      </span>
                    )}
                    <h3 className="font-black text-[#0f0e1a] text-lg mb-3">Simples Nacional</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Imposto estimado / ano</span>
                        <span className="font-bold text-[#0f0e1a]">{formatBRL(resultado.simples)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Alíquota efetiva</span>
                        <span className="font-bold text-[#0f0e1a]">{formatPct(resultado.simplesAliq)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Imposto mensal (média)</span>
                        <span className="font-bold text-[#0f0e1a]">{formatBRL(resultado.simples / 12)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lucro Presumido */}
                  <div className={`p-6 rounded-2xl border-2 transition-all ${melhor === 'lp' ? 'border-[#0BBCD4]' : 'border-gray-100'}`}
                    style={{ background: melhor === 'lp' ? 'rgba(11,188,212,0.04)' : 'white' }}>
                    {melhor === 'lp' && (
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 text-[#0BBCD4]" style={{ background: 'rgba(11,188,212,0.12)' }}>
                        Mais vantajoso
                      </span>
                    )}
                    <h3 className="font-black text-[#0f0e1a] text-lg mb-3">Lucro Presumido</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Imposto estimado / ano</span>
                        <span className="font-bold text-[#0f0e1a]">{formatBRL(resultado.lp)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Alíquota efetiva</span>
                        <span className="font-bold text-[#0f0e1a]">{formatPct(resultado.lpAliq)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Imposto mensal (média)</span>
                        <span className="font-bold text-[#0f0e1a]">{formatBRL(resultado.lp / 12)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diferença */}
                <div className="p-5 rounded-xl" style={{ background: 'rgba(61,59,142,0.05)', border: '1px solid rgba(61,59,142,0.1)' }}>
                  <p className="text-sm text-gray-700">
                    <strong>Economia estimada com o regime mais vantajoso:</strong>{' '}
                    <span className="font-black text-[#3D3B8E]">{formatBRL(Math.abs(resultado.simples - resultado.lp))} / ano</span>
                    {' '}({formatBRL(Math.abs(resultado.simples - resultado.lp) / 12)} / mês)
                  </p>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #0f0e1a, #1a1830)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-black text-white mb-2">Quer uma análise precisa do seu caso?</h3>
              <p className="text-gray-400 text-sm mb-4">Nossa equipe faz uma análise completa incluindo Lucro Real e variáveis específicas da sua empresa.</p>
              <button onClick={() => openLead('Planejamento Tributário')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm"
                style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 6px 16px rgba(11,188,212,0.25)' }}>
                Solicitar análise gratuita <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
