'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCategorias, getTags, adminSavePost, adminSaveTag, uploadImage } from '@/lib/api'
import type { Categoria, Tag } from '@/types/blog'
import { ArrowLeft, Loader2, Save, Send, Plus, X, ImageIcon } from 'lucide-react'

// Carrega o editor apenas no client (SSR incompatível)
const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false, loading: () => (
  <div className="h-64 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
    <Loader2 size={20} className="animate-spin text-[#0BBCD4]" />
  </div>
) })

function slugify(text: string) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
}

function input(extra = {}) {
  return {
    style: { ...INPUT_STYLE, ...extra },
    className: 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none',
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = 'rgba(11,188,212,0.5)'
      e.target.style.boxShadow = '0 0 0 3px rgba(11,188,212,0.08)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = 'rgba(255,255,255,0.10)'
      e.target.style.boxShadow = 'none'
    },
  }
}

export default function NovoPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [uploading, setUploading] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  const [form, setForm] = useState({
    titulo: '',
    slug: '',
    resumo: '',
    conteudo: '',
    imagem_destaque: '',
    autor: 'Equipe Nauta',
    categoria_id: '',
    status: 'rascunho' as 'rascunho' | 'publicado',
    tagIds: [] as string[],
  })

  useEffect(() => {
    getCategorias().then(setCategorias)
    getTags().then(setAllTags)
  }, [])

  const set = (field: string, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }))

  // Auto-slug
  const handleTituloChange = (titulo: string) => {
    setForm(f => ({ ...f, titulo, slug: slugify(titulo) }))
  }

  const toggleTag = (id: string) => {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter(t => t !== id) : [...f.tagIds, id],
    }))
  }

  const createTag = async () => {
    if (!newTagInput.trim()) return
    const tag = await adminSaveTag({ nome: newTagInput.trim(), slug: slugify(newTagInput) })
    setAllTags(prev => [...prev, tag])
    setForm(f => ({ ...f, tagIds: [...f.tagIds, tag.id] }))
    setNewTagInput('')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      set('imagem_destaque', url)
    } catch (err) {
      alert('Erro ao enviar imagem: ' + (err instanceof Error ? err.message : String(err)))
    }
    setUploading(false)
  }

  async function handleSave(status: 'rascunho' | 'publicado') {
    if (!form.titulo.trim()) { alert('Título obrigatório.'); return }
    setSaving(true)
    try {
      await adminSavePost({ ...form, status, slug: form.slug || slugify(form.titulo) })
      router.push('/admin/blog')
    } catch (e: unknown) {
      alert('Erro ao salvar: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/blog" className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/08" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
          <ArrowLeft size={15} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Novo artigo</h1>
          <p className="text-gray-600 text-xs mt-0.5">Crie e publique um novo post no blog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Coluna principal */}
        <div className="space-y-5">
          {/* Título */}
          <InputField label="Título" required>
            <input
              type="text"
              placeholder="Como calcular o Fator R..."
              value={form.titulo}
              onChange={e => handleTituloChange(e.target.value)}
              {...input()}
            />
          </InputField>

          {/* Slug */}
          <InputField label="Slug (URL)">
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-xs text-gray-600 pl-4 pr-1 shrink-0">/blog/</span>
              <input
                type="text"
                value={form.slug}
                onChange={e => set('slug', e.target.value)}
                className="flex-1 h-11 pr-4 bg-transparent text-sm text-white outline-none"
                placeholder="slug-do-artigo"
              />
            </div>
          </InputField>

          {/* Resumo */}
          <InputField label="Resumo">
            <textarea
              rows={3}
              placeholder="Breve descrição do artigo (aparece nos cards e na meta description)..."
              value={form.resumo}
              onChange={e => set('resumo', e.target.value)}
              {...input({ height: 'auto' })}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none"
              style={INPUT_STYLE}
            />
          </InputField>

          {/* Conteúdo */}
          <InputField label="Conteúdo" required>
            <TipTapEditor
              value={form.conteudo}
              onChange={v => set('conteudo', v)}
              placeholder="Escreva o conteúdo completo do artigo aqui..."
            />
          </InputField>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Ações */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-bold text-white">Publicação</h3>
            <button
              onClick={() => handleSave('publicado')}
              disabled={saving}
              className="w-full h-10 font-bold text-white text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 4px 16px rgba(11,188,212,0.2)' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publicar
            </button>
            <button
              onClick={() => handleSave('rascunho')}
              disabled={saving}
              className="w-full h-10 font-semibold text-gray-300 text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/08 disabled:opacity-60"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Save size={14} /> Salvar rascunho
            </button>
          </div>

          {/* Imagem destaque */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-bold text-white mb-3">Imagem destaque</h3>
            {form.imagem_destaque ? (
              <div className="relative">
                <img src={form.imagem_destaque} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                <button
                  onClick={() => set('imagem_destaque', '')}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center h-28 rounded-xl cursor-pointer transition-colors hover:bg-white/05"
                style={{ border: '2px dashed rgba(255,255,255,0.12)' }}
              >
                {uploading
                  ? <Loader2 size={20} className="animate-spin text-[#0BBCD4]" />
                  : <><ImageIcon size={20} className="text-gray-600 mb-2" /><span className="text-xs text-gray-500">Clique para upload</span></>
                }
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
            {/* URL manual */}
            <input
              type="text"
              placeholder="Ou cole a URL da imagem..."
              value={form.imagem_destaque}
              onChange={e => set('imagem_destaque', e.target.value)}
              {...input({ marginTop: '0.75rem', height: '2.25rem', fontSize: '0.75rem' })}
              className="w-full px-3 rounded-lg text-xs text-gray-400 placeholder-gray-600 outline-none mt-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Categoria */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-bold text-white mb-3">Categoria</h3>
            <select
              value={form.categoria_id}
              onChange={e => set('categoria_id', e.target.value)}
              className="w-full h-10 px-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <option value="">Sem categoria</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-bold text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: form.tagIds.includes(tag.id) ? 'rgba(11,188,212,0.15)' : 'rgba(255,255,255,0.05)',
                    color: form.tagIds.includes(tag.id) ? '#0BBCD4' : '#6b7280',
                    border: form.tagIds.includes(tag.id) ? '1px solid rgba(11,188,212,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  #{tag.nome}
                </button>
              ))}
            </div>
            {/* Nova tag inline */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nova tag..."
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), createTag())}
                className="flex-1 h-8 px-3 rounded-lg text-xs text-white placeholder-gray-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
              />
              <button
                type="button"
                onClick={createTag}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.2)' }}
              >
                <Plus size={14} className="text-[#0BBCD4]" />
              </button>
            </div>
          </div>

          {/* Autor */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-bold text-white mb-3">Autor</h3>
            <input
              type="text"
              value={form.autor}
              onChange={e => set('autor', e.target.value)}
              {...input({ height: '2.5rem' })}
              className="w-full px-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', height: '2.5rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
