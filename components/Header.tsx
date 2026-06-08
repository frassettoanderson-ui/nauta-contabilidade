'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'

const TOOLS = [
  { label: 'Calculadora Fator R',           href: '/ferramentas/calculadora-fator-r' },
  { label: 'Simulador de Regime Tributário', href: '/ferramentas/simulador-regime-tributario' },
  { label: 'Calculadora Salário Líquido',    href: '/ferramentas/calculadora-salario-liquido' },
  { label: 'Simulador Rescisão',             href: '/ferramentas/simulador-rescisao' },
]

const SERVICES = [
  { label: 'Contábil',                    href: '/servicos/contabil' },
  { label: 'Fiscal',                      href: '/servicos/fiscal' },
  { label: 'Folha de Pagamento',          href: '/servicos/folha-de-pagamento' },
  { label: 'Legalização / Societário',    href: '/servicos/legalizacao-societario' },
  { label: 'BPO Financeiro',              href: '/servicos/bpo-financeiro' },
  { label: 'Planejamento Tributário',     href: '/servicos/planejamento-tributario' },
  { label: 'Contabilidade Eleitoral',     href: '/servicos/contabilidade-eleitoral', badge: 'Especialidade' },
]

const NAV_LINKS = [
  { href: '/quem-atendemos', label: 'Quem atendemos' },
  { href: '/blog',           label: 'Blog' },
  { href: '/contato',        label: 'Contato' },
]

interface HeaderProps { onOpenLead: () => void }

export default function Header({ onOpenLead }: HeaderProps) {
  const [scrolled,      setScrolled]      = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [toolsOpen,     setToolsOpen]     = useState(false)
  const [servicesOpen,  setServicesOpen]  = useState(false)
  const toolsRef    = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node))
        setToolsOpen(false)
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node))
        setServicesOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0c0b18]/95 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
        : 'bg-transparent'
    }`}>


      {/* Nav principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" aria-label="Nauta Contabilidade — página inicial" className="shrink-0">
            <Image
              src="/logo-branca.png"
              alt="Nauta Contabilidade"
              width={180}
              height={54}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Menu principal">

            {/* Serviços dropdown */}
            <div ref={servicesRef} className="relative">
              <button
                onClick={() => setServicesOpen(o => !o)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all"
                aria-expanded={servicesOpen}
              >
                Serviços
                <ChevronDown size={13} className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#13112a] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Nossos serviços</p>
                  </div>
                  {SERVICES.map(s => (
                    <Link key={s.href} href={s.href} onClick={() => setServicesOpen(false)}
                      className="flex items-center justify-between gap-2 px-4 py-3 text-sm text-white/60 hover:text-[#0BBCD4] hover:bg-[#0BBCD4]/5 transition-all border-b border-white/5 last:border-0">
                      <span className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#0BBCD4]/50" aria-hidden="true" />
                        {s.label}
                      </span>
                      {s.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-[#0BBCD4]" style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.25)' }}>
                          {s.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all">
                {link.label}
              </Link>
            ))}

            {/* Ferramentas dropdown */}
            <div ref={toolsRef} className="relative">
              <button
                onClick={() => setToolsOpen(o => !o)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all"
                aria-expanded={toolsOpen}
              >
                Ferramentas
                <ChevronDown size={13} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#13112a] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Calculadoras gratuitas</p>
                  </div>
                  {TOOLS.map(t => (
                    <Link key={t.href} href={t.href} onClick={() => setToolsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-white/60 hover:text-[#0BBCD4] hover:bg-[#0BBCD4]/5 transition-all border-b border-white/5 last:border-0">
                      <span className="w-1 h-1 rounded-full bg-[#0BBCD4]/50" aria-hidden="true" />
                      {t.label}
                    </Link>
                  ))}
                  <Link href="/ferramentas" onClick={() => setToolsOpen(false)}
                    className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-semibold text-[#0BBCD4] hover:bg-[#0BBCD4]/10 transition-colors">
                    Ver todas as ferramentas →
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Ações desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Separador vertical */}
            <div className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />

            <Link href="/login"
              className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white border border-white/15 hover:border-white/30 rounded transition-all">
              Entrar
            </Link>

            <button onClick={onOpenLead}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0BBCD4] hover:bg-[#0999ae] text-white text-sm font-bold rounded transition-all hover:shadow-lg hover:shadow-[#0BBCD4]/20 hover:-translate-y-px">
              Solicitar proposta
            </button>
          </div>

          {/* Hambúrguer mobile */}
          <button
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0c0b18] border-t border-white/10">
          <nav className="px-4 py-3" aria-label="Menu mobile">
            {/* Serviços mobile */}
            <button
              onClick={() => setServicesOpen(o => !o)}
              className="flex items-center justify-between w-full py-3 text-white/70 font-medium border-b border-white/5"
            >
              Serviços
              <ChevronDown size={14} className={`transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {servicesOpen && (
              <div className="pb-2 pl-4 space-y-1">
                {SERVICES.map(s => (
                  <Link key={s.href} href={s.href} onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-white/50 hover:text-[#0BBCD4] transition-colors">
                    {s.label}{s.badge ? ` (${s.badge})` : ''}
                  </Link>
                ))}
              </div>
            )}
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-white/70 font-medium border-b border-white/5 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setToolsOpen(o => !o)}
              className="flex items-center justify-between w-full py-3 text-white/70 font-medium border-b border-white/5"
            >
              Ferramentas
              <ChevronDown size={14} className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>
            {toolsOpen && (
              <div className="pb-2 pl-4 space-y-1">
                {TOOLS.map(t => (
                  <Link key={t.href} href={t.href} onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-white/50 hover:text-[#0BBCD4] transition-colors">
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
            <div className="pt-4 pb-2 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block text-center border border-white/15 text-white font-semibold py-3 rounded text-sm hover:border-white/30 transition-colors">
                Entrar
              </Link>
              <button onClick={() => { setMobileOpen(false); onOpenLead() }}
                className="w-full bg-[#0BBCD4] hover:bg-[#0999ae] text-white font-bold py-3 rounded text-sm transition-colors">
                Solicitar proposta
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
