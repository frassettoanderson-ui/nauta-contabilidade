'use client'

import { useState } from 'react'
import ToolShell from '@/components/ferramentas/ToolShell'
import { Card, Field, TextInput, Button, ResultRow } from '@/components/ferramentas/ui'
import { formatBRL, parseNum } from '@/lib/tool-calc'

// Referência do IVA dual (CBS + IBS). Alíquota de referência estimada ~26,5%.
const CBS = 0.088
const IBS = 0.177

export default function ReformaTributaria() {
  const [fat, setFat] = useState('')
  const [insumos, setInsumos] = useState('')
  const [res, setRes] = useState<null | { base: number; cbs: number; ibs: number; total: number; fat: number }>(null)

  function calcular() {
    const f = parseNum(fat)
    if (f <= 0) return
    const base = Math.max(0, f - parseNum(insumos)) // valor agregado (com crédito sobre insumos)
    const cbs = base * CBS
    const ibs = base * IBS
    setRes({ base, cbs, ibs, total: cbs + ibs, fat: f })
  }

  return (
    <ToolShell
      crumb="Reforma Tributária"
      titulo={<>Simulador da <span style={{ color: '#0BBCD4' }}>Reforma Tributária</span></>}
      descricao="Estime a carga do novo IVA dual (CBS + IBS) que substitui PIS, COFINS, ISS e ICMS. Estimativa em transição (2026–2033)."
    >
      <Card>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <Field label="Faturamento mensal (R$)">
            <TextInput inputMode="decimal" placeholder="50.000,00" value={fat} onChange={e => setFat(e.target.value)} />
          </Field>
          <Field label="Custos com insumos (R$)" hint="Geram crédito de IVA">
            <TextInput inputMode="decimal" placeholder="0,00" value={insumos} onChange={e => setInsumos(e.target.value)} />
          </Field>
        </div>
        <Button onClick={calcular}>Estimar IVA</Button>
      </Card>

      {res && (
        <div className="mt-6"><Card>
          <h3 className="text-white font-black text-lg mb-4">Estimativa do novo IVA dual</h3>
          <ResultRow label="Faturamento" value={formatBRL(res.fat)} />
          <ResultRow label="Base (valor agregado)" value={formatBRL(res.base)} />
          <ResultRow label="CBS (federal ~8,8%)" value={formatBRL(res.cbs)} />
          <ResultRow label="IBS (estadual/municipal ~17,7%)" value={formatBRL(res.ibs)} />
          <ResultRow label="Total estimado de IVA" value={formatBRL(res.total)} strong />
          <p className="text-xs text-gray-500 mt-4">
            ⚠️ Estimativa simplificada com a alíquota de referência (~26,5%). As alíquotas finais, o regime de créditos e a transição (2026–2033) ainda estão sendo regulamentados e variam por setor. Não considera o Simples Nacional. Fale com a Nauta para o impacto real no seu negócio.
          </p>
        </Card></div>
      )}
    </ToolShell>
  )
}
