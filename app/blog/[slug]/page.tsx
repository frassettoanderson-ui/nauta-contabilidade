import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Calendar, User, Tag, ArrowLeft, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getPostBySlug, getRelatedPosts, getAllPublishedSlugs } from '@/lib/blog'
import PostCard from '@/components/blog/PostCard'
import ArticleBody from '@/components/blog/ArticleBody'
import ArticleCTA from '@/components/blog/ArticleCTA'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: 'Artigo não encontrado | Nauta Contabilidade' }
  return {
    title: `${post.titulo} | Nauta Contabilidade`,
    description: post.resumo ?? '',
    openGraph: {
      title: post.titulo,
      description: post.resumo ?? '',
      images: post.imagem_destaque ? [{ url: post.imagem_destaque, alt: post.titulo }] : [],
      type: 'article',
      publishedTime: post.criado_em,
      modifiedTime: post.atualizado_em,
      authors: [post.autor],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  const related = post.categoria_id
    ? await getRelatedPosts(post.categoria_id, post.id)
    : []

  const date = format(new Date(post.criado_em), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.titulo,
    description: post.resumo,
    image: post.imagem_destaque,
    author: { '@type': 'Person', name: post.autor },
    publisher: { '@type': 'Organization', name: 'Nauta Contabilidade', url: 'https://nautacontabilidade.com.br' },
    datePublished: post.criado_em,
    dateModified: post.atualizado_em,
    url: `https://nautacontabilidade.com.br/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://nautacontabilidade.com.br/blog/${post.slug}` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header precisa de client state — usamos um wrapper client */}
      <ArticlePageClient post={post} related={related} date={date} />
    </>
  )
}

// ── Sub-componente inline para evitar 'use client' no page ──────────────────
// (importado abaixo via ArticlePageShell para manter o server component limpo)
import ArticlePageShell from '@/components/blog/ArticlePageShell'

function ArticlePageClient({
  post, related, date,
}: {
  post: import('@/types/blog').PostWithRelations
  related: import('@/types/blog').PostWithRelations[]
  date: string
}) {
  return <ArticlePageShell post={post} related={related} date={date} />
}
