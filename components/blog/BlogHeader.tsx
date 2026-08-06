'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'

type Item = { label: string; href: string; dot?: string }

// ── Atalhos (filtram seções de matérias). Espelham a Contabilizei, adaptados à Nauta ──
const MAIS_ACESSADOS: Item[] = [
  { label: 'Abertura de empresa grátis',       href: '/blog/como-abrir-empresa-cnpj' },
  { label: 'Como ser PJ',                      href: '/blog/clt-ou-pj' },
  { label: 'Imposto para PJ',                  href: '/blog?busca=PJ' },
  { label: 'Como abrir uma ME',                href: '/blog/deixar-de-ser-mei-virar-me' },
  { label: 'Como abrir uma empresa simples',   href: '/blog?busca=Simples' },
  { label: 'Transformar MEI em ME',            href: '/blog/deixar-de-ser-mei-virar-me' },
  { label: 'Como abrir um CNPJ',               href: '/blog/como-abrir-empresa-cnpj' },
]

const CONTABILIDADE: Item[] = [
  { label: 'Abertura de Empresa',   href: '/blog?categoria=abertura-de-empresa',    dot: '#0BBCD4' },
  { label: 'Simples Nacional',      href: '/blog?categoria=simples-e-mei',          dot: '#7c6fff' },
  { label: 'Conteúdos Contábeis',   href: '/blog?categoria=conteudos-contabeis',    dot: '#22c55e' },
  { label: 'MEI',                   href: '/blog?categoria=simples-e-mei',          dot: '#38bdf8' },
  { label: 'Comparativo CLT X PJ',  href: '/blog?categoria=clt-x-pj',               dot: '#a855f7' },
  { label: 'Escolha do CNAE',       href: '/blog?busca=CNAE',                       dot: '#ec4899' },
  { label: 'Jornada de Quem Faz',   href: '/blog?categoria=empreendedorismo',       dot: '#1e3a8a' },
  { label: 'Gestão Financeira',     href: '/blog?categoria=gestao-financeira',      dot: '#34d399' },
  { label: 'Tabelas Contábeis',     href: '/blog?busca=tabela',                     dot: '#84cc16' },
  { label: 'Tributação',            href: '/blog?categoria=tributacao',             dot: '#65a30d' },
  { label: 'Empreendedorismo',      href: '/blog?categoria=empreendedorismo',       dot: '#f97316' },
  { label: 'Recursos Humanos',      href: '/blog?categoria=rh-e-folha',             dot: '#ef4444' },
]

const AREAS: Item[] = [
  { label: 'Profissionais da Saúde',    href: '/blog?busca=saúde' },
  { label: 'Tecnologia da Informação',  href: '/blog?busca=tecnologia' },
  { label: 'Marketing & Publicidade',   href: '/blog?busca=marketing' },
  { label: 'Turismo',                   href: '/blog?busca=turismo' },
  { label: 'Consultoria',               href: '/blog?busca=consultoria' },
  { label: 'Comércio',                  href: '/blog?busca=comércio' },
  { label: 'Serviços',                  href: '/blog?busca=serviços' },
  { label: 'Engenharia',                href: '/blog?busca=engenharia' },
  { label: 'Arquitetura',               href: '/blog?busca=arquitetura' },
  { label: 'Medicina',                  href: '/blog?busca=médico' },
  { label: 'Direito',                   href: '/blog?busca=advogado' },
  { label: 'Autônomo',                  href: '/blog?busca=autônomo' },
]

const FERRAMENTAS: Item[] = [
  { label: 'Calculadora Fator R',            href: '/ferramentas/calculadora-fator-r' },
  { label: 'Simulador de Regime Tributário', href: '/ferramentas/simulador-regime-tributario' },
  { label: 'Calculadora Salário Líquido',    href: '/ferramentas/calculadora-salario-liquido' },
  { label: 'Simulador de Rescisão',          href: '/ferramentas/simulador-rescisao' },
  { label: 'Ver todas as ferramentas →',     href: '/ferramentas' },
]

const A_NAUTA: Item[] = [
  { label: 'Site da Nauta',  href: '/' },
  { label: 'Quem atendemos', href: '/quem-atendemos' },
  { label: 'Contato',        href: '/contato' },
]

type MenuKey = 'mais' | 'contabil' | 'ferramentas' | 'areas' | 'nauta'
const MENUS: { key: MenuKey; label: string; items: Item[] }[] = [
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
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#13112a] border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
                    {m.items.map(it => (
                      <Link key={it.label} href={it.href} onClick={() => setOpen(null)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-[#0BBCD4] hover:bg-[#0BBCD4]/5 transition-all border-b border-white/5 last:border-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.dot ?? 'rgba(11,188,212,0.4)' }} aria-hidden="true" />
                        {it.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
