'use client'

import { Percent, Construction } from 'lucide-react'

// Comissões do comercial — estrutura em construção. As regras (base de cálculo,
// recorrência, % por vendedor, quem é o vendedor) ainda serão definidas.
export default function ComissoesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Percent size={22} className="text-[color:var(--sys-accent)]" /> Comissões
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Comissionamento da equipe comercial.</p>
      </div>

      <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <Construction size={36} className="mx-auto mb-3 text-[color:var(--sys-accent)] opacity-80" />
        <p className="text-white font-bold">Em construção</p>
        <p className="text-gray-500 text-sm mt-1">As regras de comissão ainda serão definidas. Esta tela receberá o cálculo, o extrato por vendedor e o fechamento mensal.</p>
      </div>
    </div>
  )
}
