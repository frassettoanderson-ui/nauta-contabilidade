'use client'

import { useState } from 'react'
import ToolShell from '@/components/ferramentas/ToolShell'
import { Card, Field, Select, Button, ResultRow } from '@/components/ferramentas/ui'
import { formatBRL } from '@/lib/tool-calc'

export default function CustoAbrirCnpj() {
  const [tipo, setTipo] = useState('mei')
  const [ativ, setAtiv] = useState('servico')
  const [res, setRes] = useState<null | { itens: [string, number, number][]; min: number; max: number; mei: boolean }>(null)

  function calcular() {
    if (tipo === 'mei') {
      setRes({ mei: true, itens: [['Abertura do MEI (Portal do Empreendedor)', 0, 0], ['DAS mensal (INSS + ICMS/ISS)', 71, 81]], min: 0, max: 0 })
      return
    }
    const comercio = ativ === 'comercio'
    const itens: [string, number, number][] = [
      ['Registro na Junta Comercial', 150, 400],
      ['Inscrição municipal / Alvará', 100, 300],
      ['Certificado digital e-CNPJ', 150, 250],
      ['Honorários de abertura (contador)', 0, 600],
    ]
    if (comercio) itens.splice(2, 0, ['Inscrição estadual (ICMS)', 0, 0])
    const min = itens.reduce((a, [, l]) => a + l, 0)
    const max = itens.reduce((a, [, , h]) => a + h, 0)
    setRes({ mei: false, itens, min, max })
  }

  return (
    <ToolShell
      crumb="Custo para abrir CNPJ"
      titulo={<>Custo para abrir <span style={{ color: '#0BBCD4' }}>CNPJ</span></>}
      descricao="Estime quanto custa abrir sua empresa conforme o tipo e a atividade. Com a Nauta, a abertura da contabilidade é grátis."
    >
      <Card>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <Field label="Tipo de empresa">
            <Select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="mei">MEI</option>
              <option value="me">ME / Microempresa</option>
              <option value="ltda">LTDA / Sociedade Limitada</option>
            </Select>
          </Field>
          <Field label="Atividade principal">
            <Select value={ativ} onChange={e => setAtiv(e.target.value)}>
              <option value="servico">Serviços</option>
              <option value="comercio">Comércio / Indústria</option>
            </Select>
          </Field>
        </div>
        <Button onClick={calcular}>Estimar custo</Button>
      </Card>

      {res && (
        <div className="mt-6"><Card>
          <h3 className="text-white font-black text-lg mb-4">Estimativa de custo</h3>
          {res.itens.map(([nome, l, h]) => (
            <ResultRow key={nome} label={nome} value={l === 0 && h === 0 ? 'Grátis' : `${formatBRL(l)} – ${formatBRL(h)}`} />
          ))}
          {!res.mei && <ResultRow label="Total estimado" value={`${formatBRL(res.min)} – ${formatBRL(res.max)}`} strong />}
          {res.mei && <p className="text-[#0BBCD4] font-bold mt-3">Abrir MEI é gratuito. Você paga apenas o DAS mensal.</p>}
          <p className="text-xs text-gray-500 mt-4">Valores variam por estado e município. A Nauta abre a sua empresa sem cobrar honorários de abertura.</p>
        </Card></div>
      )}
    </ToolShell>
  )
}
