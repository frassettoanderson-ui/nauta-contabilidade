'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import PostCard from '@/components/blog/PostCard'
import ArticleBody from '@/components/blog/ArticleBody'
import type { PostWithRelations } from '@/types/blog'

interface Props {
  post: PostWithRelations
  related: PostWithRelations[]
  date: string
}

const CATEGORY_COLORS: Record<string, string> = {
  fiscal: '#0BBCD4',
  trabalhista: '#7c6fff',
  empresarial: '#9d9bff',
  'contabilidade-eleitoral': '#0BBCD4',
  mei: '#22c55e',
  'planejamento-tributario': '#d97706',
}

export default function ArticlePageShell({ post, related, date }: Props) {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  const accentColor = post.categoria?.slug
    ? (CATEGORY_COLORS[post.categoria.slug] ?? '#0BBCD4')
    : '#0BBCD4'

  return (
    <>
      <Header onOpenLead={openLead} />

      <main style={{ background: '#0a0918' }}>
        {/* ── Imagem destaque hero ── */}
        <div className="relative w-full" style={{ height: 'clamp(280px, 40vw, 480px)', background: '#0f0e1a' }}>
          {post.imagem_destaque ? (
            <Image
              src={post.imagem_destaque}
              alt={post.titulo}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(11,188,212,0.08), transparent)` }}
            />
          )}
          {/* Overlay gradiente */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,9,24,0.3) 0%, rgba(10,9,24,0.85) 100%)' }} />

          {/* Breadcrumb sobre a imagem */}
          <div className="absolute top-28 left-0 right-0 max-w-3xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[#0BBCD4] transition-colors">Home</Link>
              <span className="text-gray-600">/</span>
              <Link href="/blog" className="hover:text-[#0BBCD4] transition-colors">Blog</Link>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300 line-clamp-1">{post.titulo}</span>
            </nav>
          </div>

          {/* Título sobre a imagem */}
          <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto px-4 sm:px-6 pb-10">
            {post.categoria && (
              <span
                className="inline-block text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider mb-4"
                style={{
                  background: `rgba(${accentColor === '#0BBCD4' ? '11,188,212' : '124,111,255'},0.15)`,
                  color: accentColor,
                  border: `1px solid ${accentColor}44`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {post.categoria.nome}
              </span>
            )}
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight"
              style={{ letterSpacing: '-0.025em' }}
            >
              {post.titulo}
            </h1>
          </div>
        </div>

        {/* ── Corpo do artigo ── */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-10 pb-8 border-b border-white/08">
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <User size={14} className="text-[#0BBCD4]" />
              {post.autor}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <Calendar size={14} className="text-[#0BBCD4]" />
              {date}
            </span>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    #{tag.nome}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Resumo destacado */}
          {post.resumo && (
            <p
              className="text-lg text-gray-300 leading-relaxed mb-10 pl-5"
              style={{ borderLeft: `3px solid ${accentColor}` }}
            >
              {post.resumo}
            </p>
          )}

          {/* Conteúdo */}
          <ArticleBody content={post.conteudo ?? ''} />

          {/* Tags ao final */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-white/08">
              {post.tags.map(tag => (
                <span
                  key={tag.id}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  #{tag.nome}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div
            className="mt-12 rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(11,188,212,0.05)',
              border: '1px solid rgba(11,188,212,0.15)',
            }}
          >
            <h3 className="text-xl font-black text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
              Ficou com dúvidas?
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Fale com um contador especialista agora. Sem compromisso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => openLead(post.titulo)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: '#0BBCD4', boxShadow: '0 8px 24px rgba(11,188,212,0.25)' }}
              >
                Falar com um contador
              </button>
              <a
                href="https://wa.me/554899245194"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Voltar */}
          <div className="mt-10">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0BBCD4] transition-colors">
              <ArrowLeft size={15} /> Voltar para o blog
            </Link>
          </div>
        </div>

        {/* ── Artigos relacionados ── */}
        {related.length > 0 && (
          <section
            className="py-16 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0f0e1a' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-black text-white mb-8" style={{ letterSpacing: '-0.02em' }}>
                Artigos relacionados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map(p => <PostCard key={p.id} post={p} />)}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}
