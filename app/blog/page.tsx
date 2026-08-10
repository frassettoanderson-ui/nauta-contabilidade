import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BlogHeader from '@/components/blog/BlogHeader'
import Footer from '@/components/Footer'
import BlogCard from '@/components/blog/BlogCard'
import BlogSidebar from '@/components/blog/BlogSidebar'
import BlogHero from '@/components/blog/BlogHero'
import BlogFooterSections from '@/components/blog/BlogFooterSections'
import { getPosts, getCategorias } from '@/lib/blog'

// Renderizado no servidor para que crawlers/IA vejam o H1 e a lista de artigos
// no HTML inicial. Revalida para acompanhar as publicações do agendador.
export const revalidate = 60

const pillBtn = 'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all'

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { page?: string; categoria?: string; busca?: string }
}) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const categoria = searchParams?.categoria || undefined
  const busca = searchParams?.busca || undefined

  const [result, categorias] = await Promise.all([
    getPosts({ page, categoria, search: busca }).catch(() => null),
    getCategorias().catch(() => []),
  ])

  const href = (p: number) => {
    const sp = new URLSearchParams()
    if (categoria) sp.set('categoria', categoria)
    if (busca) sp.set('busca', busca)
    if (p > 1) sp.set('page', String(p))
    const s = sp.toString()
    return s ? `/blog?${s}` : '/blog'
  }

  return (
    <>
      <BlogHeader />
      <main>
        <BlogHero artigos={result?.total} temas={categorias.length || undefined} />

        <section className="py-12 section-dark min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10 lg:gap-12">

            <Suspense>
              <BlogSidebar />
            </Suspense>

            <div className="flex-1 min-w-0">
              {result && result.posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {result.posts.map(post => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>

                  {result.totalPages > 1 && (
                    <nav className="flex items-center justify-center gap-2" aria-label="Paginação">
                      {page > 1 && (
                        <Link href={href(page - 1)} className={pillBtn} aria-label="Página anterior"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                          <ChevronLeft size={16} className="text-gray-300" />
                        </Link>
                      )}
                      {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={href(p)} aria-current={p === page ? 'page' : undefined}
                          className={pillBtn}
                          style={{
                            background: p === page ? '#0BBCD4' : 'rgba(255,255,255,0.06)',
                            color: p === page ? '#fff' : '#9ca3af',
                            border: p === page ? 'none' : '1px solid rgba(255,255,255,0.10)',
                          }}>
                          {p}
                        </Link>
                      ))}
                      {page < result.totalPages && (
                        <Link href={href(page + 1)} className={pillBtn} aria-label="Próxima página"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                      )}
                    </nav>
                  )}
                </>
              ) : (
                <div className="text-center py-24">
                  <p className="text-gray-500 text-lg">Nenhum artigo encontrado.</p>
                  {(busca || categoria) && (
                    <Link href="/blog" className="mt-4 inline-block text-[#0BBCD4] text-sm hover:underline">
                      Limpar filtros
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <BlogFooterSections />
      <Footer />
    </>
  )
}
