'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { effectivePerms, podeVer } from '@/lib/menu-perms'
import { getOnboardingStatus, getComercialStatus } from '@/lib/api'
import { getSomAtivo } from '@/lib/sys-prefs'
import RocketIcon from './RocketIcon'
import {
  Users, UserPlus, Search, FileText, FilePlus, FileClock, FileSearch,
  Briefcase, LayoutGrid, Inbox, BarChart3, TrendingUp, Calculator, UserCog, Building2,
  Rocket, Settings, DollarSign, LayoutDashboard, MessageCircle,
  ArrowDownCircle, ArrowUpCircle, Repeat, CalendarCheck, Target, UserX, Percent, AlertTriangle, Receipt,
  RefreshCw, LogOut, ChevronDown, ChevronRight, Menu, X, Home, User, HelpCircle, Power, type LucideIcon,
} from 'lucide-react'

// GestorOA/Obrigô: entra logado via SSO (handoff usa a sessão atual da Nauta).
// Mesmo domínio, servido em /gestoroa atrás do nginx.
const GESTOROA_URL = '/api/sso/gestoroa'

// Identidade Atuan/Obrigô no menu: marinho + laranja.
const MARINHO = '#0E2240'
const LARANJA = '#F47920'
const BORDA = 'rgba(255,255,255,0.08)'
const SIDEBAR_W = 256 // w-64

interface NavLeaf { label: string; href: string; icon: LucideIcon; highlight?: boolean; external?: boolean }
interface NavGroup { label: string; icon: LucideIcon; children: NavLeaf[]; highlight?: boolean }
type NavItem = NavLeaf | NavGroup

