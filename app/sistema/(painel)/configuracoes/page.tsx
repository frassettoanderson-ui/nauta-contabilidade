'use client'

import { Settings, Construction } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Settings size={22} className="text-[#0BBCD4]" /> Configurações
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Preferências e ajustes do sistema</p>
      </div>

      <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Construction size={28} className="text-[#0BBCD4] mx-auto mb-3" />
        <p className="text-white font-bold mb-1">Em construção</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Configurações gerais do escritório, setores e integrações aparecerão aqui conforme avançarmos.
        </p>
      </div>
    </div>
  )
}
