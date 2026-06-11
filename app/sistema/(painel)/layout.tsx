'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import Sidebar from '@/components/sistema/Sidebar'
import ForcePasswordChange from '@/components/sistema/ForcePasswordChange'
import ReminderWatcher from '@/components/sistema/ReminderWatcher'
import ChatButton from '@/components/sistema/ChatButton'
import ProfileButton from '@/components/sistema/ProfileButton'
import { getTema, onPrefsChange, type Tema } from '@/lib/sys-prefs'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tema, setTemaState] = useState<Tema>('dark')

  useEffect(() => {
    setTemaState(getTema())
    return onPrefsChange(() => setTemaState(getTema()))
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sistema/login')
  }, [status, router])

  const themeClass = `sys-theme ${tema === 'light' ? 'theme-light' : ''}`

  if (status !== 'authenticated') {
    return (
      <div className={`${themeClass} min-h-screen flex items-center justify-center`} style={{ background: 'var(--sys-bg)' }}>
        <Loader2 size={28} className="animate-spin text-[#0BBCD4]" />
      </div>
    )
  }

  const mustChange = (session.user as unknown as { mustChangePassword?: boolean })?.mustChangePassword

  return (
    <div className={`${themeClass} min-h-screen`} style={{ background: 'var(--sys-bg)' }}>
      <Sidebar email={session.user?.email} />
      <ProfileButton />
      <ChatButton />
      {/* Conteúdo: deslocado pela sidebar no desktop; topbar no mobile */}
      <div className="lg:pl-64 pt-14 lg:pt-0">
        {children}
      </div>
      {mustChange && <ForcePasswordChange />}
      <ReminderWatcher />
    </div>
  )
}
