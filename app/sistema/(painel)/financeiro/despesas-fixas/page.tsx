'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Plus, Trash2, Repeat } from 'lucide-react'
import { listDespesasFixas, addDespesaFixa, toggleDespesaFixa, deleteDespesaFixa, type DespesaFixa } from '@/lib/api'

const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const FIELD = 'w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none'
const brl = (v: unknown) => { const n = Number(v); return isNaN(n) || v == null ? '—' : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function DespesasFixasPage() {
  const [rows, setRows] = useState<DespesaFixa[] | null>(null)
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [dia, setDia] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => { listDespesasFixas().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!descricao.trim()) { alert('Informe a descrição.'); return }
    setSaving(true)
    try {
      await addDespesaFixa({ descricao, categoria, valor: valor ? Number(valor) : undefined, dia_vencimento: dia ? Number(dia) : undefined })
      setDescricao(''); setCategoria(''); setValor(''); setDia('')
      load()
    } catch { alert('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  const totalMensal = (rows ?? []).filter(d => d.ativo).reduce((s, d) => s + Number(d.valor || 0), 0)

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
        <Repeat size={22} className="text-[#fbbf24]" /> Despesas fixas
      </h1>
      <p className="text-gray-500 text-sm mb-6">Despesas recorrentes mensais (aluguel, sistemas, salários…).</p>

      <div className="rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Descrição</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Aluguel do escritório" className={FIELD} style={FS} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Categoria</label>
          <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex.: Fixa" className={FIELD} style={FS} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Valor (R$)</label>
          <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className={FIELD} style={FS} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Dia venc.</label>
          <div className="flex gap-2">
            <input type="number" min="1" max="31" value={dia} onChange={e => setDia(e.target.value)} placeholder="10" className={FIELD} style={FS} />
            <button onClick={salvar} disabled={saving} className="h-10 px-3 rounded-lg text-white shrink-0 inline-flex items-center disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
        </div>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#0BBCD4]" /></div>
      ) : rows.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">Nenhuma despesa fixa cadastrada.</p>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <table className="w-full text-sm whitespace-nowrap">
            <thead><tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
              {['Descrição', 'Categoria', 'Valor', 'Dia venc.', 'Ativa', ''].map((c, i) => <th key={i} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-4 py-3">{c}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--sys-surface-4)', opacity: d.ativo ? 1 : 0.5 }}>
                  <td className="px-4 py-3 font-semibold text-white">{d.descricao}</td>
                  <td className="px-4 py-3 text-gray-400">{d.categoria || '—'}</td>
                  <td className="px-4 py-3 text-[#fbbf24] font-bold">{brl(d.valor)}</td>
                  <td className="px-4 py-3 text-gray-400">{d.dia_vencimento ? `dia ${d.dia_vencimento}` : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleDespesaFixa(d.id, !d.ativo).then(load)} className="relative w-10 h-5 rounded-full transition-colors" style={{ background: d.ativo ? '#22c55e' : 'var(--sys-border-2)' }}>
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: d.ativo ? 'translateX(20px)' : 'translateX(0)' }} />
                    </button>
                  </td>
                  <td className="px-4 py-3"><button onClick={() => { if (confirm('Excluir esta despesa fixa?')) deleteDespesaFixa(d.id).then(load) }} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button></td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid var(--sys-border)' }}>
                <td colSpan={2} className="px-4 py-3 text-right text-gray-400 font-bold">Total mensal (ativas)</td>
                <td className="px-4 py-3 text-[#fbbf24] font-black">{brl(totalMensal)}</td><td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