const NAV: NavItem[] = [
  { label: 'Onboarding', href: '/sistema/onboarding', icon: Rocket, highlight: true },
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
  { label: 'GestorOA',   href: GESTOROA_URL, icon: CalendarCheck, external: true },
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

function isGroup(i: NavItem): i is NavGroup {
  return (i as NavGroup).children !== undefined
}

// Logo/wordmark provisório da Atuan (troca pela logo oficial quando o arquivo chegar).
function LogoAtuan() {
  return (
    <span className="leading-none select-none">
      <span className="block text-xl font-black text-white tracking-tight">Atuan</span>
      <span className="block text-[9px] font-bold uppercase tracking-[0.28em]" style={{ color: LARANJA }}>Contabilidade</span>
    </span>
  )
}

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
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
      return (item.external || podeVer(perms, item.href)) ? item : null
    })
    .filter((i): i is NavItem => i !== null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [onbNovos, setOnbNovos] = useState(false)
  const [comNovos, setComNovos] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(
    NAV.filter(isGroup).filter(g => g.children.some(c => pathname.startsWith(c.href))).map(g => g.label)
  )
  // Flyout do desktop: grupo abre para o lado (estilo Obrigô), posicionado por `top`.
  const [fly, setFly] = useState<{ label: string; top: number } | null>(null)
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abrirFly = (label: string, top: number) => { if (flyTimer.current) clearTimeout(flyTimer.current); setFly({ label, top }) }
  const fecharFly = () => { if (flyTimer.current) clearTimeout(flyTimer.current); flyTimer.current = setTimeout(() => setFly(null), 250) }
  const cancelarFecharFly = () => { if (flyTimer.current) clearTimeout(flyTimer.current) }

  useEffect(() => {
    getOnboardingStatus().then(s => setOnbNovos(!!s.temNovos)).catch(() => {})
    getComercialStatus().then(s => setComNovos(!!s.temNovos)).catch(() => {})
  }, [pathname])

  // Som de clique curto via Web Audio (sem asset)
  const playClick = () => {
    if (!getSomAtivo()) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'; o.frequency.value = 620
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11)
      o.start(); o.stop(ctx.currentTime + 0.12)
      o.onended = () => ctx.close()
    } catch { /* navegador sem suporte: ignora */ }
  }

  const toggleGroup = (label: string) => {
    playClick()
    setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label])
  }

  const sair = async () => { await signOut({ redirect: false }); window.location.href = '/sistema/login' }
  const irPara = (href: string) => { playClick(); setMobileOpen(false); router.push(href) }

  const itemBase = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 hover:translate-x-[3px] hover:bg-white/[0.05]'
  const ativoStyle = { background: 'rgba(244,121,32,0.14)', color: LARANJA, border: '1px solid rgba(244,121,32,0.30)' }
  const inativoStyle = { background: 'transparent', color: '#c3cad8', border: '1px solid transparent' }

  // Botões de atalho do topo (ações ainda serão refinadas pelo usuário)
  const QuickBtn = ({ color, title, onClick, children }: { color: string; title: string; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={() => { playClick(); onClick() }} title={title}
      className="h-10 rounded-xl flex items-center justify-center text-white transition-all hover:brightness-110 active:scale-95"
      style={{ background: color }}>
      {children}
    </button>
  )

  const SubLink = ({ c }: { c: NavLeaf }) => {
    const active = pathname === c.href
    return (
      <Link href={c.href} onClick={() => { playClick(); setFly(null); setMobileOpen(false) }} className={itemBase} style={active ? ativoStyle : inativoStyle}>
        <c.icon size={16} /> {c.label}
      </Link>
    )
  }

  const renderContent = (flyout: boolean) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-16 shrink-0" style={{ borderBottom: `1px solid ${BORDA}` }}>
        <Link href="/sistema" onClick={() => setMobileOpen(false)}><LogoAtuan /></Link>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-gray-400" aria-label="Fechar menu"><X size={20} /></button>
      </div>

      {/* Botões de atalho (topo) — estilo Obrigô */}
      <div className="grid grid-cols-4 gap-2 px-3 pt-3 pb-1 shrink-0">
        <QuickBtn color="#22c55e" title="Início" onClick={() => irPara('/sistema')}><Home size={18} /></QuickBtn>
        <QuickBtn color={LARANJA} title="Configurações" onClick={() => irPara('/sistema/configuracoes')}><User size={18} /></QuickBtn>
        <QuickBtn color="#fbbf24" title="Ajuda (em breve)" onClick={() => alert('Central de ajuda: em breve')}><HelpCircle size={18} /></QuickBtn>
        <QuickBtn color="#ef4444" title="Sair" onClick={sair}><Power size={18} /></QuickBtn>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {nav.map(item => {
          if (isGroup(item)) {
            const activeChild = item.children.some(c => pathname === c.href)
            // ── Desktop: flyout para o lado ──
            if (flyout) {
              return (
                <div key={item.label}
                  onMouseEnter={e => abrirFly(item.label, (e.currentTarget as HTMLElement).getBoundingClientRect().top)}
                  onMouseLeave={fecharFly}>
                  <button className={`${itemBase} w-full justify-between`} style={{ color: activeChild || fly?.label === item.label ? LARANJA : '#c3cad8' }}>
                    <span className="flex items-center gap-3"><item.icon size={17} /> {item.label}
                      {item.label === 'Comercial' && comNovos && <span className="onb-badge">Novo</span>}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )
            }
            // ── Mobile: acordeão para baixo ──
            const open = openGroups.includes(item.label)
            return (
              <div key={item.label}>
                <button onClick={() => toggleGroup(item.label)} className={`${itemBase} w-full justify-between`} style={{ color: activeChild ? LARANJA : '#c3cad8' }}>
                  <span className="flex items-center gap-3"><item.icon size={17} /> {item.label}
                    {item.label === 'Comercial' && comNovos && <span className="onb-badge">Novo</span>}
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="mt-1 ml-3 pl-3 space-y-1" style={{ borderLeft: `1px solid ${BORDA}` }}>
                    {item.children.map(c => <SubLink key={c.href} c={c} />)}
                  </div>
                )}
              </div>
            )
          }
          const active = pathname === item.href
          if (item.external) {
            return (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => { playClick(); setMobileOpen(false) }} className={`${itemBase} justify-between`}
                style={{ color: '#c3cad8' }}>
                <span className="flex items-center gap-3"><item.icon size={17} /> {item.label}</span>
                <span className="text-[10px] uppercase tracking-wide" style={{ color: LARANJA }}>abrir</span>
              </a>
            )
          }
          if (item.highlight) {
            return (
              <Link key={item.href} href={item.href} onClick={() => { playClick(); setMobileOpen(false) }}
                className={`${itemBase} nav-onboarding justify-between mb-2`}>
                <span className="flex items-center gap-3 nav-onboarding-text">
                  <RocketIcon size={19} className="nav-onboarding-icon" /> {item.label}
                  {onbNovos && <span className="onb-badge">Novo</span>}
                </span>
              </Link>
            )
          }
          return (
            <Link key={item.href} href={item.href} onClick={() => { playClick(); setMobileOpen(false) }} className={itemBase}
              style={active ? ativoStyle : inativoStyle}>
              <item.icon size={17} /> {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${BORDA}` }}>
        <div className="px-3 py-2 mb-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Conectado</p>
          <p className="text-xs text-gray-400 truncate">{email ?? '—'}</p>
        </div>
        <button onClick={sair} className={`${itemBase} w-full text-gray-400 hover:text-red-400`}>
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  )

  // Painel flyout (desktop): renderizado fixo, ao lado da sidebar, na altura do item.
  const grpFly = fly ? (nav.find(i => isGroup(i) && i.label === fly.label) as NavGroup | undefined) : undefined

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14" style={{ background: MARINHO, borderBottom: `1px solid ${BORDA}` }}>
        <LogoAtuan />
        <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-300" aria-label="Abrir menu"><Menu size={22} /></button>
      </div>

      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 z-30 flex-col" style={{ background: MARINHO, borderRight: `2px solid ${LARANJA}` }}>
        {renderContent(true)}
      </aside>

      {/* Flyout do grupo (desktop) */}
      {grpFly && fly && (
        <div className="hidden lg:block fixed z-40 min-w-[240px] max-h-[75vh] overflow-y-auto rounded-xl p-2 shadow-2xl"
          style={{ left: SIDEBAR_W + 2, top: Math.max(8, fly.top), background: MARINHO, border: `1px solid ${BORDA}` }}
          onMouseEnter={cancelarFecharFly} onMouseLeave={fecharFly}>
          <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: LARANJA }}>{grpFly.label}</p>
          <div className="space-y-1">
            {grpFly.children.map(c => <SubLink key={c.href} c={c} />)}
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72" style={{ background: MARINHO, borderRight: `2px solid ${LARANJA}` }}>
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  )
}
