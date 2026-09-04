'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Target, Check, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { getMetasAno, setMetasAno } from '@/lib/api'

const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function CadastrarMetaPage() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [metas, setMetas] = useState<string[]>(Array(12).fill(''))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const carregar = useCallback((y: number) => {
    setLoading(true); setSalvo(false)
    getMetasAno(y)
      .then(d => setMetas(d.metas.map(v => (v ? String(v) : ''))))
      .catch(() => setMetas(Array(12).fill('')))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { carregar(ano) }, [ano, carregar])

  const setMes = (i: number, v: string) => setMetas(m => m.map((x, j) => (j === i ? v.replace(/\D/g, '') : x)))

  async function salvar() {
    setSaving(true); setSalvo(false)
    try {
      await setMetasAno(ano, metas.map(v => Number(v) || 0))
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch { alert('Erro ao salvar as metas.') }
    finally { setSaving(false) }
  }

  const total = metas.reduce((s, v) => s + (Number(v) || 0), 0)
  const mesAtual = ano === hoje.getFullYear() ? hoje.getMonth() : -1

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Target size={22} className="text-[color:var(--sys-accent)]" /> Cadastrar meta
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Meta de clientes novos por mês — usada como base no painel de resultados.</p>
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        {/* Seletor de ano */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <button type="button" onClick={() => setAno(a => a - 1)} title="Ano anterior"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white" style={FS}>
            <ChevronLeft size={18} />
          </button>
          <span className="text-3xl font-black text-white tabular-nums w-24 text-center" style={{ letterSpacing: '-0.02em' }}>{ano}</span>
          <button type="button" onClick={() => setAno(a => a + 1)} title="Próximo ano"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white" style={FS}>
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MESES.map((nome, i) => {
              const atual = i === mesAtual
              return (
                <div key={nome} className="rounded-xl p-3 text-center"
                  style={{
                    background: atual ? 'color-mix(in srgb, var(--sys-accent) 10%, transparent)' : 'var(--sys-surface-2)',
                    border: atual ? '1px solid color-mix(in srgb, var(--sys-accent) 40%, transparent)' : '1px solid var(--sys-border)',
                  }}>
                  <label className="block text-[11px] font-bold uppercase tracking-wide mb-2"
                    style={{ color: atual ? 'var(--sys-accent)' : '#9ca3af' }}>
                    {nome}{atual && ' · atual'}
                  </label>
                  <input type="text" inputMode="numeric" value={metas[i]} placeholder="0"
                    onChange={e => setMes(i, e.target.value)}
                    className="w-full h-11 rounded-lg text-center text-xl font-black text-white placeholder-gray-600 outline-none"
                    style={FS} />
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--sys-border)' }}>
          <p className="text-sm text-gray-400">Total do ano: <b className="text-white">{total}</b> clientes</p>
          <div className="flex items-center gap-3">
            {salvo && <span className="text-sm text-[#22c55e] flex items-center gap-1.5"><Check size={15} /> Metas salvas!</span>}
            <button onClick={salvar} disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar {ano}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
