'use client'

import { useState, useEffect } from 'react'
import { getCategorias, adminSaveCategoria, adminDeleteCategoria } from '@/lib/blog'
import type { Categoria } from '@/types/blog'
import { Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

const FIELD_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
}

export default function CategoriasPage() {
  const [cats, setCats] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [newNome, setNewNome] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); getCategorias().then(setCats).finally(() => setLoading(false)) }
  useEffect(load, [])

  async function handleCreate() {
    if (!newNome.trim()) return
    setSaving(true)
    await adminSaveCategoria({ nome: newNome.trim(), slug: slugify(newNome) })
    setNewNome(''); load(); setSaving(false)
  }

  async function handleEdit(id: string) {
    if (!editNome.trim()) return
    setSaving(true)
    await adminSaveCategoria({ id, nome: editNome.trim(), slug: slugify(editNome) })
    setEditId(null); load(); setSaving(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir categoria "${nome}"?`)) return
    await adminDeleteCategoria(id); load()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Categorias</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie as categorias do blog</p>
      </div>

      {/* Nova categoria */}
      <div className="flex gap-3 mb-8">
        <input type="text" placeholder="Nome da nova categoria..." value={newNome} onChange={e => setNewNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="flex-1 h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none" style={FIELD_STYLE} />
        <button onClick={handleCreate} disabled={saving || !newNome.trim()}
          className="h-11 px-5 font-bold text-white text-sm rounded-xl flex items-center gap-2 transition-all hover:-translate-y-px disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
        </button>
      </div>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-[#0BBCD4]" /></div>
        ) : cats.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-white/[0.02] transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {editId === cat.id ? (
              <>
                <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEdit(cat.id)}
                  autoFocus className="flex-1 h-9 px-3 rounded-xl text-sm text-white outline-none" style={FIELD_STYLE} />
                <button onClick={() => handleEdit(cat.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-green-400 hover:bg-green-500/10 transition-colors">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white/08 transition-colors">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{cat.nome}</p>
                  <p className="text-gray-600 text-xs">/blog?categoria={cat.slug}</p>
                </div>
                <button onClick={() => { setEditId(cat.id); setEditNome(cat.nome) }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/08 transition-colors">
                  <Pencil size={13} className="text-gray-400" />
                </button>
                <button onClick={() => handleDelete(cat.id, cat.nome)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors">
                  <Trash2 size={13} className="text-gray-500 hover:text-red-400" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
