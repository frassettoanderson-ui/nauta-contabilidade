'use client'

import { useState } from 'react'
import ToolShell from '@/components/ferramentas/ToolShell'
import { Card, Field, TextInput, Button, ResultRow } from '@/components/ferramentas/ui'
import { inssCLT, irrf, formatBRL, parseNum } from '@/lib/tool-calc'

export default function CalculadoraPjClt() {
  const [clt, setClt] = useState('')
  const [pj, setPj] = useState('')
  const [aliq, setAliq] = useState('6')
  const [contador, setContador] = useState('250')
  const [res, setRes] = useState<null | any>(null)

  function calcular() {
    const bruto = parseNum(clt)
    const brutoPj = parseNum(pj)
    if (bruto <= 0 && brutoPj <= 0) return
    // CLT
    const inss = inssCLT(bruto)
    const ir = irrf(Math.max(0, bruto - inss))
    const liquido = bruto - inss - ir
    const decimo = bruto / 12
    const terco = (bruto / 3) / 12
    const fgts = bruto * 0.08
    const remCLT = liquido + decimo + terco + fgts
    // PJ
    const imposto = brutoPj * (parseNum(aliq) / 100)
    const custoContador = parseNum(contador)
    const liquidoPj = brutoPj - imposto - custoContador
    setRes({ inss, ir, liquido, decimo, terco, fgts, remCLT, imposto, custoContador, liquidoPj, bruto, brutoPj })
  }

  return (
    <ToolShell
      crumb="Calculadora PJ x CLT"
      titulo={<>PJ <span style={{ color: '#0BBCD4' }}>x</span> CLT</>}
      descricao="Compare o quanto sobra como CLT (com benefícios) e como PJ (após impostos) para decidir o que compensa mais."
      wide
    >
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-white font-black mb-4">Cenário CLT</h3>
          <Field label="Salário bruto CLT (R$)">
            <TextInput inputMode="decimal" placeholder="5.000,00" value={clt} onChange={e => setClt(e.target.value)} />
          </Field>
        </Card>
        <Card>
          <h3 className="text-white font-black mb-4">Cenário PJ</h3>
          <div className="space-y-4">
            <Field label="Valor da nota / mês (R$)">
              <TextInput inputMode="decimal" placeholder="7.000,00" value={pj} onChange={e => setPj(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Imposto Simples (%)" hint="Anexo III ~6% a 15,5%">
                <TextInput inputMode="decimal" value={aliq} onChange={e => setAliq(e.target.value)} />
              </Field>
              <Field label="Contador (R$/mês)">
                <TextInput inputMode="decimal" value={contador} onChange={e => setContador(e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5"><Button onClick={calcular}>Comparar</Button></div>

      {res && (
        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <Card>
            <h3 className="text-white font-black mb-3">CLT — remuneração real</h3>
            <ResultRow label="Salário líquido" value={formatBRL(res.liquido)} />
            <ResultRow label="(+) 13º proporcional" value={formatBRL(res.decimo)} />
            <ResultRow label="(+) 1/3 de férias" value={formatBRL(res.terco)} />
            <ResultRow label="(+) FGTS (8%)" value={formatBRL(res.fgts)} />
            <ResultRow label="Total mensal equivalente" value={formatBRL(res.remCLT)} strong />
          </Card>
          <Card>
            <h3 className="text-white font-black mb-3">PJ — líquido</h3>
            <ResultRow label="Valor da nota" value={formatBRL(res.brutoPj)} />
            <ResultRow label="(-) Imposto Simples" value={'- ' + formatBRL(res.imposto)} />
            <ResultRow label="(-) Contador" value={'- ' + formatBRL(res.custoContador)} />
            <ResultRow label="Líquido no bolso" value={formatBRL(res.liquidoPj)} strong />
          </Card>
          <div className="md:col-span-2">
            <Card>
              <p className="text-center text-white text-lg font-bold">
                {res.liquidoPj >= res.remCLT
                  ? <>Como <span className="text-[#0BBCD4]">PJ</span> você tem <span className="text-[#0BBCD4]">{formatBRL(res.liquidoPj - res.remCLT)}</span> a mais por mês.</>
                  : <>Como <span className="text-[#0BBCD4]">CLT</span> você tem <span className="text-[#0BBCD4]">{formatBRL(res.remCLT - res.liquidoPj)}</span> a mais por mês.</>}
              </p>
              <p className="text-center text-xs text-gray-500 mt-3">
                Como PJ, lembre-se de recolher o INSS via pró-labore e reservar 13º e férias por conta própria. Fale com a Nauta para o cenário ideal.
              </p>
            </Card>
          </div>
        </div>
      )}
    </ToolShell>
  )
}
