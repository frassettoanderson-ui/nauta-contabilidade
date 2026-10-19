'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function SemAcessoPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(209,91,71,0.12)', color: '#d15b47' }}>
          <Lock size={26} />
        </div>
        <h1 className="text-xl font-black" style={{ color: '#0e2240' }}>Sem acesso a esta tela</h1>
        <p className="mt-2 text-sm" style={{ color: '#64748b' }}>Seu nível de usuário não permite abrir esta área. Se precisar dela, peça a liberação ao administrador.</p>
        <Link href="/sistema" className="mt-6 inline-flex h-10 items-center rounded-xl px-5 text-sm font-bold" style={{ background: '#F47920', color: '#fff' }}>Voltar ao início</Link>
      </div>
    </div>
  )
}
