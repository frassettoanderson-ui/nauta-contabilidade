'use client'

import { useState, useMemo } from 'react'
import ToolShell from '@/components/ferramentas/ToolShell'
import { Card, TextInput } from '@/components/ferramentas/ui'
import { CNAES } from '@/lib/cnaes'
import { Search } from 'lucide-react'

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function ConsultaCnae() {
  const [q, setQ] = useState('')
  const resultados = useMemo(() => {
    const t = norm(q.trim())
    if (!t) return CNAES.slice(0, 12)
    return CNAES.filter(c => norm(c.descricao).includes(t) || c.codigo.replace(/\D/g, '').includes(t.replace(/\D/g, '')))
  }, [q])

  return (
    <ToolShell
      crumb="Consulta de CNAE"
      titulo={<>Consulta de <span style={{ color: '#0BBCD4' }}>CNAE</span></>}
      descricao="Busque o código CNAE da sua atividade e veja em qual anexo do Simples Nacional ela se enquadra."
      wide
    >
      <Card>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Digite a atividade ou o código (ex.: cabeleireiro, 6201)"
            className="w-full h-12 pl-11 pr-4 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0BBCD4]/30"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
        </div>
      </Card>

      <div className="mt-5 space-y-3">
        {resultados.length === 0 && <p className="text-gray-500 text-sm text-center py-8">Nenhum CNAE encontrado. Fale com a Nauta para confirmar o código da sua atividade.</p>}
        {resultados.map(c => (
          <div key={c.codigo} className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[#0BBCD4] font-black text-sm shrink-0 w-24">{c.codigo}</span>
            <span className="text-gray-200 text-sm flex-1">{c.descricao}</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ color: '#0BBCD4', background: 'rgba(11,188,212,0.10)', border: '1px solid rgba(11,188,212,0.22)' }}>
              Anexo {c.anexo}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-5 text-center">Lista com as atividades mais comuns. A tabela oficial tem mais de 1.300 CNAEs — a Nauta confirma o ideal para o seu negócio.</p>
    </ToolShell>
  )
}
