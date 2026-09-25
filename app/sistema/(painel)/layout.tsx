'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import Sidebar from '@/components/sistema/Sidebar'
import Topbar from '@/components/sistema/Topbar'
import ForcePasswordChange from '@/components/sistema/ForcePasswordChange'
import ReminderWatcher from '@/components/sistema/ReminderWatcher'

// Layout do sistema no padrão do Obrigô (gestor-oa/web/src/components/Layout.tsx):
// sidebar marinho fixa + coluna de conteúdo com topbar marinho, fundo #f3f5f9,
// zoom 1.2 e animação page-anim a cada troca de rota. Tema claro único.
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sistema/login')
  }, [status, router])

  if (status !== 'authenticated') {
    return (
      <div className="sys-theme min-h-screen flex items-center justify-center" style={{ background: 'var(--sys-bg)' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#F47920' }} />
      </div>
    )
  }

  const mustChange = (session.user as unknown as { mustChangePassword?: boolean })?.mustChangePassword

  // O módulo Obrigô (/sistema/obrigo/*) tem router próprio: não remontar a cada troca de
  // tela interna (a animação por rota é feita lá dentro).
  const animKey = pathname.startsWith('/sistema/obrigo') ? '/sistema/obrigo' : pathname

  return (
    <div className="sys-theme h-screen overflow-hidden" style={{ background: 'var(--sys-bg)' }}>
      <Sidebar email={session.user?.email} />
      {/* Conteúdo: deslocado pela sidebar no desktop; topbar mobile do menu no celular.
          Coluna de altura fixa com rolagem no conteúdo (como o <main> do Obrigô). */}
      <div className="sys-content pt-14 lg:pt-0 h-screen flex flex-col">
        <Topbar />
        <div className="sys-zoom flex-1 overflow-y-auto">
          <div key={animKey} className="page-anim h-full">
            {children}
          </div>
        </div>
      </div>
      {mustChange && <ForcePasswordChange />}
      <ReminderWatcher />
    </div>
  )
}
