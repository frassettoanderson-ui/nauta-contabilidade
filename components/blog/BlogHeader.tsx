'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown, ArrowUpRight } from 'lucide-react'

const CATEGORIAS = [
  { label: 'Simples & MEI',           slug: 'simples-e-mei' },
  { label: 'Tributação',              slug: 'tributacao' },
  { label: 'Abertura de Empresa',     slug: 'abertura-de-empresa' },
  { label: 'CLT × PJ',                slug: 'clt-x-pj' },
  { label: 'RH & Folha',              slug: 'rh-e-folha' },
  { label: 'Gestão Financeira',       slug: 'gestao-financeira' },
  { label: 'Empreendedorismo',        slug: 'empreendedorismo' },
  { label: 'Contabilidade Eleitoral', slug: 'contabilidade-eleitoral' },
]

/** Logo exclusiva do blog: símbolo da Nauta + wordmark "Nauta Blog". */
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
  const [catOpen, setCatOpen] = useState(false)
  const [mobCatOpen, setMobCatOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0c0b18]/95 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
        : 'bg-[#0a0918]/80 backdrop-blur-md border-b border-white/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <BlogLogo />

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Menu do blog">
            <Link href="/blog" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all">
              Todos os artigos
            </Link>

            {/* Categorias dropdown */}
            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen(o => !o)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all"
                aria-expanded={catOpen}
              >
                Categorias
                <ChevronDown size={13} className={`transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#13112a] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Temas</p>
                  </div>
                  {CATEGORIAS.map(c => (
                    <Link key={c.slug} href={`/blog?categoria=${c.slug}`} onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/60 hover:text-[#0BBCD4] hover:bg-[#0BBCD4]/5 transition-all border-b border-white/5 last:border-0">
                      <span className="w-1 h-1 rounded-full bg-[#0BBCD4]/50" aria-hidden="true" />
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/ferramentas" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all">
              Ferramentas
            </Link>
          </nav>

          {/* Ações desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white border border-white/15 hover:border-white/30 rounded transition-all">
              Ir para o site
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/contato"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0BBCD4] hover:bg-[#0999ae] text-white text-sm font-bold rounded transition-all hover:shadow-lg hover:shadow-[#0BBCD4]/20 hover:-translate-y-px">
              Falar com a Nauta
            </Link>
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
          <nav className="px-4 py-3" aria-label="Menu do blog (mobile)">
            <Link href="/blog" onClick={() => setMobileOpen(false)}
              className="block py-3 text-white/70 font-medium border-b border-white/5 hover:text-white transition-colors">
              Todos os artigos
            </Link>
            <button
              onClick={() => setMobCatOpen(o => !o)}
              className="flex items-center justify-between w-full py-3 text-white/70 font-medium border-b border-white/5"
            >
              Categorias
              <ChevronDown size={14} className={`transition-transform ${mobCatOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobCatOpen && (
              <div className="pb-2 pl-4 space-y-1">
                {CATEGORIAS.map(c => (
                  <Link key={c.slug} href={`/blog?categoria=${c.slug}`} onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-white/50 hover:text-[#0BBCD4] transition-colors">
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
            <Link href="/ferramentas" onClick={() => setMobileOpen(false)}
              className="block py-3 text-white/70 font-medium border-b border-white/5 hover:text-white transition-colors">
              Ferramentas
            </Link>
            <div className="pt-4 pb-2 flex flex-col gap-2">
              <Link href="/" onClick={() => setMobileOpen(false)}
                className="block text-center border border-white/15 text-white font-semibold py-3 rounded text-sm hover:border-white/30 transition-colors">
                Ir para o site
              </Link>
              <Link href="/contato" onClick={() => setMobileOpen(false)}
                className="block text-center bg-[#0BBCD4] hover:bg-[#0999ae] text-white font-bold py-3 rounded text-sm transition-colors">
                Falar com a Nauta
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
