'use client'

import { useState, useEffect } from 'react'
import { getTags, adminSaveTag, adminDeleteTag } from '@/lib/api'
import type { Tag } from '@/types/blog'
import { Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

const FIELD_STYLE = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [newNome, setNewNome] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); getTags().then(setTags).finally(() => setLoading(false)) }
  useEffect(load, [])

  async function handleCreate() {
    if (!newNome.trim()) return
    setSaving(true)
    await adminSaveTag({ nome: newNome.trim(), slug: slugify(newNome) })
    setNewNome(''); load(); setSaving(false)
  }

  async function handleEdit(id: string) {
    if (!editNome.trim()) return
    setSaving(true)
    await adminSaveTag({ id, nome: editNome.trim(), slug: slugify(editNome) })
    setEditId(null); load(); setSaving(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir tag "#${nome}"?`)) return
    await adminDeleteTag(id); load()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Tags</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie as tags do blog</p>
      </div>

      <div className="flex gap-3 mb-8">
        <input type="text" placeholder="Nome da nova tag..." value={newNome} onChange={e => setNewNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="flex-1 h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none" style={FIELD_STYLE} />
        <button onClick={handleCreate} disabled={saving || !newNome.trim()}
          className="h-11 px-5 font-bold text-white text-sm rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {loading ? <Loader2 size={20} className="animate-spin text-[#0BBCD4] m-4" /> : tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            {editId === tag.id ? (
              <>
                <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEdit(tag.id)} autoFocus
                  className="h-7 px-2 rounded-lg text-xs text-white outline-none w-28" style={FIELD_STYLE} />
                <button onClick={() => handleEdit(tag.id)} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                <button onClick={() => setEditId(null)} className="text-gray-600 hover:text-gray-400"><X size={12} /></button>
              </>
            ) : (
              <>
                <span className="text-xs font-semibold text-gray-300">#{tag.nome}</span>
                <button onClick={() => { setEditId(tag.id); setEditNome(tag.nome) }} className="text-gray-600 hover:text-gray-300 transition-colors"><Pencil size={11} /></button>
                <button onClick={() => handleDelete(tag.id, tag.nome)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
