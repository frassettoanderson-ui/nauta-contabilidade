'use client'

import { Users, Construction } from 'lucide-react'

export default function UsuariosPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Users size={22} className="text-[#0BBCD4]" /> Usuários
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie os acessos do escritório por setor e permissão</p>
      </div>

      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <Construction size={28} className="text-[#0BBCD4] mx-auto mb-3" />
        <p className="text-white font-bold mb-1">Em construção</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Aqui o gerente vai cadastrar usuários, definir o setor (Comercial, Fiscal, etc.) e liberar as funções de cada um. Próxima etapa da fundação.
        </p>
      </div>
    </div>
  )
}
