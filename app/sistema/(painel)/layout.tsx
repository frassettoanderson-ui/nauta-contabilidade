'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import Sidebar from '@/components/sistema/Sidebar'
import ForcePasswordChange from '@/components/sistema/ForcePasswordChange'
import ReminderWatcher from '@/components/sistema/ReminderWatcher'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sistema/login')
  }, [status, router])

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0918' }}>
        <Loader2 size={28} className="animate-spin text-[#0BBCD4]" />
      </div>
    )
  }

  const mustChange = (session.user as unknown as { mustChangePassword?: boolean })?.mustChangePassword

  return (
    <div className="min-h-screen" style={{ background: '#0a0918' }}>
      <Sidebar email={session.user?.email} />
      {/* Conteúdo: deslocado pela sidebar no desktop; topbar no mobile */}
      <div className="lg:pl-64 pt-14 lg:pt-0">
        {children}
      </div>
      {mustChange && <ForcePasswordChange />}
      <ReminderWatcher />
    </div>
  )
}
