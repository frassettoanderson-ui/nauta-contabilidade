'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Plus, Trash2, ArrowUpCircle } from 'lucide-react'
import { listLancamentos, addLancamento, deleteLancamento, type Lancamento } from '@/lib/api'

const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const FIELD = 'w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none'
const brl = (v: unknown) => { const n = Number(v); return isNaN(n) ? '—' : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
const hoje = () => new Date().toISOString().slice(0, 10)

export default function LancarDespesaPage() {
  const [lancs, setLancs] = useState<Lancamento[] | null>(null)
  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hoje())
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => { listLancamentos('despesa').then(setLancs).catch(() => setLancs([])) }, [])
  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!valor) { alert('Informe o valor.'); return }
    if (!descricao.trim()) { alert('Informe a descrição.'); return }
    setSaving(true)
    try {
      await addLancamento({ tipo: 'despesa', categoria, descricao, valor: Number(valor), data })
      setCategoria(''); setDescricao(''); setValor(''); setData(hoje())
      load()
    } catch { alert('Erro ao lançar.') }
    finally { setSaving(false) }
  }

  const total = (lancs ?? []).reduce((s, l) => s + Number(l.valor || 0), 0)

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
        <ArrowUpCircle size={22} className="text-[#f87171]" /> Lançar despesa
      </h1>
      <p className="text-gray-500 text-sm mb-6">Despesas avulsas do escritório.</p>

      <div className="rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Categoria</label>
          <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex.: Material, Software..." className={FIELD} style={FS} />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Descrição</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes" className={FIELD} style={FS} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Valor (R$)</label>
          <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className={FIELD} style={FS} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
        </div>
        <div className="flex items-end lg:col-start-4">
          <button onClick={salvar} disabled={saving} className="w-full h-10 rounded-lg text-sm font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Lançar</>}
          </button>
        </div>
      </div>

      {lancs === null ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#0BBCD4]" /></div>
      ) : lancs.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">Nenhuma despesa lançada.</p>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <table className="w-full text-sm whitespace-nowrap">
            <thead><tr style={{ borderBottom: '1px solid var(--sys-border)' }}>
              {['Data', 'Categoria', 'Descrição', 'Valor', ''].map((c, i) => <th key={i} className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 px-4 py-3">{c}</th>)}
            </tr></thead>
            <tbody>
              {lancs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--sys-surface-4)' }}>
                  <td className="px-4 py-3 text-gray-400">{l.data ? format(new Date(l.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</td>
                  <td className="px-4 py-3 text-gray-200">{l.categoria || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{l.descricao || '—'}</td>
                  <td className="px-4 py-3 text-[#f87171] font-bold">{brl(l.valor)}</td>
                  <td className="px-4 py-3"><button onClick={() => { if (confirm('Excluir esta despesa?')) deleteLancamento(l.id).then(load) }} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button></td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid var(--sys-border)' }}>
                <td colSpan={3} className="px-4 py-3 text-right text-gray-400 font-bold">Total</td>
                <td className="px-4 py-3 text-[#f87171] font-black">{brl(total)}</td><td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
