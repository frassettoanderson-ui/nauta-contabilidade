'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Target, Check, Save } from 'lucide-react'
import { getMeta, setMeta } from '@/lib/api'

const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const FIELD = 'w-full h-11 px-3.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none'

const mesAtual = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const mesLabel = (comp: string) => {
  const [y, m] = comp.split('-').map(Number)
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${nomes[(m || 1) - 1]} / ${y}`
}

export default function CadastrarMetaPage() {
  const [competencia, setCompetencia] = useState(mesAtual())
  const [meta, setMetaVal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const carregar = useCallback((comp: string) => {
    setLoading(true)
    getMeta(comp)
      .then(d => setMetaVal(d.metaClientes ? String(d.metaClientes) : ''))
      .catch(() => setMetaVal(''))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar(competencia) }, [competencia, carregar])

  async function salvar() {
    setSaving(true); setSalvo(false)
    try {
      await setMeta(competencia, Number(meta) || 0)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch { alert('Erro ao salvar a meta.') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Target size={22} className="text-[color:var(--sys-accent)]" /> Cadastrar meta
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Meta de clientes novos por mês — usada como base no painel de resultados.</p>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Mês da meta</label>
          <input type="month" value={competencia} onChange={e => setCompetencia(e.target.value || mesAtual())}
            className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
          <p className="text-xs text-gray-500 mt-1">{mesLabel(competencia)}</p>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Meta de clientes novos</label>
          {loading ? (
            <div className="h-11 flex items-center px-3.5 rounded-lg" style={FS}>
              <Loader2 size={15} className="animate-spin text-[color:var(--sys-accent)]" />
              <span className="text-xs text-gray-500 ml-2">Carregando…</span>
            </div>
          ) : (
            <input type="number" min={0} inputMode="numeric" value={meta} placeholder="Ex.: 20"
              onChange={e => setMetaVal(e.target.value.replace(/\D/g, ''))}
              className={FIELD} style={FS} />
          )}
          <p className="text-xs text-gray-500 mt-1">Quantos clientes novos o escritório quer fechar neste mês.</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={salvar} disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar meta
          </button>
          {salvo && <span className="text-sm text-[#22c55e] flex items-center gap-1.5"><Check size={15} /> Meta salva!</span>}
        </div>
      </div>
    </div>
  )
}
