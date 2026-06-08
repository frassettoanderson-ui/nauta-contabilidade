'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import { ArrowRight, Info } from 'lucide-react'
import InnerHero from '@/components/ui/inner-hero'

type TipoRescisao = 'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'acordo'
type AvisoPrevio = 'trabalhado' | 'indenizado' | 'nao_aplicavel'

function formatBRL(v: number): string {
  if (v === 0) return 'R$ 0,00'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function parseBRL(v: string): number {
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

function diffMeses(inicio: Date, fim: Date): number {
  const anos = fim.getFullYear() - inicio.getFullYear()
  const meses = fim.getMonth() - inicio.getMonth()
  return anos * 12 + meses
}

function calcularRescisao(
  salario: number,
  dataAdmissao: string,
  dataRescisao: string,
  tipo: TipoRescisao,
  avisoPrevio: AvisoPrevio,
  fgtsDepositado: number,
) {
  const admissao = new Date(dataAdmissao)
  const rescisao = new Date(dataRescisao)
  const totalMeses = diffMeses(admissao, rescisao)
  const mesesAnoAtual = rescisao.getMonth() + 1 // meses no ano corrente (jan=1)
  const diasFimMes = rescisao.getDate()
  const diasMes = new Date(rescisao.getFullYear(), rescisao.getMonth() + 1, 0).getDate()

  // Saldo de salário proporcional
  const saldoSalario = (salario / diasMes) * diasFimMes

  // 13º proporcional (meses trabalhados no ano)
  const decimoTerceiro = (salario / 12) * mesesAnoAtual

  // Férias proporcionais + 1/3 (meses no período aquisitivo atual)
  const mesesPeriodo = totalMeses % 12
  const feriasProporcionais = (salario / 12) * mesesPeriodo * (1 + 1/3)

  // Férias vencidas + 1/3 (se houver período completo não usufruído)
  // Simplificação: consideramos 0 férias vencidas (usuário pode ajustar)
  const feriasVencidas = 0

  // Aviso prévio indenizado
  const avisoPrevioValor = avisoPrevio === 'indenizado' ? salario : 0

  // FGTS sobre verbas rescisórias (8% sobre tudo que incide)
  const fgtsVerbas = (saldoSalario + decimoTerceiro + avisoPrevioValor) * 0.08

  // Multa FGTS
  let multaFGTS = 0
  const totalFGTS = fgtsDepositado + fgtsVerbas
  if (tipo === 'sem_justa_causa') multaFGTS = totalFGTS * 0.40
  if (tipo === 'acordo') multaFGTS = totalFGTS * 0.20

  // Totais
  const totalBruto = saldoSalario + decimoTerceiro + feriasProporcionais + feriasVencidas + avisoPrevioValor

  // Valores por tipo
  const recebe13 = tipo !== 'com_justa_causa'
  const recebeFerias = true
  const recebeAviso = tipo !== 'pedido_demissao' && tipo !== 'com_justa_causa'

  return {
    saldoSalario,
    decimoTerceiro: recebe13 ? decimoTerceiro : 0,
    feriasProporcionais: recebeFerias ? feriasProporcionais : 0,
    feriasVencidas,
    avisoPrevioValor: recebeAviso ? avisoPrevioValor : 0,
    fgtsVerbas,
    multaFGTS,
    totalBruto: saldoSalario +
      (recebe13 ? decimoTerceiro : 0) +
      (recebeFerias ? feriasProporcionais : 0) +
      feriasVencidas +
      (recebeAviso ? avisoPrevioValor : 0) +
      multaFGTS,
    totalMeses,
  }
}

export default function SimuladorRescisaoPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  const [salario, setSalario] = useState('')
  const [dataAdmissao, setDataAdmissao] = useState('')
  const [dataRescisao, setDataRescisao] = useState('')
  const [tipo, setTipo] = useState<TipoRescisao>('sem_justa_causa')
  const [avisoPrevio, setAvisoPrevio] = useState<AvisoPrevio>('indenizado')
  const [fgtsDepositado, setFgtsDepositado] = useState('')
  const [resultado, setResultado] = useState<ReturnType<typeof calcularRescisao> | null>(null)
  const [erro, setErro] = useState('')

  const calcular = () => {
    setErro('')
    const sal = parseBRL(salario)
    if (sal <= 0 || !dataAdmissao || !dataRescisao) {
      setErro('Preencha salário, data de admissão e data de rescisão.')
      return
    }
    if (new Date(dataRescisao) <= new Date(dataAdmissao)) {
      setErro('A data de rescisão deve ser posterior à data de admissão.')
      return
    }
    const fgts = parseBRL(fgtsDepositado)
    setResultado(calcularRescisao(sal, dataAdmissao, dataRescisao, tipo, avisoPrevio, fgts))
  }

  const tipoLabel: Record<TipoRescisao, string> = {
    sem_justa_causa: 'Sem Justa Causa',
    com_justa_causa: 'Com Justa Causa (pelo empregador)',
    pedido_demissao: 'Pedido de Demissão',
    acordo: 'Acordo (Art. 484-A CLT)',
  }

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Ferramenta gratuita"
          title={<>Simulador de<br /><span style={{ color: '#7c6fff' }}>Rescisão</span></>}
          description="Calcule todas as verbas rescisórias: saldo de salário, 13º, férias, aviso prévio, FGTS e multa de 40% conforme o tipo de demissão."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ferramentas', href: '/ferramentas' }, { label: 'Simulador Rescisão' }]}
          stats={[{ value: '4', label: 'tipos de rescisão' }, { value: 'FGTS+', label: 'multa e saldo' }, { value: 'Grátis', label: 'sem cadastro' }]}
          accentColor="#7c6fff"
          purpleOrb
        />

        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="p-5 rounded-2xl mb-8 flex gap-4" style={{ background: 'rgba(11,188,212,0.04)', border: '1px solid rgba(11,188,212,0.15)' }}>
              <Info size={20} className="text-[#0BBCD4] shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Simulação simplificada. Não inclui hora extra, adicional de insalubridade, descontos de plano de saúde ou outras particularidades. Para cálculo preciso e homologação, fale com nosso departamento de RH.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Último Salário Bruto (R$)</label>
                <input type="text" inputMode="numeric" placeholder="Ex: 3.500,00" value={salario}
                  onChange={e => setSalario(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Rescisão</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as TipoRescisao)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50 cursor-pointer">
                  <option value="sem_justa_causa">Sem Justa Causa</option>
                  <option value="com_justa_causa">Com Justa Causa (pelo empregador)</option>
                  <option value="pedido_demissao">Pedido de Demissão</option>
                  <option value="acordo">Acordo (Art. 484-A CLT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data de Admissão</label>
                <input type="date" value={dataAdmissao} onChange={e => setDataAdmissao(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data da Rescisão</label>
                <input type="date" value={dataRescisao} onChange={e => setDataRescisao(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aviso Prévio</label>
                <select value={avisoPrevio} onChange={e => setAvisoPrevio(e.target.value as AvisoPrevio)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50 cursor-pointer">
                  <option value="indenizado">Indenizado (empresa paga)</option>
                  <option value="trabalhado">Trabalhado</option>
                  <option value="nao_aplicavel">Não aplicável</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Saldo FGTS Depositado (R$)</label>
                <input type="text" inputMode="numeric" placeholder="Ex: 8.000,00" value={fgtsDepositado}
                  onChange={e => setFgtsDepositado(e.target.value)}
                  className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1">Informar para calcular a multa corretamente</p>
              </div>
            </div>

            {erro && <p className="text-red-600 text-sm mb-4" role="alert">{erro}</p>}

            <button onClick={calcular}
              className="w-full py-4 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm mb-8"
              style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 8px 20px rgba(11,188,212,0.25)' }}>
              Calcular verbas rescisórias
            </button>

            {resultado && (
              <div className="rounded-2xl border border-gray-200 overflow-hidden mb-8">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <h2 className="font-black text-[#0f0e1a]" style={{ letterSpacing: '-0.01em' }}>Verbas Rescisórias — {tipoLabel[tipo]}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Tempo de serviço: {resultado.totalMeses} meses</p>
                </div>

                {[
                  { label: 'Saldo de Salário Proporcional', value: resultado.saldoSalario },
                  { label: '13º Salário Proporcional', value: resultado.decimoTerceiro },
                  { label: 'Férias Proporcionais + 1/3', value: resultado.feriasProporcionais },
                  { label: 'Férias Vencidas + 1/3', value: resultado.feriasVencidas },
                  { label: 'Aviso Prévio Indenizado', value: resultado.avisoPrevioValor },
                  { label: 'FGTS sobre Verbas Rescisórias (8%)', value: resultado.fgtsVerbas },
                  { label: `Multa FGTS (${tipo === 'sem_justa_causa' ? '40%' : tipo === 'acordo' ? '20%' : '0%'})`, value: resultado.multaFGTS },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-6 py-3.5 border-b border-gray-50 text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className={`font-semibold ${row.value === 0 ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatBRL(row.value)}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between items-center px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(11,188,212,0.06), rgba(61,59,142,0.06))' }}>
                  <span className="font-black text-[#0f0e1a] text-lg">Total a Receber (estimado)</span>
                  <span className="font-black text-2xl" style={{ color: '#0BBCD4', letterSpacing: '-0.02em' }}>{formatBRL(resultado.totalBruto)}</span>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #0f0e1a, #1a1830)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-black text-white mb-2">Precisa calcular uma rescisão real?</h3>
              <p className="text-gray-400 text-sm mb-4">Nossa equipe de RH calcula a rescisão completa e emite todos os documentos legais (TRCT, CAGED, eSocial).</p>
              <button onClick={() => openLead('Folha de Pagamento')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all hover:-translate-y-px text-sm"
                style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 6px 16px rgba(11,188,212,0.25)' }}>
                Falar com especialista em RH <ArrowRight size={15} />
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
