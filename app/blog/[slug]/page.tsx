import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Calendar, User, Tag, ArrowLeft, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getPostBySlug, getRelatedPosts, getAllPublishedSlugs } from '@/lib/blog'
import { autorPorCategoria } from '@/lib/autores'
import PostCard from '@/components/blog/PostCard'
import ArticleBody from '@/components/blog/ArticleBody'
import ArticleCTA from '@/components/blog/ArticleCTA'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const revalidate = 60

// Extrai perguntas (H2 em forma de pergunta) + a resposta seguinte do HTML do
// artigo, para emitir FAQPage (bom para featured snippet / AEO). Só usa H2 que
// são de fato perguntas e cuja resposta tem conteúdo — casa com o texto visível.
const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&aacute;/g, 'á')
const isPergunta = (q: string) =>
  /\?\s*$/.test(q) ||
  /^(o que|como|quando|quem|qual|quais|por que|porque|onde|quanto|quantos|quantas|vale a pena|d[áa] para|posso|preciso|é |devo|quais s[ãa]o)/i.test(q.trim())

function extrairFaq(html?: string | null): { q: string; a: string }[] {
  if (!html) return []
  const parts = html.split(/<h2[^>]*>/i)
  const faqs: { q: string; a: string }[] = []
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i]
    const end = seg.toLowerCase().indexOf('</h2>')
    if (end < 0) continue
    const q = decodeEntities(stripTags(seg.slice(0, end))).replace(/\s+/g, ' ').trim()
    const a = decodeEntities(stripTags(seg.slice(end + 5))).replace(/\s+/g, ' ').trim()
    if (!q || !isPergunta(q) || a.length < 40) continue
    faqs.push({ q, a: a.slice(0, 700) })
  }
  return faqs
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedSlugs()
    return slugs.map(slug => ({ slug }))
  } catch {
    // Banco indisponível no momento do build: não derruba o deploy.
    // Os posts continuam sendo renderizados sob demanda (revalidate + dynamicParams).
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: 'Artigo não encontrado | Nauta Contabilidade' }
  return {
    title: `${post.titulo} | Nauta Contabilidade`,
    description: post.resumo ?? '',
    alternates: { canonical: `https://nautacontabilidade.com.br/blog/${post.slug}` },
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
    author: {
      '@type': 'Person',
      name: autorPorCategoria(post.categoria?.slug).nome,
      jobTitle: autorPorCategoria(post.categoria?.slug).cargo,
      worksFor: { '@type': 'Organization', name: 'Nauta Contabilidade' },
      ...(autorPorCategoria(post.categoria?.slug).foto
        ? { image: `https://nautacontabilidade.com.br${autorPorCategoria(post.categoria?.slug).foto}` }
        : {}),
    },
    publisher: { '@type': 'Organization', name: 'Nauta Contabilidade', url: 'https://nautacontabilidade.com.br' },
    datePublished: post.criado_em,
    dateModified: post.atualizado_em,
    url: `https://nautacontabilidade.com.br/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://nautacontabilidade.com.br/blog/${post.slug}` },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://nautacontabilidade.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://nautacontabilidade.com.br/blog' },
      ...(post.categoria
        ? [{ '@type': 'ListItem', position: 3, name: post.categoria.nome, item: `https://nautacontabilidade.com.br/blog?categoria=${post.categoria.slug}` }]
        : []),
      { '@type': 'ListItem', position: post.categoria ? 4 : 3, name: post.titulo, item: `https://nautacontabilidade.com.br/blog/${post.slug}` },
    ],
  }

  const faqs = extrairFaq(post.conteudo)
  const faqLd = faqs.length >= 2 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null

  const graph = faqLd ? [jsonLd, breadcrumbLd, faqLd] : [jsonLd, breadcrumbLd]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

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
