'use client'

import { useEffect, useState, useCallback } from 'react'
import { Settings, Sun, Moon, Volume2, VolumeX, Tag, Plus, Trash2, Loader2 } from 'lucide-react'
import { getTema, setTema, getSomAtivo, setSomAtivo, type Tema } from '@/lib/sys-prefs'
import { listCategoriasServico, addCategoriaServico, deleteCategoriaServico, type CategoriaServico } from '@/lib/api'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className="relative w-12 h-7 rounded-full transition-colors shrink-0"
      style={{ background: on ? '#0BBCD4' : 'var(--sys-border-2)' }}>
      <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}

export default function ConfiguracoesPage() {
  const [tema, setTemaUI] = useState<Tema>('dark')
  const [som, setSomUI] = useState(true)

  useEffect(() => { setTemaUI(getTema()); setSomUI(getSomAtivo()) }, [])

  function trocarTema(claro: boolean) {
    const t: Tema = claro ? 'light' : 'dark'
    setTemaUI(t); setTema(t)
  }
  function trocarSom(on: boolean) {
    setSomUI(on); setSomAtivo(on)
  }

  // Categorias de serviço avulso (Lançar Entrada)
  const [cats, setCats] = useState<CategoriaServico[]>([])
  const [novaCat, setNovaCat] = useState('')
  const [salvandoCat, setSalvandoCat] = useState(false)
  const loadCats = useCallback(() => { listCategoriasServico().then(setCats).catch(() => {}) }, [])
  useEffect(() => { loadCats() }, [loadCats])
  async function addCat() {
    if (!novaCat.trim()) return
    setSalvandoCat(true)
    try { await addCategoriaServico(novaCat.trim()); setNovaCat(''); loadCats() }
    catch { alert('Erro ao adicionar.') }
    finally { setSalvandoCat(false) }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Settings size={22} className="text-[#0BBCD4]" /> Configurações
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Preferências e ajustes do sistema</p>
      </div>

      <div className="space-y-3">
        {/* Tema */}
        <div className="flex items-center justify-between gap-4 rounded-2xl p-5"
          style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--sys-surface-3)' }}>
              {tema === 'light' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-[#0BBCD4]" />}
            </span>
            <div>
              <p className="text-sm font-bold text-white">Tema {tema === 'light' ? 'claro' : 'escuro'}</p>
              <p className="text-xs text-gray-500">Alterna a aparência do sistema entre claro e escuro</p>
            </div>
          </div>
          <Toggle on={tema === 'light'} onChange={trocarTema} />
        </div>

        {/* Sons */}
        <div className="flex items-center justify-between gap-4 rounded-2xl p-5"
          style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--sys-surface-3)' }}>
              {som ? <Volume2 size={18} className="text-[#0BBCD4]" /> : <VolumeX size={18} className="text-gray-500" />}
            </span>
            <div>
              <p className="text-sm font-bold text-white">Sons do sistema</p>
              <p className="text-xs text-gray-500">Som de clique ao navegar pelo menu</p>
            </div>
          </div>
          <Toggle on={som} onChange={trocarSom} />
        </div>

        {/* Categorias de serviço avulso */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--sys-surface-3)' }}>
              <Tag size={18} className="text-[#22c55e]" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">Categorias de serviço avulso</p>
              <p className="text-xs text-gray-500">Usadas em Financeiro → Lançar Entrada (ex.: Declaração de IR)</p>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <input value={novaCat} onChange={e => setNovaCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCat()}
              placeholder="Nova categoria de serviço" className="flex-1 h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
              style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
            <button onClick={addCat} disabled={salvandoCat || !novaCat.trim()} className="h-10 px-4 rounded-lg text-sm font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              {salvandoCat ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Adicionar</>}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {cats.length === 0 && <p className="text-gray-600 text-xs">Nenhuma categoria cadastrada.</p>}
            {cats.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
                <span className="text-gray-200">{c.nome}</span>
                <button onClick={() => { if (confirm(`Excluir "${c.nome}"?`)) deleteCategoriaServico(c.id).then(loadCats) }} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
