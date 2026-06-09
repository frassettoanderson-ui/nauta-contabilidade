'use client'

import Link from 'next/link'
import { ArrowLeft, KeyRound } from 'lucide-react'
import GridBackground from '@/components/sistema/GridBackground'

export default function RecuperarSenhaPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GridBackground />
      <section className="relative z-10 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.25)' }}>
          <KeyRound size={24} className="text-[#0BBCD4]" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">Recuperar senha</h1>
        <p className="text-gray-400 text-sm mb-6">
          A recuperação de senha por e-mail será habilitada em breve. Por enquanto, fale com o gerente para redefinir seu acesso.
        </p>
        <Link href="/sistema/login" className="inline-flex items-center gap-2 text-sm text-[#0BBCD4] hover:underline">
          <ArrowLeft size={15} /> Voltar ao login
        </Link>
      </section>
    </main>
  )
}
