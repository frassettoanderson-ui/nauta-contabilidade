'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { effectivePerms, podeVer } from '@/lib/menu-perms'
import { getComercialStatus } from '@/lib/api'
import { getSomAtivo } from '@/lib/sys-prefs'
import LogoObrigo from './LogoObrigo'
import {
  Users, UserPlus, Search, FileText, FilePlus, FileClock, FileSearch,
  Briefcase, LayoutGrid, Inbox, BarChart3, TrendingUp, Calculator, UserCog, Building2,
  Rocket, Settings, DollarSign, LayoutDashboard, MessageCircle,
  ArrowDownCircle, ArrowUpCircle, Repeat, CalendarCheck, Target, UserX, Percent, AlertTriangle, Receipt,
  RefreshCw, ChevronRight, ChevronLeft, Menu, X, Home, User, HelpCircle, Power,
  Globe, List, Heart, CheckCircle, Folder, MessageSquare, UploadCloud, Tags, Bot, Download, HardDrive,
  Smartphone, Star, ClipboardList, type LucideIcon,
} from 'lucide-react'

// Módulo Obrigô embutido (app/sistema/(painel)/obrigo/[[...slug]])
const OB = '/sistema/obrigo'

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

interface NavLeaf { label: string; href: string; icon: LucideIcon; external?: boolean }
interface NavGroup { label: string; icon: LucideIcon; children: NavItem[] }
type NavItem = NavLeaf | NavGroup

