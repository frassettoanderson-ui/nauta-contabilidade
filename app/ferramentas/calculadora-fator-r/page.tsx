'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import { ArrowRight, Info } from 'lucide-react'
import InnerHero from '@/components/ui/inner-hero'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function parseCurrency(v: string): number {
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CalculadoraFatorRPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  const [receitas, setReceitas] = useState<string[]>(Array(12).fill(''))
  const [folhas, setFolhas] = useState<string[]>(Array(12).fill(''))
  const [resultado, setResultado] = useState<{ fatorR: number; totalReceita: number; totalFolha: number } | null>(null)

  const calcular = () => {
    const totalReceita = receitas.reduce((acc, v) => acc + parseCurrency(v), 0)
    const totalFolha = folhas.reduce((acc, v) => acc + parseCurrency(v), 0)
    if (totalReceita === 0) return
    const fatorR = totalFolha / totalReceita
    setResultado({ fatorR, totalReceita, totalFolha })
  }

  const limpar = () => {
    setReceitas(Array(12).fill(''))
    setFolhas(Array(12).fill(''))
    setResultado(null)
  }

  const usaAnexoIII = resultado && resultado.fatorR >= 0.28
  const percentual = resultado ? (resultado.fatorR * 100).toFixed(2) : '0'

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Ferramenta gratuita"
          title={<>Calculadora<br /><span style={{ color: '#0BBCD4' }}>Fator R</span></>}
          description="Descubra se sua empresa prestadora de serviços no Simples Nacional pode tributar pelo Anexo III (menor alíquota) ou cai no Anexo V."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ferramentas', href: '/ferramentas' }, { label: 'Calculadora Fator R' }]}
          stats={[{ value: '≥28%', label: 'Fator R → Anexo III' }, { value: '<28%', label: 'Fator R → Anexo V' }, { value: 'Grátis', label: 'sem cadastro' }]}
          purpleOrb
        />

        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Explicação */}
            <div className="p-5 rounded-2xl mb-8 flex gap-4" style={{ background: 'rgba(11,188,212,0.04)', border: '1px solid rgba(11,188,212,0.15)' }}>
              <Info size={20} className="text-[#0BBCD4] shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 leading-relaxed">
                <strong>Como funciona:</strong> O Fator R é calculado dividindo a folha de pagamento dos últimos 12 meses pela receita bruta dos últimos 12 meses. Se o resultado for <strong>igual ou maior que 28%</strong>, sua empresa pode tributar pelo Anexo III do Simples Nacional (alíquotas menores). Se for inferior, cai no Anexo V (alíquotas maiores).
              </div>
            </div>

            {/* Tabela de inputs */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden mb-8">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="px-4 py-3">Mês</div>
                <div className="px-4 py-3">Receita Bruta (R$)</div>
                <div className="px-4 py-3">Folha de Pagamento (R$)</div>
              </div>
              {MESES.map((mes, i) => (
                <div key={mes} className={`grid grid-cols-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <div className="px-4 py-3 text-sm font-medium text-gray-700 flex items-center">{mes}</div>
                  <div className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={receitas[i]}
                      onChange={e => {
                        const next = [...receitas]
                        next[i] = e.target.value
                        setReceitas(next)
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900"
                    />
                  </div>
                  <div className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={folhas[i]}
                      onChange={e => {
                        const next = [...folhas]
                        next[i] = e.target.value
                        setFolhas(next)
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mb-8">
              <button onClick={calcular}
                className="flex-1 py-4 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm"
                style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 8px 20px rgba(11,188,212,0.25)' }}>
                Calcular Fator R
              </button>
              <button onClick={limpar}
                className="px-6 py-4 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm">
                Limpar
              </button>
            </div>

            {/* Resultado */}
            {resultado && (
              <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: usaAnexoIII ? 'rgba(11,188,212,0.3)' : 'rgba(239,68,68,0.3)' }}>
                <div className="px-6 py-4" style={{ background: usaAnexoIII ? 'rgba(11,188,212,0.06)' : 'rgba(239,68,68,0.06)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: usaAnexoIII ? '#0BBCD4' : '#ef4444' }}>Resultado</p>
                  <p className="text-4xl font-black" style={{ color: usaAnexoIII ? '#0BBCD4' : '#ef4444', letterSpacing: '-0.02em' }}>
                    {percentual}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Fator R calculado</p>
                </div>
                <div className="px-6 py-5 bg-white grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Total Receita (12 meses)</p>
                    <p className="text-lg font-black text-gray-900">R$ {formatBRL(resultado.totalReceita)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Total Folha (12 meses)</p>
                    <p className="text-lg font-black text-gray-900">R$ {formatBRL(resultado.totalFolha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Anexo Simples</p>
                    <p className="text-lg font-black" style={{ color: usaAnexoIII ? '#0BBCD4' : '#ef4444' }}>
                      {usaAnexoIII ? 'Anexo III' : 'Anexo V'}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 bg-white">
                  <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: usaAnexoIII ? 'rgba(11,188,212,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${usaAnexoIII ? 'rgba(11,188,212,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                    {usaAnexoIII ? (
                      <p className="text-gray-700">
                        <strong className="text-[#0BBCD4]">Boa notícia!</strong> Com Fator R acima de 28%, sua empresa pode se enquadrar no Anexo III do Simples Nacional, que possui alíquotas menores. Confirme com seu contador a aplicabilidade conforme sua atividade específica.
                      </p>
                    ) : (
                      <p className="text-gray-700">
                        <strong className="text-red-500">Atenção!</strong> Com Fator R abaixo de 28%, sua empresa se enquadra no Anexo V, que possui alíquotas maiores. Aumentar a folha de pagamento pode ser estratégico para melhorar o Fator R. Consulte seu contador.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #0f0e1a, #1a1830)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-black text-white mb-2">Precisa de uma análise mais detalhada?</h3>
              <p className="text-gray-400 text-sm mb-4">Nossa equipe verifica o enquadramento correto e identifica oportunidades de economia tributária.</p>
              <button onClick={() => openLead('Planejamento Tributário')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm"
                style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 6px 16px rgba(11,188,212,0.25)' }}>
                Falar com especialista <ArrowRight size={15} />
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
