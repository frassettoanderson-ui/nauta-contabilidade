'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowLeft } from 'lucide-react'
import BlogHeader from '@/components/blog/BlogHeader'
import Footer from '@/components/Footer'
import BlogCard from '@/components/blog/BlogCard'
import ArticleBody from '@/components/blog/ArticleBody'
import AuthorByline, { AuthorBox } from '@/components/blog/AuthorByline'
import ArticleTOC from '@/components/blog/ArticleTOC'
import ShareButtons from '@/components/blog/ShareButtons'
import NautaAdBanner from '@/components/blog/NautaAdBanner'
import ArticlePromoSidebar from '@/components/blog/ArticlePromoSidebar'
import CommentSection from '@/components/blog/CommentSection'
import BlogFooterSections from '@/components/blog/BlogFooterSections'
import { processArticleHtml, splitForBanner } from '@/lib/article-html'
import type { PostWithRelations } from '@/types/blog'

interface Props {
  post: PostWithRelations
  related: PostWithRelations[]
  date: string
}

export default function ArticlePageShell({ post, related, date }: Props) {
  const { html, headings } = useMemo(() => processArticleHtml(post.conteudo ?? ''), [post.conteudo])
  const [firstHalf, secondHalf] = useMemo(() => splitForBanner(html), [html])

  return (
    <>
      <BlogHeader />

      <main style={{ background: '#0a0918' }}>
        {/* ── Hero com imagem ── */}
        <div className="relative w-full" style={{ height: 'clamp(260px, 36vw, 440px)', background: '#0f0e1a' }}>
          {post.imagem_destaque && (
            <Image src={post.imagem_destaque} alt={post.titulo} fill className="object-cover" priority />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,9,24,0.35) 0%, rgba(10,9,24,0.88) 100%)' }} />
          <div className="absolute top-24 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[#0BBCD4] transition-colors">Home</Link>
              <span className="text-gray-600">/</span>
              <Link href="/blog" className="hover:text-[#0BBCD4] transition-colors">Blog</Link>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300 line-clamp-1">{post.titulo}</span>
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-9">
            {post.categoria && (
              <span className="inline-block text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider mb-4"
                style={{ background: 'rgba(11,188,212,0.15)', color: '#0BBCD4', border: '1px solid rgba(11,188,212,0.35)', backdropFilter: 'blur(8px)' }}>
                {post.categoria.nome}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight max-w-4xl" style={{ letterSpacing: '-0.025em' }}>
              {post.titulo}
            </h1>
          </div>
        </div>

        {/* ── Corpo: 3 colunas ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-[210px_minmax(0,1fr)_300px] gap-8 xl:gap-12 items-start">

            {/* Índice (esquerda) */}
            <aside className="hidden lg:block self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
              <ArticleTOC headings={headings} />
            </aside>

            {/* Artigo (centro) */}
            <article className="min-w-0">
              {/* meta + compartilhar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <AuthorByline categoriaSlug={post.categoria?.slug} />
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Calendar size={14} className="text-[#0BBCD4]" /> {date}
                  </span>
                </div>
                <ShareButtons slug={post.slug} titulo={post.titulo} />
              </div>

              {/* resumo */}
              {post.resumo && (
                <p className="text-lg text-gray-300 leading-relaxed mb-10 pl-5" style={{ borderLeft: '3px solid #0BBCD4' }}>
                  {post.resumo}
                </p>
              )}

              {/* conteúdo com banner no meio */}
              <ArticleBody content={firstHalf} />
              <NautaAdBanner />
              {secondHalf && <ArticleBody content={secondHalf} />}

              {/* autor */}
              <AuthorBox categoriaSlug={post.categoria?.slug} />

              {/* tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/10">
                  {post.tags.map(tag => (
                    <span key={tag.id} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.10)' }}>
                      #{tag.nome}
                    </span>
                  ))}
                </div>
              )}

              {/* comentários */}
              <CommentSection postId={post.id} />

              <div className="mt-10">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0BBCD4] transition-colors">
                  <ArrowLeft size={15} /> Voltar para o blog
                </Link>
              </div>
            </article>

            {/* Materiais/CTAs (direita) */}
            <aside className="hidden lg:block self-start sticky top-24">
              <ArticlePromoSidebar categoriaSlug={post.categoria?.slug} />
            </aside>
          </div>
        </div>

        {/* ── Relacionados ── */}
        {related.length > 0 && (
          <section className="py-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0f0e1a' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-black text-white mb-8" style={{ letterSpacing: '-0.02em' }}>Posts relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map(p => <BlogCard key={p.id} post={p} />)}
              </div>
            </div>
          </section>
        )}
      </main>

      <BlogFooterSections />
      <Footer />
    </>
  )
}
