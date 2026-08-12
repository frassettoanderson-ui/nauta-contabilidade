'use client'

import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import GridBackground from '@/components/sistema/GridBackground'

export default function CriarUsuarioPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GridBackground />
      <section className="relative z-10 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'color-mix(in srgb, var(--sys-accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--sys-accent) 25%, transparent)' }}>
          <UserPlus size={24} className="text-[color:var(--sys-accent)]" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">Criar usuário</h1>
        <p className="text-gray-400 text-sm mb-6">
          O cadastro de usuários será feito pelo gerente dentro do painel de administração. Em breve.
        </p>
        <Link href="/sistema/login" className="inline-flex items-center gap-2 text-sm text-[color:var(--sys-accent)] hover:underline">
          <ArrowLeft size={15} /> Voltar ao login
        </Link>
      </section>
    </main>
  )
}
