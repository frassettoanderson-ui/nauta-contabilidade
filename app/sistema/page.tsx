'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Loader2, LogOut, Construction } from 'lucide-react'

export default function SistemaHome() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sistema/login')
  }, [status, router])

  if (status !== 'authenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0918' }}>
        <Loader2 size={28} className="animate-spin text-[#0BBCD4]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#0a0918' }}>
      <header className="flex items-center justify-between px-5 h-14 border-b border-white/8">
        <Image src="/logo-branca.png" alt="Nauta" width={130} height={40} className="h-8 w-auto object-contain" />
        <button
          onClick={() => signOut({ callbackUrl: '/sistema/login' })}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={15} /> Sair
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.25)' }}>
          <Construction size={24} className="text-[#0BBCD4]" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Bem-vindo ao Sistema Nauta</h1>
        <p className="text-gray-400 text-sm">
          Conectado como <span className="text-[#0BBCD4]">{session.user?.email}</span>
        </p>
        <p className="text-gray-500 text-sm mt-4">
          O menu lateral e o módulo Comercial serão construídos nas próximas etapas.
        </p>
      </div>
    </main>
  )
}
