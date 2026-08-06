'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Curadoria de "Mais Acessados" (prospecção). O usuário re-cura depois.
const FEATURED = [
  { slug: 'mei-ou-simples-nacional',   cat: 'Simples & MEI',       title: 'MEI ou Simples Nacional: qual vale mais a pena?', sub: 'Entenda limites, custos e vantagens de cada opção e descubra o regime certo pro seu momento.' },
  { slug: 'como-abrir-empresa-cnpj',   cat: 'Abertura de Empresa', title: 'Como abrir uma empresa (CNPJ) do zero',            sub: 'O passo a passo completo: CNAE, natureza jurídica, regime e registros, sem burocracia.' },
  { slug: 'clt-ou-pj',                 cat: 'CLT × PJ',            title: 'CLT ou PJ: o que compensa mais?',                  sub: 'Compare salário líquido, benefícios e impostos para decidir com clareza.' },
  { slug: 'fator-r-simples-nacional',  cat: 'Tributação',          title: 'Fator R: o que é e como calcular',                 sub: 'A regra dos 28% que decide se sua empresa paga menos imposto no Anexo III.' },
  { slug: 'deixar-de-ser-mei-virar-me',cat: 'Abertura de Empresa', title: 'Como deixar de ser MEI e virar ME',                sub: 'Quando e como fazer o desenquadramento sem cair em pendências.' },
  { slug: 'planejamento-tributario',   cat: 'Tributação',          title: 'Planejamento tributário: pague menos, na lei',     sub: 'Como reduzir a carga de impostos da empresa com segurança jurídica.' },
]
const img = (slug: string) => `/blog-imgs/${slug}.jpg`

export default function BlogHero({ artigos, temas }: { artigos?: number; temas?: number }) {
  const [i, setI] = useState(0)
  const n = FEATURED.length
  const go = useCallback((d: number) => setI(v => (v + d + n) % n), [n])

  // auto-avança
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % n), 6000)
    return () => clearInterval(t)
  }, [n])

  const f = FEATURED[i]

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20" style={{ background: '#0a0918' }}>
      {/* grid sutil */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 100%)',
        }} />
      {/* orb teal */}
      <div className="absolute pointer-events-none" aria-hidden="true"
        style={{ top: '-10%', left: '5%', width: 600, height: 500, background: 'radial-gradient(ellipse, rgba(11,188,212,0.12) 0%, transparent 70%)', filter: 'blur(1px)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#0BBCD4] transition-colors">Home</Link>
          <span className="text-gray-700">/</span>
          <span className="text-gray-300">Blog</span>
        </nav>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-16 items-center">

          {/* ── Esquerda: texto ── */}
          <div className="lg:pr-4">
            <h1 className="text-5xl sm:text-6xl lg:text-[5.25rem] font-black text-white leading-[0.95] mb-7" style={{ letterSpacing: '-0.045em' }}>
              Conteúdo contábil<br /><span style={{ color: '#0BBCD4' }}>direto ao ponto.</span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-9 max-w-xl">
              Guias práticos sobre impostos, abertura de empresa, folha e gestão financeira — escritos pelos especialistas da Nauta.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span><strong className="text-white text-base">{artigos ?? 12}</strong> artigos</span>
              <span className="w-1 h-1 rounded-full bg-white/25" aria-hidden="true" />
              <span><strong className="text-white text-base">{temas ?? 8}</strong> temas</span>
              <span className="w-1 h-1 rounded-full bg-white/25" aria-hidden="true" />
              <span>sempre grátis, sem cadastro</span>
            </div>
          </div>

          {/* ── Direita: Mais Acessados ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/50">Mais Acessados</span>
              <div className="flex gap-1.5">
                <button onClick={() => go(-1)} aria-label="Anterior"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => go(1)} aria-label="Próximo"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <Link href={`/blog/${f.slug}`} key={f.slug}
              className="group block rounded-2xl overflow-hidden animate-[heroFadeUp_0.4s_ease-out]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div className="relative aspect-[16/9] overflow-hidden bg-[#0d1b2e]">
                <Image src={img(f.slug)} alt={f.title} fill sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              </div>
              <div className="p-5">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
                  style={{ color: '#0BBCD4', background: 'rgba(11,188,212,0.10)', border: '1px solid rgba(11,188,212,0.22)' }}>
                  {f.cat}
                </span>
                <h3 className="text-white font-black text-lg leading-snug mb-1.5 group-hover:text-[#0BBCD4] transition-colors" style={{ letterSpacing: '-0.02em' }}>
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{f.sub}</p>
              </div>
            </Link>

            {/* dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {FEATURED.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Ir para destaque ${idx + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: idx === i ? 20 : 6, background: idx === i ? '#0BBCD4' : 'rgba(255,255,255,0.20)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  )
}
