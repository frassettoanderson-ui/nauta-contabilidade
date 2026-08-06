'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BlogHeader from '@/components/blog/BlogHeader'
import Footer from '@/components/Footer'
import BlogCard from '@/components/blog/BlogCard'
import BlogSidebar from '@/components/blog/BlogSidebar'
import BlogHero from '@/components/blog/BlogHero'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { getPosts, getCategorias } from '@/lib/api'
import type { PostWithRelations, Categoria, PaginatedPosts } from '@/types/blog'

function BlogContent() {
  const router = useRouter()
  const params = useSearchParams()


  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [result, setResult]         = useState<PaginatedPosts | null>(null)
  const [loading, setLoading]       = useState(true)

  const page      = Number(params.get('page') ?? 1)
  const categoria = params.get('categoria') ?? undefined
  const busca     = params.get('busca') ?? undefined

  useEffect(() => {
    getCategorias().then(setCategorias)
  }, [])

  useEffect(() => {
    setLoading(true)
    getPosts({ page, categoria, busca })
      .then(setResult)
      .finally(() => setLoading(false))
  }, [page, categoria, busca])

  function navigate(updates: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) sp.set(k, v); else sp.delete(k)
    })
    // mudança de filtro/busca volta pra página 1; paginação mantém a página escolhida
    if (!('page' in updates)) sp.delete('page')
    router.push(`/blog?${sp.toString()}`, { scroll: false })
  }

  return (
    <>
      <BlogHeader />
      <main>
        <BlogHero artigos={result?.total} temas={categorias.length || undefined} />

        <section className="py-12 section-dark min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10 lg:gap-12">

            <BlogSidebar />

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex justify-center py-24">
                  <Loader2 size={32} className="animate-spin text-[#0BBCD4]" />
                </div>
              ) : result && result.posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {result.posts.map(post => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>

                  {result.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => navigate({ page: String(page - 1) })}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                      >
                        <ChevronLeft size={16} className="text-gray-300" />
                      </button>
                      {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => navigate({ page: String(p) })}
                          className="w-9 h-9 rounded-xl text-sm font-bold transition-all"
                          style={{
                            background: p === page ? '#0BBCD4' : 'rgba(255,255,255,0.06)',
                            color: p === page ? '#fff' : '#9ca3af',
                            border: p === page ? 'none' : '1px solid rgba(255,255,255,0.10)',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        disabled={page >= result.totalPages}
                        onClick={() => navigate({ page: String(page + 1) })}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                      >
                        <ChevronRight size={16} className="text-gray-300" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24">
                  <p className="text-gray-500 text-lg">Nenhum artigo encontrado.</p>
                  {(busca || categoria) && (
                    <button
                      onClick={() => navigate({ busca: undefined, categoria: undefined })}
                      className="mt-4 text-[#0BBCD4] text-sm hover:underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function BlogPage() {
  return (
    <Suspense>
      <BlogContent />
    </Suspense>
  )
}
