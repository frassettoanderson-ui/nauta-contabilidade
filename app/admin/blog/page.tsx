'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { adminGetPosts, adminDeletePost, adminToggleStatus } from '@/lib/blog'
import type { PostWithRelations } from '@/types/blog'

export default function AdminBlogPage() {
  const [posts, setPosts]   = useState<PostWithRelations[]>([])
  const [filter, setFilter] = useState<'todos' | 'publicado' | 'rascunho'>('todos')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const status = filter === 'todos' ? undefined : filter as 'publicado' | 'rascunho'
    adminGetPosts(status).then(setPosts).finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, titulo: string) {
    if (!window.confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(id)
    await adminDeletePost(id)
    setDeleting(null)
    load()
  }

  async function handleToggle(id: string, status: 'rascunho' | 'publicado') {
    setToggling(id)
    await adminToggleStatus(id, status)
    setToggling(null)
    load()
  }

  const statusBadge = (status: 'rascunho' | 'publicado') =>
    status === 'publicado'
      ? { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.25)', label: 'Publicado' }
      : { bg: 'rgba(251,191,36,0.10)', color: '#f59e0b', border: 'rgba(251,191,36,0.25)', label: 'Rascunho' }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Posts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{posts.length} artigo{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/blog/novo"
          className="inline-flex items-center gap-2 px-5 py-2.5 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 4px 16px rgba(11,188,212,0.2)' }}
        >
          <Plus size={15} /> Novo artigo
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['todos', 'publicado', 'rascunho'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
            style={{
              background: filter === f ? 'rgba(11,188,212,0.15)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#0BBCD4' : '#6b7280',
              border: filter === f ? '1px solid rgba(11,188,212,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {f === 'todos' ? 'Todos' : f === 'publicado' ? 'Publicados' : 'Rascunhos'}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Cabeçalho */}
        <div
          className="grid text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 border-b"
          style={{ gridTemplateColumns: '1fr 180px 120px 110px 100px', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span>Título</span>
          <span>Categoria</span>
          <span>Status</span>
          <span>Data</span>
          <span className="text-right">Ações</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#0BBCD4]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum artigo encontrado.</p>
            <Link href="/admin/blog/novo" className="text-[#0BBCD4] text-sm mt-2 inline-block hover:underline">Criar o primeiro artigo</Link>
          </div>
        ) : (
          posts.map((post, i) => {
            const badge = statusBadge(post.status)
            const date  = format(new Date(post.criado_em), 'dd/MM/yyyy', { locale: ptBR })
            return (
              <div
                key={post.id}
                className="grid items-center px-5 py-3.5 border-b last:border-0 hover:bg-white/[0.02] transition-colors"
                style={{ gridTemplateColumns: '1fr 180px 120px 110px 100px', borderColor: 'rgba(255,255,255,0.05)' }}
              >
                {/* Título */}
                <div className="min-w-0 pr-4">
                  <p className="text-white text-sm font-semibold truncate">{post.titulo}</p>
                  <p className="text-gray-600 text-xs mt-0.5 truncate">/blog/{post.slug}</p>
                </div>

                {/* Categoria */}
                <span className="text-gray-400 text-xs truncate">{post.categoria?.nome ?? '—'}</span>

                {/* Status badge */}
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold w-fit"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                >
                  {badge.label}
                </span>

                {/* Data */}
                <span className="text-gray-500 text-xs">{date}</span>

                {/* Ações */}
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/08"
                    title="Editar"
                  >
                    <Edit2 size={13} className="text-gray-400 hover:text-white" />
                  </Link>
                  <button
                    onClick={() => handleToggle(post.id, post.status)}
                    disabled={toggling === post.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/08"
                    title={post.status === 'publicado' ? 'Despublicar' : 'Publicar'}
                  >
                    {toggling === post.id
                      ? <Loader2 size={13} className="animate-spin text-gray-500" />
                      : post.status === 'publicado'
                        ? <EyeOff size={13} className="text-gray-400 hover:text-amber-400" />
                        : <Eye size={13} className="text-gray-400 hover:text-green-400" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(post.id, post.titulo)}
                    disabled={deleting === post.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                    title="Excluir"
                  >
                    {deleting === post.id
                      ? <Loader2 size={13} className="animate-spin text-gray-500" />
                      : <Trash2 size={13} className="text-gray-500 hover:text-red-400" />
                    }
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
