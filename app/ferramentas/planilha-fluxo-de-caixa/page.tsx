'use client'

import ToolShell from '@/components/ferramentas/ToolShell'
import { Card } from '@/components/ferramentas/ui'
import { Download, Check } from 'lucide-react'

const BENEFICIOS = [
  'Entradas e saídas organizadas por mês',
  'Saldo do mês e saldo acumulado automáticos',
  'Categorias prontas (vendas, fornecedores, folha, impostos)',
  'Pronta para usar no Excel ou Google Sheets',
]

export default function PlanilhaFluxoDeCaixa() {
  return (
    <ToolShell
      crumb="Planilha de fluxo de caixa"
      titulo={<>Planilha de <span style={{ color: '#0BBCD4' }}>fluxo de caixa</span></>}
      descricao="Baixe grátis uma planilha pronta para controlar as entradas e saídas do seu negócio mês a mês."
    >
      <Card>
        <ul className="space-y-2.5 mb-6">
          {BENEFICIOS.map(b => (
            <li key={b} className="flex items-center gap-2.5 text-gray-200 text-sm">
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(11,188,212,0.15)' }}>
                <Check size={12} className="text-[#0BBCD4]" />
              </span>
              {b}
            </li>
          ))}
        </ul>
        <a href="/planilhas/fluxo-de-caixa.xlsx" download
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: '#0BBCD4', boxShadow: '0 8px 24px rgba(11,188,212,0.25)' }}>
          <Download size={17} /> Baixar planilha grátis (.xlsx)
        </a>
      </Card>
    </ToolShell>
  )
}