const NAV: NavItem[] = [
  { label: 'Onboarding', href: '/sistema/onboarding', icon: Rocket },
  { label: 'Dashboard',  href: '/sistema', icon: LayoutDashboard },
  { label: 'Clientes', icon: Users, children: [
    // Cadastro único = o do Obrigô (tela embutida). As telas antigas do ERP ficam como fallback.
    { label: 'Cadastrar', href: `${OB}/empresas/nova`, icon: UserPlus },
    { label: 'Consultar', href: `${OB}/empresas`, icon: Search },
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
  // Menu do Obrigô, igual ao do app separado (gestor-oa/web/src/components/Layout.tsx),
  // menos "Dados do meu perfil" (fica na barra de cima) e "Trocar estilo" (estilo único).
  { label: 'Obrigô', icon: CalendarCheck, children: [
    { label: 'Sistema', icon: Globe, children: [
      { label: 'Usuarios e Permissoes', icon: Users, href: `${OB}/usuarios` },
      { label: 'Departamentos', icon: Tags, href: `${OB}/cadastros` },
      { label: 'Configuracoes gerais', icon: Settings, href: `${OB}/configuracoes` },
      { label: 'e-Continuo', icon: Bot, children: [
        { label: 'Configurar obrigacoes', icon: Settings, href: `${OB}/robo/assinaturas` },
        { label: 'Conectar Google Drive', icon: HardDrive, href: `${OB}/robo/drive` },
        { label: 'Envio manual', icon: UploadCloud, href: `${OB}/robo/envio` },
        { label: 'Revisao', icon: ClipboardList, href: `${OB}/robo/revisao` },
      ] },
      { label: 'Aplicativo e Area VIP', icon: MessageSquare, children: [
        { label: 'Area VIP e App', icon: Smartphone, href: `${OB}/area-vip/app` },
        { label: 'Comunicados', icon: MessageSquare, href: `${OB}/area-vip/comunicados` },
        { label: 'Avaliacao NPS', icon: Star, href: `${OB}/area-vip/nps` },
        { label: 'Avaliacao das Solicitacoes', icon: Star, href: `${OB}/area-vip/avaliacoes` },
        { label: 'Usuarios do APP', icon: Users, href: `${OB}/area-vip/usuarios-app` },
      ] },
    ] },
    { label: 'Obrigacoes', icon: List, href: `${OB}/obrigacoes` },
    { label: 'Empresas', icon: Heart, href: `${OB}/empresas` },
    { label: 'Lista de Entregas', icon: CheckCircle, href: `${OB}/entregas` },
    { label: 'Relatorios', icon: Folder, children: [
      { label: 'Insights com filtros', icon: TrendingUp, href: `${OB}/insights` },
      { label: 'Indicadores (Dashboard)', icon: TrendingUp, href: `${OB}/dashboard/indicadores` },
      { label: 'Paineis (Dashboard)', icon: TrendingUp, href: `${OB}/dashboard/paineis` },
      { label: 'Estatisticas semanais', icon: ClipboardList, href: `${OB}/relatorios/semanais` },
      { label: 'Estatisticas mensais', icon: ClipboardList, href: `${OB}/relatorios/mensais` },
      { label: 'Responsaveis Dptos', icon: Users, href: `${OB}/relatorios/responsaveis` },
      { label: 'Exportar e-mails p/ CSV', icon: Download, href: `${OB}/relatorios/exportar-emails` },
    ] },
  ] },
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

// Filtra recursivamente pelo que o usuário pode ver (grupos sem filhos somem)
function filtrar(itens: NavItem[], perms: string[] | null): NavItem[] {
  return itens
    .map(item => {
      if (isGroup(item)) {
        const children = filtrar(item.children, perms)
        return children.length ? { ...item, children } : null
      }
      return (item.external || podeVer(perms, item.href)) ? item : null
    })
    .filter((i): i is NavItem => i !== null)
}

function leafHrefs(itens: NavItem[]): string[] {
  return itens.flatMap(i => (isGroup(i) ? leafHrefs(i.children) : [i.href]))
}

// Quanto um painel precisa subir para não passar da borda inferior da janela (mede o
// painel real depois de renderizado; 0 quando cabe).
function useSobeSePassar(ref: React.RefObject<HTMLElement>, dep: unknown): number {
  const [dy, setDy] = useState(0)
  useLayoutEffect(() => {
    setDy(0)
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const sobra = r.bottom - (window.innerHeight - 8)
    if (sobra > 0) setDy(-Math.min(sobra, Math.max(0, r.top - 8)))
  }, [ref, dep])
  return dy
}

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const su = session?.user as unknown as { role?: string; menuPerms?: string[] | null } | undefined
  const perms = effectivePerms(su?.role ?? '', su?.menuPerms ?? null)

  const nav = filtrar(NAV, perms)
  const todosHrefs = leafHrefs(NAV)

  // Item ativo: caminho exato; nas telas do Obrigô (rotas internas como /empresas/123) vale o prefixo,
  // desde que nenhum outro item case exatamente.
  const ativo = (href: string) =>
    pathname === href || (href.startsWith(OB) && pathname.startsWith(href + '/') && !todosHrefs.includes(pathname))
  const grupoAtivo = (g: NavGroup): boolean => g.children.some(c => (isGroup(c) ? grupoAtivo(c) : ativo(c.href)))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [comNovos, setComNovos] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(
    NAV.filter(isGroup).filter(g => leafHrefs(g.children).some(h => pathname.startsWith(h))).map(g => g.label)
  )
  const [fly, setFly] = useState<{ label: string; top: number } | null>(null)
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abrirFly = (label: string, top: number) => { if (flyTimer.current) clearTimeout(flyTimer.current); setFly({ label, top }) }
  const fecharFly = () => { if (flyTimer.current) clearTimeout(flyTimer.current); flyTimer.current = setTimeout(() => setFly(null), 300) }
  const cancelarFecharFly = () => { if (flyTimer.current) clearTimeout(flyTimer.current) }

  // Recolher/expandir o menu (persistido)
  const [recolhido, setRecolhido] = useState(false)
  useEffect(() => { try { setRecolhido(localStorage.getItem('menuRecolhido') === '1') } catch { /* ignora */ } }, [])
  useEffect(() => { if (typeof document !== 'undefined') document.documentElement.dataset.menuCollapsed = recolhido ? '1' : '0' }, [recolhido])
  const toggleRecolhido = () => { setRecolhido(v => { const nv = !v; try { localStorage.setItem('menuRecolhido', nv ? '1' : '0') } catch { /* ignora */ }; return nv }) }

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
  // Menu um pouco menor que o do Obrigô original (w-52, 15px, py-2, ícones 18) — pedido 25/09
  const itemCls = (col: boolean) => `flex w-full items-center gap-3 rounded px-3 py-2 text-left transition ${col ? 'justify-center' : ''}`
  const leafCls = (active: boolean, col: boolean) => `${itemCls(col)} border-l-[3px] ${active
    ? 'border-[color:var(--m-acc)] bg-[var(--m-abg)] font-medium text-[color:var(--m-afg)]'
    : 'border-transparent text-[color:var(--m-fg)] hover:bg-[var(--m-hv)] hover:text-[color:var(--m-afg)]'}`
  const grpCls = (on: boolean, col: boolean) => `${itemCls(col)} ${on
    ? 'bg-[var(--m-abg)] text-[color:var(--m-afg)]'
    : 'text-[color:var(--m-fg)] hover:bg-[var(--m-hv)] hover:text-[color:var(--m-afg)]'}`

  const Leaf = ({ c, col }: { c: NavLeaf; col: boolean }) => {
    const active = ativo(c.href)
    if (c.external) {
      return (
        <a href={c.href} title={col ? c.label : undefined} target="_blank" rel="noopener noreferrer" onClick={() => { playClick(); setFly(null); setMobileOpen(false) }} className={grpCls(false, col)}>
          <c.icon size={18} className="text-[color:var(--m-ic)]" />
          {!col && <span className="flex-1">{c.label}</span>}
          {!col && <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--m-acc)' }}>abrir</span>}
        </a>
      )
    }
    return (
      <Link href={c.href} title={col ? c.label : undefined} onClick={() => { playClick(); setFly(null); setMobileOpen(false) }} className={leafCls(active, col)}>
        <c.icon size={18} className={active ? 'text-[color:var(--m-afg)]' : 'text-[color:var(--m-ic)]'} />
        {!col && <span className="flex-1">{c.label}</span>}
      </Link>
    )
  }

  // Painel de subgrupo: à direita do item (left-full), subindo o necessário para caber na tela
  const SubPainel = ({ children, onEnter, onLeave }: { children: React.ReactNode; onEnter: () => void; onLeave: () => void }) => {
    const ref = useRef<HTMLDivElement>(null)
    const dy = useSobeSePassar(ref, null)
    return (
      <div ref={ref} className="absolute left-full z-50 min-w-60 rounded-md p-1 pl-2 shadow-xl"
        style={{ top: dy, background: 'var(--m-bg)', border: '1px solid var(--m-bd)' }}
        onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {children}
      </div>
    )
  }

  // Lista dentro de um flyout: subgrupos abrem outro painel à direita ao passar o mouse
  // (mesma mecânica do MenuLista do Obrigô: painel absoluto left-full top-0).
  const FlyLista = ({ itens }: { itens: NavItem[] }) => {
    const [aberto, setAberto] = useState<string | null>(null)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const abrir = (l: string) => { if (timer.current) clearTimeout(timer.current); setAberto(l) }
    const agendarFechar = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setAberto(null), 350) }
    return (
      <div>
        {itens.map(item => {
          if (isGroup(item)) {
            const on = aberto === item.label || grupoAtivo(item)
            return (
              <div key={item.label} className="relative" onMouseEnter={() => abrir(item.label)} onMouseLeave={agendarFechar}>
                <button className={`${grpCls(on, false)} whitespace-nowrap`}>
                  <item.icon size={18} className={on ? 'text-[color:var(--m-afg)]' : 'text-[color:var(--m-ic)]'} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight size={15} className="text-[color:var(--m-ic)]" />
                </button>
                {aberto === item.label && (
                  <SubPainel onEnter={() => abrir(item.label)} onLeave={agendarFechar}>
                    <FlyLista itens={item.children} />
                  </SubPainel>
                )}
              </div>
            )
          }
          return <div key={item.href} className="whitespace-nowrap"><Leaf c={item} col={false} /></div>
        })}
      </div>
    )
  }

  // Flyout principal (fixo, à direita da sidebar): mede e sobe se passar da tela
  const FlyPrincipal = ({ grupo, top, left }: { grupo: NavGroup; top: number; left: number }) => {
    const ref = useRef<HTMLDivElement>(null)
    const dy = useSobeSePassar(ref, grupo.label)
    return (
      <div ref={ref} className="hidden lg:block fixed z-40 min-w-[240px] rounded-md p-1 pl-2 shadow-xl text-[15px]"
        style={{ ...MVARS, left, top: top + dy, background: 'var(--m-bg)', border: '1px solid var(--m-bd)' }}
        onMouseEnter={cancelarFecharFly} onMouseLeave={fecharFly}>
        <FlyLista itens={grupo.children} />
      </div>
    )
  }

  // Lista em acordeão (menu mobile): subgrupos abrem para baixo, indentados
  const Acordeao = ({ itens, nivel = 0 }: { itens: NavItem[]; nivel?: number }) => (
    <>
      {itens.map(item => {
        if (isGroup(item)) {
          const open = openGroups.includes(item.label)
          const on = grupoAtivo(item)
          return (
            <div key={item.label} className={nivel === 0 ? 'border-b border-[color:var(--m-bd)] last:border-0' : ''} style={{ paddingLeft: nivel ? 12 : 0 }}>
              <button onClick={() => toggleGroup(item.label)} className={grpCls(on, false)}>
                <item.icon size={18} className={on ? 'text-[color:var(--m-afg)]' : 'text-[color:var(--m-ic)]'} />
                <span className="flex-1">{item.label}
                  {item.label === 'Comercial' && comNovos && <span className="onb-badge ml-2">Novo</span>}
                </span>
                <ChevronRight size={15} className={`text-[color:var(--m-ic)] transition-transform ${open ? 'rotate-90' : ''}`} />
              </button>
              {open && <div className="pb-1"><Acordeao itens={item.children} nivel={nivel + 1} /></div>}
            </div>
          )
        }
        return (
          <div key={item.href} className={nivel === 0 ? 'border-b border-[color:var(--m-bd)] last:border-0' : ''} style={{ paddingLeft: nivel ? 12 : 0 }}>
            <Leaf c={item} col={false} />
          </div>
        )
      })}
    </>
  )

  const QuickBtn = ({ color, title, onClick, children }: { color: string; title: string; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={() => { playClick(); onClick() }} title={title}
      className="grid h-10 w-full place-items-center rounded-lg text-white transition hover:opacity-90 active:scale-95" style={{ background: color }}>
      {children}
    </button>
  )

  const renderContent = (flyout: boolean) => {
    const col = flyout && recolhido
    return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${flyout ? 'justify-center' : 'justify-between'} px-4 py-3 shrink-0`}>
        <Link href="/sistema" onClick={() => setMobileOpen(false)}><LogoObrigo size={27} showText={!col} variant="light" /></Link>
        {!col && <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-[color:var(--m-ic)]" aria-label="Fechar menu"><X size={18} /></button>}
      </div>

      {/* Botões de atalho */}
      {!col && (
        <div className="grid grid-cols-4 gap-1 px-3 pb-2 shrink-0">
          <QuickBtn color="#88b87f" title="Início" onClick={() => irPara('/sistema')}><Home size={18} /></QuickBtn>
          <QuickBtn color="#f47920" title="Configurações" onClick={() => irPara('/sistema/configuracoes')}><User size={18} /></QuickBtn>
          <QuickBtn color="#ffb752" title="Ajuda (em breve)" onClick={() => alert('Central de ajuda: em breve')}><HelpCircle size={18} /></QuickBtn>
          <QuickBtn color="#d15b47" title="Sair" onClick={sair}><Power size={18} /></QuickBtn>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-1.5 pb-2 text-[15px]">
        {!flyout ? <Acordeao itens={nav} /> : nav.map(item => {
          const divisoria = 'border-b border-[color:var(--m-bd)] last:border-0'

          if (isGroup(item)) {
            const on = grupoAtivo(item) || fly?.label === item.label
            return (
              <div key={item.label} className={divisoria}
                onMouseEnter={e => abrirFly(item.label, (e.currentTarget as HTMLElement).getBoundingClientRect().top)}
                onMouseLeave={fecharFly}>
                <button title={col ? item.label : undefined} className={grpCls(on, col)}>
                  <item.icon size={18} className={on ? 'text-[color:var(--m-afg)]' : 'text-[color:var(--m-ic)]'} />
                  {!col && <span className="flex-1">{item.label}
                    {item.label === 'Comercial' && comNovos && <span className="onb-badge ml-2">Novo</span>}
                  </span>}
                  {!col && <ChevronRight size={15} className="text-[color:var(--m-ic)]" />}
                </button>
              </div>
            )
          }
          return (
            <div key={item.href} className={divisoria}><Leaf c={item} col={col} /></div>
          )
        })}
      </nav>

      {/* Rodapé: conectado + botão de recolher */}
      <div className="shrink-0 border-t border-[color:var(--m-bd)]">
        {!col && (
          <div className="px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--m-ic)' }}>Conectado</p>
            <p className="text-xs truncate" style={{ color: 'var(--m-fg)' }}>{email ?? '—'}</p>
          </div>
        )}
        {flyout && (
          <div className="flex justify-center py-2">
            <button onClick={toggleRecolhido} title={recolhido ? 'Expandir menu' : 'Recolher menu'}
              className="grid h-7 w-7 place-items-center rounded-full transition hover:opacity-90"
              style={{ background: 'var(--m-bg)', border: '1px solid var(--m-bd)', color: 'var(--m-ic)' }}>
              {recolhido ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
    )
  }

  const grpFly = fly ? (nav.find(i => isGroup(i) && i.label === fly.label) as NavGroup | undefined) : undefined
  const flyTop = fly ? Math.max(8, fly.top) : 8
  const flyLeft = (recolhido ? 64 : 208) + 2

  return (
    <>
      {/* Topbar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14" style={{ ...MVARS, background: 'var(--m-sbg)', borderBottom: '1px solid var(--m-bd)' }}>
        <LogoObrigo size={26} variant="light" />
        <button onClick={() => setMobileOpen(true)} className="p-2 text-[color:var(--m-ic)]" aria-label="Abrir menu"><Menu size={22} /></button>
      </div>

      {/* Sidebar desktop */}
      <aside className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-30 flex-col transition-[width] duration-200 ${recolhido ? 'w-16' : 'w-52'}`} style={{ ...MVARS, background: 'var(--m-sbg)', borderRight: '2px solid var(--m-acc)' }}>
        {renderContent(true)}
      </aside>

      {/* Flyout do grupo (desktop); subgrupos abrem mais um painel à direita */}
      {grpFly && fly && <FlyPrincipal key={grpFly.label} grupo={grpFly} top={flyTop} left={flyLeft} />}

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
