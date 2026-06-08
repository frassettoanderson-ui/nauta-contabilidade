'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import { ArrowRight, Info } from 'lucide-react'
import InnerHero from '@/components/ui/inner-hero'

// Tabela INSS 2024 (progressiva)
const INSS_FAIXAS = [
  { limite: 1412.00, aliquota: 0.075 },
  { limite: 2666.68, aliquota: 0.09 },
  { limite: 4000.03, aliquota: 0.12 },
  { limite: 7786.02, aliquota: 0.14 },
]

// Tabela IR 2024
const IR_FAIXAS = [
  { limite: 2259.20, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.00 },
]

const DEDUCAO_DEPENDENTE = 189.59

function calcularINSS(salario: number): number {
  let inss = 0
  let base = salario
  let limiteAnterior = 0

  for (const faixa of INSS_FAIXAS) {
    if (base <= 0) break
    const limiteBase = Math.min(salario, faixa.limite)
    const tributavel = limiteBase - limiteAnterior
    inss += tributavel * faixa.aliquota
    limiteAnterior = faixa.limite
    base -= tributavel
    if (salario <= faixa.limite) break
  }

  return Math.min(inss, 7786.02 * 0.14) // teto INSS
}

function calcularIR(baseCalculo: number): number {
  const faixa = IR_FAIXAS.find(f => baseCalculo <= f.limite)
  if (!faixa || faixa.aliquota === 0) return 0
  return Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao)
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function parseBRL(v: string): number {
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

export default function CalculadoraSalarioLiquidoPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  const [salario, setSalario] = useState('')
  const [dependentes, setDependentes] = useState(0)
  const [outrosDescontos, setOutrosDescontos] = useState('')
  const [resultado, setResultado] = useState<{
    bruto: number; inss: number; deducaoDep: number; baseIR: number; ir: number; outros: number; liquido: number
  } | null>(null)

  const calcular = () => {
    const bruto = parseBRL(salario)
    if (bruto <= 0) return

    const inss = calcularINSS(bruto)
    const deducaoDep = dependentes * DEDUCAO_DEPENDENTE
    const outros = parseBRL(outrosDescontos)
    const baseIR = Math.max(0, bruto - inss - deducaoDep)
    const ir = calcularIR(baseIR)
    const liquido = bruto - inss - ir - outros

    setResultado({ bruto, inss, deducaoDep, baseIR, ir, outros, liquido })
  }

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Ferramenta gratuita"
          title={<>Calculadora<br /><span style={{ color: '#0BBCD4' }}>Salário Líquido</span></>}
          description="Calcule o salário líquido com INSS progressivo e IR 2024. Inclui dependentes, outras deduções e breakdown completo dos descontos."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ferramentas', href: '/ferramentas' }, { label: 'Calculadora Salário Líquido' }]}
          stats={[{ value: 'INSS', label: 'tabela 2024' }, { value: 'IR', label: 'tabela 2024' }, { value: 'Grátis', label: 'sem cadastro' }]}
          purpleOrb
        />

        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="p-5 rounded-2xl mb-8 flex gap-4" style={{ background: 'rgba(11,188,212,0.04)', border: '1px solid rgba(11,188,212,0.15)' }}>
              <Info size={20} className="text-[#0BBCD4] shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Calculadora baseada nas tabelas de INSS e IR vigentes em 2024. O cálculo considera o desconto progressivo do INSS (método de faixas) e a dedução de R$ 189,59 por dependente na base do IR.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Salário Bruto (R$)</label>
                <input type="text" inputMode="numeric" placeholder="Ex: 5.000,00" value={salario}
                  onChange={e => setSalario(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dependentes</label>
                <input type="number" min={0} max={20} value={dependentes}
                  onChange={e => setDependentes(parseInt(e.target.value) || 0)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1">Dedução: R$ 189,59 / dependente</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Outros Descontos (R$)</label>
                <input type="text" inputMode="numeric" placeholder="Ex: 200,00" value={outrosDescontos}
                  onChange={e => setOutrosDescontos(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1">VT, plano de saúde, etc.</p>
              </div>
            </div>

            <button onClick={calcular}
              className="w-full py-4 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm mb-8"
              style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 8px 20px rgba(11,188,212,0.25)' }}>
              Calcular salário líquido
            </button>

            {resultado && (
              <div className="rounded-2xl border border-gray-200 overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="font-black text-[#0f0e1a] text-lg" style={{ letterSpacing: '-0.01em' }}>Resultado</h2>
                </div>

                {[
                  { label: 'Salário Bruto', value: resultado.bruto, type: 'neutral' },
                  { label: 'Desconto INSS', value: -resultado.inss, type: 'deduct' },
                  { label: `Dedução Dependentes (${dependentes}x)`, value: -resultado.deducaoDep, type: resultado.deducaoDep > 0 ? 'deduct' : 'zero' },
                  { label: 'Base de Cálculo do IR', value: resultado.baseIR, type: 'info' },
                  { label: 'Desconto IR', value: -resultado.ir, type: 'deduct' },
                  ...(resultado.outros > 0 ? [{ label: 'Outros Descontos', value: -resultado.outros, type: 'deduct' as const }] : []),
                ].map(row => row.type !== 'zero' && (
                  <div key={row.label} className={`flex justify-between px-6 py-3.5 border-b border-gray-50 text-sm ${row.type === 'info' ? 'bg-gray-50' : ''}`}>
                    <span className="text-gray-600">{row.label}</span>
                    <span className={`font-semibold ${row.type === 'deduct' ? 'text-red-600' : row.type === 'info' ? 'text-gray-700 italic' : 'text-gray-900'}`}>
                      {row.type === 'deduct' ? `-${formatBRL(Math.abs(row.value))}` : formatBRL(Math.abs(row.value))}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(11,188,212,0.05), rgba(61,59,142,0.05))' }}>
                  <span className="font-black text-[#0f0e1a] text-lg">Salário Líquido</span>
                  <span className="font-black text-2xl" style={{ color: '#0BBCD4', letterSpacing: '-0.02em' }}>{formatBRL(resultado.liquido)}</span>
                </div>
              </div>
            )}

            {/* Tabelas de referência */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tabela INSS 2024 (progressiva)</p>
                </div>
                {INSS_FAIXAS.map((f, i) => (
                  <div key={i} className="flex justify-between px-4 py-2.5 text-xs border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">
                      {i === 0 ? `Até ${formatBRL(f.limite)}` : `De ${formatBRL(INSS_FAIXAS[i-1].limite + 0.01)} a ${formatBRL(f.limite)}`}
                    </span>
                    <span className="font-bold text-gray-900">{(f.aliquota * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tabela IR 2024</p>
                </div>
                {IR_FAIXAS.slice(0, -1).map((f, i) => (
                  <div key={i} className="flex justify-between px-4 py-2.5 text-xs border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">
                      {i === 0 ? `Até ${formatBRL(f.limite)}` : `Até ${formatBRL(f.limite)}`}
                    </span>
                    <span className="font-bold text-gray-900">{(f.aliquota * 100).toFixed(1)}%</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 text-xs">
                  <span className="text-gray-600">Acima de {formatBRL(IR_FAIXAS[3].limite)}</span>
                  <span className="font-bold text-gray-900">27.5%</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #0f0e1a, #1a1830)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-black text-white mb-2">Precisa calcular a folha completa da empresa?</h3>
              <p className="text-gray-400 text-sm mb-4">Cuide do seu negócio. Nossa equipe processa a folha de pagamento completa com INSS, FGTS e eSocial.</p>
              <button onClick={() => openLead('Folha de Pagamento')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm"
                style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 6px 16px rgba(11,188,212,0.25)' }}>
                Conhecer nosso serviço de folha <ArrowRight size={15} />
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
