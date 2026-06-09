'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import PostCard from '@/components/blog/PostCard'
import InnerHero from '@/components/ui/inner-hero'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { getPosts, getCategorias } from '@/lib/api'
import type { PostWithRelations, Categoria, PaginatedPosts } from '@/types/blog'

function BlogContent() {
  const router = useRouter()
  const params = useSearchParams()

  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [result, setResult]         = useState<PaginatedPosts | null>(null)
  const [loading, setLoading]       = useState(true)

  const page      = Number(params.get('page') ?? 1)
  const categoria = params.get('categoria') ?? undefined
  const busca     = params.get('busca') ?? undefined

  const [searchInput, setSearchInput] = useState(busca ?? '')

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
    sp.delete('page')
    router.push(`/blog?${sp.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ busca: searchInput || undefined })
  }

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Blog Nauta"
          title={<>Conteúdo contábil<br /><span style={{ color: '#0BBCD4' }}>direto ao ponto.</span></>}
          description="Artigos, guias e análises sobre contabilidade, tributação e gestão financeira escritos por especialistas."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]}
          stats={result ? [
            { value: String(result.total), label: 'artigos publicados' },
            { value: String(categorias.length), label: 'categorias' },
            { value: 'Grátis', label: 'sem cadastro' },
          ] : undefined}
          purpleOrb
        />

        <section className="py-12 section-dark min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Busca + filtros */}
            <div className="flex flex-col md:flex-row gap-4 mb-10">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(11,188,212,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,188,212,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
                />
              </form>

              {/* Categorias pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate({ categoria: undefined })}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150"
                  style={{
                    background: !categoria ? '#0BBCD4' : 'rgba(255,255,255,0.05)',
                    color: !categoria ? '#fff' : '#9ca3af',
                    border: !categoria ? 'none' : '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  Todos
                </button>
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => navigate({ categoria: cat.slug })}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150"
                    style={{
                      background: categoria === cat.slug ? '#0BBCD4' : 'rgba(255,255,255,0.05)',
                      color: categoria === cat.slug ? '#fff' : '#9ca3af',
                      border: categoria === cat.slug ? 'none' : '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    {cat.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 size={32} className="animate-spin text-[#0BBCD4]" />
              </div>
            ) : result && result.posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                {result.posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-gray-500 text-lg">Nenhum artigo encontrado.</p>
                {(busca || categoria) && (
                  <button
                    onClick={() => { setSearchInput(''); navigate({ busca: undefined, categoria: undefined }) }}
                    className="mt-4 text-[#0BBCD4] text-sm hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            {/* Paginação */}
            {result && result.totalPages > 1 && (
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
          </div>
        </section>
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
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
