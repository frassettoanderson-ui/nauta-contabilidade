'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, FileText, Tag, FolderOpen, LogOut, Plus } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0918' }}>
        <div className="w-8 h-8 border-2 border-[#0BBCD4] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const navItems = [
    { href: '/admin/blog', label: 'Posts', icon: FileText },
    { href: '/admin/blog/categorias', label: 'Categorias', icon: FolderOpen },
    { href: '/admin/blog/tags', label: 'Tags', icon: Tag },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0918' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0BBCD4, #3D3B8E)' }}>
              <LayoutDashboard size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Admin</p>
              <p className="text-gray-600 text-xs">Nauta Blog</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin/blog/novo"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white mb-4 transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            <Plus size={14} /> Novo artigo
          </Link>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: pathname === href ? 'rgba(11,188,212,0.12)' : 'transparent',
                color: pathname === href ? '#0BBCD4' : '#9ca3af',
                border: pathname === href ? '1px solid rgba(11,188,212,0.2)' : '1px solid transparent',
              }}>
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 w-full transition-colors">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
