'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, FileText, Tag, Folder, LogOut, Plus, ChevronRight, Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<{ email?: string } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/admin/login')
      } else {
        setUser(data.session.user)
        setChecking(false)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/admin/login')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0918' }}>
        <Loader2 size={28} className="animate-spin text-[#0BBCD4]" />
      </div>
    )
  }

  const navItems = [
    { href: '/admin/blog',             icon: FileText, label: 'Posts' },
    { href: '/admin/blog/categorias',  icon: Folder,   label: 'Categorias' },
    { href: '/admin/blog/tags',        icon: Tag,      label: 'Tags' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: '#07060f' }}>
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col border-r"
        style={{ background: '#0c0b1a', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(11,188,212,0.15)' }}>
              <LayoutDashboard size={14} className="text-[#0BBCD4]" />
            </div>
            <span className="text-white text-sm font-bold">Nauta Admin</span>
          </Link>
          <p className="text-gray-600 text-xs mt-1 truncate">{user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
              style={{ color: '#9ca3af' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Ações rápidas */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link
            href="/admin/blog/novo"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-white mb-2 transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 4px 16px rgba(11,188,212,0.2)' }}
          >
            <Plus size={15} />
            Novo artigo
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
