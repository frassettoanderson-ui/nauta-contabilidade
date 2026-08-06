'use client'

import { useState } from 'react'
import ToolShell from '@/components/ferramentas/ToolShell'
import { Card, Field, TextInput, Button, ResultRow } from '@/components/ferramentas/ui'
import { inssAutonomo, irrf, formatBRL, parseNum } from '@/lib/tool-calc'

const DEDUCAO_DEP = 189.59

export default function CalculadoraRPA() {
  const [bruto, setBruto] = useState('')
  const [iss, setIss] = useState('')
  const [dep, setDep] = useState('0')
  const [res, setRes] = useState<null | { inss: number; irrf: number; issV: number; liquido: number; bruto: number }>(null)

  function calcular() {
    const b = parseNum(bruto)
    if (b <= 0) return
    const inss = inssAutonomo(b)
    const baseIr = Math.max(0, b - inss - Number(dep || 0) * DEDUCAO_DEP)
    const ir = irrf(baseIr)
    const issV = b * (parseNum(iss) / 100)
    setRes({ inss, irrf: ir, issV, liquido: b - inss - ir - issV, bruto: b })
  }

  return (
    <ToolShell
      crumb="Calculadora de RPA"
      titulo={<>Calculadora de <span style={{ color: '#0BBCD4' }}>RPA</span></>}
      descricao="Calcule o líquido de um Recibo de Pagamento Autônomo (RPA) com os descontos de INSS, Imposto de Renda e ISS."
    >
      <Card>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <Field label="Valor bruto (R$)">
            <TextInput inputMode="decimal" placeholder="3.000,00" value={bruto} onChange={e => setBruto(e.target.value)} />
          </Field>
          <Field label="Dependentes" hint="Dedução IRRF">
            <TextInput inputMode="numeric" value={dep} onChange={e => setDep(e.target.value)} />
          </Field>
          <Field label="ISS (%)" hint="Se o município retiver">
            <TextInput inputMode="decimal" placeholder="0" value={iss} onChange={e => setIss(e.target.value)} />
          </Field>
        </div>
        <Button onClick={calcular}>Calcular RPA</Button>
      </Card>

      {res && (
        <div className="mt-6"><Card>
          <h3 className="text-white font-black text-lg mb-4">Resultado</h3>
          <ResultRow label="Valor bruto" value={formatBRL(res.bruto)} />
          <ResultRow label="(-) INSS (11%)" value={'- ' + formatBRL(res.inss)} />
          <ResultRow label="(-) IRRF" value={'- ' + formatBRL(res.irrf)} />
          {res.issV > 0 && <ResultRow label="(-) ISS" value={'- ' + formatBRL(res.issV)} />}
          <ResultRow label="Valor líquido a receber" value={formatBRL(res.liquido)} strong />
        </Card></div>
      )}
    </ToolShell>
  )
}
