'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { effectivePerms, podeVer } from '@/lib/menu-perms'
import { getComercialStatus } from '@/lib/api'
import { getSomAtivo } from '@/lib/sys-prefs'
import {
  Users, UserPlus, Search, FileText, FilePlus, FileClock, FileSearch,
  Briefcase, LayoutGrid, Inbox, BarChart3, TrendingUp, Calculator, UserCog, Building2,
  Rocket, Settings, DollarSign, LayoutDashboard, MessageCircle,
  ArrowDownCircle, ArrowUpCircle, Repeat, CalendarCheck, Target, UserX, Percent, AlertTriangle, Receipt,
  RefreshCw, ChevronRight, Menu, X, Home, User, HelpCircle, Power, type LucideIcon,
} from 'lucide-react'

const GESTOROA_URL = '/api/sso/gestoroa'

// Paleta EXATA do menu do Obrigô (estilo "marinho" — gestor-oa/web/src/index.css)
const MVARS = {
  '--m-sbg': '#0e2240',
  '--m-bg': '#13294b',
  '--m-bd': '#1f3a5f',
  '--m-fg': '#aebed6',
  '--m-ic': '#7e93b5',
  '--m-hv': '#173052',
  '--m-abg': '#16335a',
  '--m-afg': '#f89244',
  '--m-acc': '#f47920',
  '--m-title': '#ffffff',
  fontFamily: "'Poppins', system-ui, sans-serif",
} as unknown as React.CSSProperties

interface NavLeaf { label: string; href: string; icon: LucideIcon; highlight?: boolean; external?: boolean }
interface NavGroup { label: string; icon: LucideIcon; children: NavLeaf[]; highlight?: boolean }
type NavItem = NavLeaf | NavGroup

const NAV: NavItem[] = [
  { label: 'Onboarding', href: '/sistema/onboarding', icon: Rocket },
  { label: 'Dashboard',  href: '/sistema', icon: LayoutDashboard },
  { label: 'Clientes', icon: Users, children: [
    { label: 'Cadastrar', href: '/sistema/clientes/cadastrar', icon: UserPlus },
    { label: 'Consultar', href: '/sistema/clientes/consultar', icon: Search },
    { label: 'Atualizar clientes', href: '/sistema/clientes/atualizar', icon: RefreshCw },
    { label: 'Inativos',  href: '/sistema/clientes/inativos',  icon: UserX },
  ] },
  { label: 'Geração de Contrato', icon: FileText, children: [
    { label: 'Gerar Contrato',     href: '/sistema/contratos/gerar',     icon: FilePlus },
    { label: 'Em Andamento',       href: '/sistema/contratos/andamento', icon: FileClock },
    { label: 'Consultar Contrato', href: '/sistema/contratos/consultar', icon: FileSearch },
  ] },
  { label: 'Comercial', icon: Briefcase, children: [
    { label: 'CRM',   href: '/sistema/comercial/kanban', icon: LayoutGrid },
    { label: 'Leads', href: '/sistema/comercial/leads',  icon: Inbox },
    { label: 'Cadastrar meta', href: '/sistema/comercial/meta', icon: Target },
    { label: 'Comissões', href: '/sistema/comercial/comissoes', icon: Percent },
  ] },
  { label: 'Relatórios', icon: BarChart3, children: [
    { label: 'Conversão', href: '/sistema/relatorios/conversao', icon: TrendingUp },
    { label: 'Empresas', href: '/sistema/relatorios/empresas', icon: Building2 },
  ] },
  { label: 'Fiscal',     href: '/sistema/fiscal',     icon: Calculator },
  { label: 'Pessoal',    href: '/sistema/pessoal',    icon: Users },
  { label: 'Obrigô',     href: GESTOROA_URL, icon: CalendarCheck, external: true },
  { label: 'Financeiro', icon: DollarSign, children: [
    { label: 'Faturamento',    href: '/sistema/financeiro/faturamento',    icon: DollarSign },
    { label: 'Cobrança',       href: '/sistema/financeiro/cobranca',       icon: AlertTriangle },
    { label: 'Lançar Entrada', href: '/sistema/financeiro/lancar-entrada',  icon: ArrowDownCircle },
    { label: 'Lançar Despesa', href: '/sistema/financeiro/lancar-despesa',  icon: ArrowUpCircle },
    { label: 'Despesas Fixas', href: '/sistema/financeiro/despesas-fixas',  icon: Repeat },
    { label: 'Contas a Pagar', href: '/sistema/financeiro/contas-a-pagar', icon: Receipt },
  ] },
  { label: 'Configurações', href: '/sistema/configuracoes', icon: Settings },
  { label: 'Usuários', icon: UserCog, children: [
    { label: 'Criar Usuário',      href: '/sistema/usuarios/criar', icon: UserPlus },
    { label: 'Consultar',          href: '/sistema/usuarios/consultar', icon: Search },
    { label: 'Histórico de chat',  href: '/sistema/usuarios/historico-chat', icon: MessageCircle },
  ] },
]

