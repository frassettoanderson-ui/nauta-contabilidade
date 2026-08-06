'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'

// ── Menu espelhando a estrutura da Contabilizei, adaptado à Nauta ──
const MAIS_ACESSADOS = [
  { label: 'MEI ou Simples Nacional',        href: '/blog/mei-ou-simples-nacional' },
  { label: 'Como abrir uma empresa (CNPJ)',  href: '/blog/como-abrir-empresa-cnpj' },
  { label: 'CLT ou PJ: o que compensa?',     href: '/blog/clt-ou-pj' },
  { label: 'Fator R do Simples Nacional',    href: '/blog/fator-r-simples-nacional' },
  { label: 'Deixar de ser MEI (virar ME)',   href: '/blog/deixar-de-ser-mei-virar-me' },
  { label: 'Planejamento tributário',        href: '/blog/planejamento-tributario' },
]

const CONTABILIDADE = [
  { label: 'Simples & MEI',           href: '/blog?categoria=simples-e-mei' },
  { label: 'Tributação',              href: '/blog?categoria=tributacao' },
  { label: 'Abertura de Empresa',     href: '/blog?categoria=abertura-de-empresa' },
  { label: 'CLT × PJ',                href: '/blog?categoria=clt-x-pj' },
  { label: 'RH & Folha',              href: '/blog?categoria=rh-e-folha' },
  { label: 'Gestão Financeira',       href: '/blog?categoria=gestao-financeira' },
  { label: 'Empreendedorismo',        href: '/blog?categoria=empreendedorismo' },
  { label: 'Contabilidade Eleitoral', href: '/blog?categoria=contabilidade-eleitoral' },
]

const FERRAMENTAS = [
  { label: 'Calculadora Fator R',            href: '/ferramentas/calculadora-fator-r' },
  { label: 'Simulador de Regime Tributário', href: '/ferramentas/simulador-regime-tributario' },
  { label: 'Calculadora Salário Líquido',    href: '/ferramentas/calculadora-salario-liquido' },
  { label: 'Simulador de Rescisão',          href: '/ferramentas/simulador-rescisao' },
  { label: 'Ver todas as ferramentas →',     href: '/ferramentas' },
]

const AREAS = [
  { label: 'MEI',                     href: '/quem-atendemos' },
  { label: 'Simples Nacional',        href: '/quem-atendemos' },
  { label: 'Lucro Presumido',         href: '/quem-atendemos' },
  { label: 'Profissionais Liberais',  href: '/quem-atendemos' },
  { label: 'Comércio e E-commerce',   href: '/quem-atendemos' },
  { label: 'Tecnologia e Marketing',  href: '/quem-atendemos' },
  { label: 'Saúde',                   href: '/quem-atendemos' },
  { label: 'Startups e Inovação',     href: '/quem-atendemos' },
]

const A_NAUTA = [
  { label: 'Site da Nauta',      href: '/' },
  { label: 'Quem atendemos',     href: '/quem-atendemos' },
  { label: 'Contato',            href: '/contato' },
]

type MenuKey = 'mais' | 'contabil' | 'ferramentas' | 'areas' | 'nauta'
const MENUS: { key: MenuKey; label: string; items: { label: string; href: string }[] }[] = [
  { key: 'mais',        label: 'Mais Acessados',   items: MAIS_ACESSADOS },
  { key: 'contabil',    label: 'Contabilidade',    items: CONTABILIDADE },
  { key: 'ferramentas', label: 'Ferramentas',      items: FERRAMENTAS },
  { key: 'areas',       label: 'Áreas de Atuação', items: AREAS },
  { key: 'nauta',       label: 'A Nauta',          items: A_NAUTA },
]

function BlogLogo() {
  return (
    <Link href="/blog" aria-label="Nauta Blog — início" className="flex items-center gap-2.5 shrink-0">
      <Image src="/icone-branca.png" alt="" width={36} height={36} className="h-8 w-auto object-contain" priority />
      <span className="text-xl font-black tracking-tight text-white leading-none">
        Nauta<span className="text-[#0BBCD4]"> Blog</span>
      </span>
    </Link>
  )
}

export default function BlogHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [open, setOpen] = useState<MenuKey | null>(null)
  const [mobSection, setMobSection] = useState<MenuKey | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0c0b18]/95 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
        : 'bg-[#0a0918]/85 backdrop-blur-md border-b border-white/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <BlogLogo />

          {/* Nav desktop */}
          <nav ref={navRef} className="hidden xl:flex items-center gap-0.5" aria-label="Menu do blog">
            {MENUS.map(m => (
              <div key={m.key} className="relative">
                <button
                  onClick={() => setOpen(o => (o === m.key ? null : m.key))}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all"
                  aria-expanded={open === m.key}
                >
                  {m.label}
                  <ChevronDown size={13} className={`transition-transform duration-200 ${open === m.key ? 'rotate-180' : ''}`} />
                </button>
                {open === m.key && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#13112a] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                    {m.items.map(it => (
                      <Link key={it.label} href={it.href} onClick={() => setOpen(null)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/60 hover:text-[#0BBCD4] hover:bg-[#0BBCD4]/5 transition-all border-b border-white/5 last:border-0">
                        <span className="w-1 h-1 rounded-full bg-[#0BBCD4]/50 shrink-0" aria-hidden="true" />
                        {it.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Planos (link simples) */}
            <Link href="/contato" className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all">
              Planos
            </Link>
          </nav>

          {/* CTA desktop */}
          <div className="hidden xl:flex items-center">
            <Link href="/servicos/legalizacao-societario"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0BBCD4] hover:bg-[#0999ae] text-white text-sm font-bold rounded transition-all hover:shadow-lg hover:shadow-[#0BBCD4]/20 hover:-translate-y-px">
              Abrir Empresa
            </Link>
          </div>

          {/* Hambúrguer mobile */}
          <button
            className="xl:hidden p-2 text-white/80 hover:text-white transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#0c0b18] border-t border-white/10 max-h-[80vh] overflow-y-auto">
          <nav className="px-4 py-3" aria-label="Menu do blog (mobile)">
            {MENUS.map(m => (
              <div key={m.key}>
                <button
                  onClick={() => setMobSection(s => (s === m.key ? null : m.key))}
                  className="flex items-center justify-between w-full py-3 text-white/70 font-medium border-b border-white/5"
                >
                  {m.label}
                  <ChevronDown size={14} className={`transition-transform ${mobSection === m.key ? 'rotate-180' : ''}`} />
                </button>
                {mobSection === m.key && (
                  <div className="pb-2 pl-4 space-y-1">
                    {m.items.map(it => (
                      <Link key={it.label} href={it.href} onClick={() => setMobileOpen(false)}
                        className="block py-2 text-sm text-white/50 hover:text-[#0BBCD4] transition-colors">
                        {it.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link href="/contato" onClick={() => setMobileOpen(false)}
              className="block py-3 text-white/70 font-medium border-b border-white/5 hover:text-white transition-colors">
              Planos
            </Link>
            <div className="pt-4 pb-2">
              <Link href="/servicos/legalizacao-societario" onClick={() => setMobileOpen(false)}
                className="block text-center bg-[#0BBCD4] hover:bg-[#0999ae] text-white font-bold py-3 rounded text-sm transition-colors">
                Abrir Empresa
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
