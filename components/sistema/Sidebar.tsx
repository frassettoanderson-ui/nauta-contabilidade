'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { effectivePerms, podeVer } from '@/lib/menu-perms'
import {
  Users, UserPlus, Search, FileText, FilePlus, FileClock, FileSearch,
  Briefcase, LayoutGrid, Inbox, BarChart3, TrendingUp, Calculator, UserCog,
  Rocket, LayoutDashboard, Repeat, Building2, BadgeMinus, Wallet, Vote,
  LogOut, ChevronDown, Menu, X, type LucideIcon,
} from 'lucide-react'

interface NavLeaf { label: string; href: string; icon: LucideIcon }
interface NavGroup { label: string; icon: LucideIcon; children: NavLeaf[]; highlight?: boolean }
type NavItem = NavLeaf | NavGroup

const NAV: NavItem[] = [
  { label: 'Onboarding', icon: Rocket, highlight: true, children: [
    { label: 'Dashboard',               href: '/sistema/onboarding',                          icon: LayoutDashboard },
    { label: 'Trocar de contador',      href: '/sistema/onboarding/trocar-de-contador',       icon: Repeat },
    { label: 'Abrir minha empresa',     href: '/sistema/onboarding/abrir-empresa',            icon: Building2 },
    { label: 'Deixar de ser MEI',       href: '/sistema/onboarding/deixar-mei',               icon: BadgeMinus },
    { label: 'BPO Financeiro',          href: '/sistema/onboarding/bpo-financeiro',           icon: Wallet },
    { label: 'Contabilidade Eleitoral', href: '/sistema/onboarding/contabilidade-eleitoral',  icon: Vote },
  ] },
  { label: 'Clientes', icon: Users, children: [
    { label: 'Cadastrar', href: '/sistema/clientes/cadastrar', icon: UserPlus },
    { label: 'Consultar', href: '/sistema/clientes/consultar', icon: Search },
  ] },
  { label: 'Geração de Contrato', icon: FileText, children: [
    { label: 'Gerar Contrato',     href: '/sistema/contratos/gerar',     icon: FilePlus },
    { label: 'Em Andamento',       href: '/sistema/contratos/andamento', icon: FileClock },
    { label: 'Consultar Contrato', href: '/sistema/contratos/consultar', icon: FileSearch },
  ] },
  { label: 'Comercial', icon: Briefcase, children: [
    { label: 'Kanban', href: '/sistema/comercial/kanban', icon: LayoutGrid },
    { label: 'Leads',  href: '/sistema/comercial/leads',  icon: Inbox },
  ] },
  { label: 'Relatórios', icon: BarChart3, children: [
    { label: 'Conversão', href: '/sistema/relatorios/conversao', icon: TrendingUp },
  ] },
  { label: 'Fiscal',  href: '/sistema/fiscal',  icon: Calculator },
  { label: 'Pessoal', href: '/sistema/pessoal', icon: Users },
  { label: 'Usuários', icon: UserCog, children: [
    { label: 'Criar Usuário', href: '/sistema/usuarios/criar', icon: UserPlus },
    { label: 'Consultar',     href: '/sistema/usuarios/consultar', icon: Search },
  ] },
]

function isGroup(i: NavItem): i is NavGroup {
  return (i as NavGroup).children !== undefined
}

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const su = session?.user as unknown as { role?: string; menuPerms?: string[] | null } | undefined
  const perms = effectivePerms(su?.role ?? '', su?.menuPerms ?? null)

  // Filtra o menu pelas permissões do usuário (grupos somem se nenhum filho for visível)
  const nav: NavItem[] = NAV
    .map(item => {
      if (isGroup(item)) {
        const children = item.children.filter(c => podeVer(perms, c.href))
        return children.length ? { ...item, children } : null
      }
      return podeVer(perms, item.href) ? item : null
    })
    .filter((i): i is NavItem => i !== null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(
    NAV.filter(isGroup).filter(g => g.children.some(c => pathname.startsWith(c.href))).map(g => g.label)
  )

  const toggleGroup = (label: string) =>
    setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label])

  const itemBase = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150'

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 shrink-0">
        <Link href="/sistema"><Image src="/logo-branca.png" alt="Nauta" width={130} height={40} className="h-8 w-auto object-contain" /></Link>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-gray-400" aria-label="Fechar menu"><X size={20} /></button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {nav.map(item => {
          if (isGroup(item)) {
            const open = openGroups.includes(item.label)
            const activeChild = item.children.some(c => pathname === c.href)
            if (item.highlight) {
              return (
                <div key={item.label} className="mb-2">
                  <button onClick={() => toggleGroup(item.label)} className={`${itemBase} nav-onboarding w-full justify-between`}>
                    <span className="flex items-center gap-3 nav-onboarding-text">
                      <item.icon size={18} className="nav-onboarding-icon" /> {item.label}
                    </span>
                    <ChevronDown size={14} className={`nav-onboarding-text transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="mt-1 ml-3 pl-3 space-y-1 border-l border-[#0BBCD4]/20">
                      {item.children.map(c => {
                        const active = pathname === c.href
                        return (
                          <Link key={c.href} href={c.href} onClick={() => setMobileOpen(false)} className={itemBase}
                            style={{ background: active ? 'rgba(11,188,212,0.12)' : 'transparent', color: active ? '#0BBCD4' : '#9ca3af', border: active ? '1px solid rgba(11,188,212,0.2)' : '1px solid transparent' }}>
                            <c.icon size={16} /> {c.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <div key={item.label}>
                <button onClick={() => toggleGroup(item.label)} className={`${itemBase} w-full justify-between`} style={{ color: activeChild ? '#0BBCD4' : '#9ca3af' }}>
                  <span className="flex items-center gap-3"><item.icon size={17} /> {item.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="mt-1 ml-3 pl-3 space-y-1 border-l border-white/8">
                    {item.children.map(c => {
                      const active = pathname === c.href
                      return (
                        <Link key={c.href} href={c.href} onClick={() => setMobileOpen(false)} className={itemBase}
                          style={{ background: active ? 'rgba(11,188,212,0.12)' : 'transparent', color: active ? '#0BBCD4' : '#9ca3af', border: active ? '1px solid rgba(11,188,212,0.2)' : '1px solid transparent' }}>
                          <c.icon size={16} /> {c.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={itemBase}
              style={{ background: active ? 'rgba(11,188,212,0.12)' : 'transparent', color: active ? '#0BBCD4' : '#9ca3af', border: active ? '1px solid rgba(11,188,212,0.2)' : '1px solid transparent' }}>
              <item.icon size={17} /> {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/8 shrink-0">
        <div className="px-3 py-2 mb-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Conectado</p>
          <p className="text-xs text-gray-400 truncate">{email ?? '—'}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/sistema/login' })} className={`${itemBase} w-full text-gray-500 hover:text-red-400`}>
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 bg-[#0c0b18] border-b border-white/8">
        <Image src="/logo-branca.png" alt="Nauta" width={120} height={36} className="h-7 w-auto object-contain" />
        <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-300" aria-label="Abrir menu"><Menu size={22} /></button>
      </div>

      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 z-30 flex-col" style={{ background: '#0c0b18', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72" style={{ background: '#0c0b18', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