function isGroup(i: NavItem): i is NavGroup { return (i as NavGroup).children !== undefined }

// Logo/wordmark provisório da Atuan (troca pela logo oficial quando o arquivo chegar).
function LogoAtuan() {
  return (
    <span className="leading-none select-none text-center">
      <span className="block text-2xl font-extrabold text-white tracking-tight">Atuan</span>
      <span className="block text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--m-acc)' }}>Contabilidade</span>
    </span>
  )
}

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const su = session?.user as unknown as { role?: string; menuPerms?: string[] | null } | undefined
  const perms = effectivePerms(su?.role ?? '', su?.menuPerms ?? null)

  const nav: NavItem[] = NAV
    .map(item => {
      if (isGroup(item)) {
        const children = item.children.filter(c => podeVer(perms, c.href))
        return children.length ? { ...item, children } : null
      }
      return (item.external || podeVer(perms, item.href)) ? item : null
    })
    .filter((i): i is NavItem => i !== null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [comNovos, setComNovos] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(
    NAV.filter(isGroup).filter(g => g.children.some(c => pathname.startsWith(c.href))).map(g => g.label)
  )
  const [fly, setFly] = useState<{ label: string; top: number } | null>(null)
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abrirFly = (label: string, top: number) => { if (flyTimer.current) clearTimeout(flyTimer.current); setFly({ label, top }) }
  const fecharFly = () => { if (flyTimer.current) clearTimeout(flyTimer.current); flyTimer.current = setTimeout(() => setFly(null), 300) }
  const cancelarFecharFly = () => { if (flyTimer.current) clearTimeout(flyTimer.current) }

  useEffect(() => {
    getComercialStatus().then(s => setComNovos(!!s.temNovos)).catch(() => {})
  }, [pathname])

  const playClick = () => {
    if (!getSomAtivo()) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC(); const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = 620
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11)
      o.start(); o.stop(ctx.currentTime + 0.12); o.onended = () => ctx.close()
    } catch { /* ignora */ }
  }

  const toggleGroup = (label: string) => { playClick(); setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label]) }
  const sair = async () => { await signOut({ redirect: false }); window.location.href = '/sistema/login' }
  const irPara = (href: string) => { playClick(); setMobileOpen(false); router.push(href) }

  // ── Classes idênticas ao MenuLista do Obrigô ──
  const itemCls = 'flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition'
  const leafCls = (active: boolean) => `${itemCls} border-l-[3px] ${active
    ? 'border-[color:var(--m-acc)] bg-[var(--m-abg)] font-medium text-[color:var(--m-afg)]'
    : 'border-transparent text-[color:var(--m-fg)] hover:bg-[var(--m-hv)] hover:text-[color:var(--m-afg)]'}`
  const grpCls = (on: boolean) => `${itemCls} ${on
    ? 'bg-[var(--m-abg)] text-[color:var(--m-afg)]'
    : 'text-[color:var(--m-fg)] hover:bg-[var(--m-hv)] hover:text-[color:var(--m-afg)]'}`

  const Leaf = ({ c }: { c: NavLeaf }) => {
    const active = pathname === c.href
    return (
      <Link href={c.href} onClick={() => { playClick(); setFly(null); setMobileOpen(false) }} className={leafCls(active)}>
        <c.icon size={20} className={active ? 'text-[color:var(--m-afg)]' : 'text-[color:var(--m-ic)]'} />
        <span className="flex-1">{c.label}</span>
      </Link>
    )
  }

  const QuickBtn = ({ color, title, onClick, children }: { color: string; title: string; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={() => { playClick(); onClick() }} title={title}
      className="grid h-10 w-full place-items-center rounded-lg text-white transition hover:opacity-90 active:scale-95" style={{ background: color }}>
      {children}
    </button>
  )

  const renderContent = (flyout: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <Link href="/sistema" onClick={() => setMobileOpen(false)}><LogoAtuan /></Link>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-[color:var(--m-ic)]" aria-label="Fechar menu"><X size={20} /></button>
      </div>

      {/* Botões de atalho */}
      <div className="grid grid-cols-4 gap-1 px-3 pb-2 shrink-0">
        <QuickBtn color="#88b87f" title="Início" onClick={() => irPara('/sistema')}><Home size={18} /></QuickBtn>
        <QuickBtn color="#f47920" title="Configurações" onClick={() => irPara('/sistema/configuracoes')}><User size={18} /></QuickBtn>
        <QuickBtn color="#ffb752" title="Ajuda (em breve)" onClick={() => alert('Central de ajuda: em breve')}><HelpCircle size={18} /></QuickBtn>
        <QuickBtn color="#d15b47" title="Sair" onClick={sair}><Power size={18} /></QuickBtn>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-1.5 pb-2 text-[16px]">
        {nav.map(item => {
          const divisoria = 'border-b border-[color:var(--m-bd)] last:border-0'

          if (isGroup(item)) {
            const activeChild = item.children.some(c => pathname === c.href)
            if (flyout) {
              const on = activeChild || fly?.label === item.label
              return (
                <div key={item.label} className={divisoria}
                  onMouseEnter={e => abrirFly(item.label, (e.currentTarget as HTMLElement).getBoundingClientRect().top)}
                  onMouseLeave={fecharFly}>
                  <button className={grpCls(on)}>
                    <item.icon size={20} className={on ? 'text-[color:var(--m-afg)]' : 'text-[color:var(--m-ic)]'} />
                    <span className="flex-1">{item.label}
                      {item.label === 'Comercial' && comNovos && <span className="onb-badge ml-2">Novo</span>}
                    </span>
                    <ChevronRight size={15} className="text-[color:var(--m-ic)]" />
                  </button>
                </div>
              )
            }
            const open = openGroups.includes(item.label)
            return (
              <div key={item.label} className={divisoria}>
                <button onClick={() => toggleGroup(item.label)} className={grpCls(activeChild)}>
                  <item.icon size={20} className={activeChild ? 'text-[color:var(--m-afg)]' : 'text-[color:var(--m-ic)]'} />
                  <span className="flex-1">{item.label}
                    {item.label === 'Comercial' && comNovos && <span className="onb-badge ml-2">Novo</span>}
                  </span>
                  <ChevronRight size={15} className={`text-[color:var(--m-ic)] transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>
                {open && <div className="pb-1">{item.children.map(c => <Leaf key={c.href} c={c} />)}</div>}
              </div>
            )
          }

          const active = pathname === item.href
          if (item.external) {
            return (
              <div key={item.href} className={divisoria}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => { playClick(); setMobileOpen(false) }} className={grpCls(false)}>
                  <item.icon size={20} className="text-[color:var(--m-ic)]" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--m-acc)' }}>abrir</span>
                </a>
              </div>
            )
          }
          return (
            <div key={item.href} className={divisoria}><Leaf c={item} /></div>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-3 py-2 shrink-0 border-t border-[color:var(--m-bd)]">
        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--m-ic)' }}>Conectado</p>
        <p className="text-xs truncate" style={{ color: 'var(--m-fg)' }}>{email ?? '—'}</p>
      </div>
    </div>
  )

  const grpFly = fly ? (nav.find(i => isGroup(i) && i.label === fly.label) as NavGroup | undefined) : undefined

  return (
    <>
      {/* Topbar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14" style={{ ...MVARS, background: 'var(--m-sbg)', borderBottom: '1px solid var(--m-bd)' }}>
        <LogoAtuan />
        <button onClick={() => setMobileOpen(true)} className="p-2 text-[color:var(--m-ic)]" aria-label="Abrir menu"><Menu size={22} /></button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-56 z-30 flex-col" style={{ ...MVARS, background: 'var(--m-sbg)', borderRight: '2px solid var(--m-acc)' }}>
        {renderContent(true)}
      </aside>

      {/* Flyout do grupo (desktop) */}
      {grpFly && fly && (
        <div className="hidden lg:block fixed z-40 min-w-[240px] max-h-[75vh] overflow-y-auto rounded-md p-1 pl-2 shadow-xl text-[16px]"
          style={{ ...MVARS, left: 226, top: Math.max(8, fly.top), background: 'var(--m-bg)', border: '1px solid var(--m-bd)' }}
          onMouseEnter={cancelarFecharFly} onMouseLeave={fecharFly}>
          {grpFly.children.map(c => <Leaf key={c.href} c={c} />)}
        </div>
      )}

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72" style={{ ...MVARS, background: 'var(--m-sbg)', borderRight: '2px solid var(--m-acc)' }}>
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  )
}
