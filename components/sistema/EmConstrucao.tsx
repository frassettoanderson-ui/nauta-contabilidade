'use client'

import { Construction, type LucideIcon } from 'lucide-react'

export default function EmConstrucao({ titulo, descricao, icon: Icon = Construction }: { titulo: string; descricao?: string; icon?: LucideIcon }) {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Icon size={22} className="text-[#0BBCD4]" /> {titulo}
        </h1>
      </div>
      <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <Construction size={28} className="text-[#0BBCD4] mx-auto mb-3" />
        <p className="text-white font-bold mb-1">Em construção</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto">{descricao ?? 'Este módulo será desenvolvido em breve.'}</p>
      </div>
    </div>
  )
}
