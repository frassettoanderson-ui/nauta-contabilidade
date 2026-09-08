'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Receipt, Plus, Trash2, Check, RotateCcw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { listContasPagar, addContaPagar, pagarContaPagar, desmarcarContaPagar, deleteContaPagar, type ContaPagarRow } from '@/lib/api'

const brl = (v: unknown) => { const n = Number(v); return isNaN(n) ? 'R$ 0,00' : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
const dataBR = (v: string | null) => v ? format(new Date(v + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '—'
const hoje = () => new Date().toISOString().slice(0, 10)
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const FIELD = 'w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none'

function Card({ label, valor, sub, cor, icon: Icon }: { label: string; valor: string; sub?: string; cor?: string; icon: typeof Receipt }) {
  return (
    <div className="flex-1 min-w-[190px] rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
      <Icon size={20} className="mb-1.5" style={{ color: cor || 'var(--sys-accent)' }} />
      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black mt-1.5" style={{ color: cor || '#fff', letterSpacing: '-0.02em' }}>{valor}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function ContasAPagarPage() {
  const [contas, setContas] = useState<ContaPagarRow[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  // form
  const [descricao, setDescricao] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => { listContasPagar().then(setContas).catch(() => setContas([])) }, [])
  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!descricao.trim()) { alert('Informe a descrição.'); return }
    if (!Number(valor)) { alert('Informe o valor.'); return }
    setSaving(true)
    try {
      await addContaPagar({ descricao: descricao.trim(), fornecedor: fornecedor.trim(), categoria: categoria.trim(), valor: Number(valor), vencimento: vencimento || null })
      setDescricao(''); setFornecedor(''); setCategoria(''); setValor(''); setVencimento(''); load()
    } catch (e) { alert('Erro: ' + ((e as Error).message || '')) } finally { setSaving(false) }
  }
  async function pagar(id: string) {
    const d = prompt('Data do pagamento (AAAA-MM-DD):', hoje()); if (!d) return
    setBusy(id); try { await pagarContaPagar(id, d); load() } catch (e) { alert('Erro: ' + ((e as Error).message || '')) } finally { setBusy(null) }
  }
  async function desmarcar(id: string) {
    if (!confirm('Desfazer o pagamento? A despesa gerada será removida do fluxo de caixa.')) return
    setBusy(id); try { await desmarcarContaPagar(id); load() } catch { alert('Erro.') } finally { setBusy(null) }
  }
  async function excluir(id: string) {
    if (!confirm('Excluir esta conta?')) return
    setBusy(id); try { await deleteContaPagar(id); load() } catch { alert('Erro.') } finally { setBusy(null) }
  }

  const base = contas ?? []
  const abertas = base.filter(c => !c.pago)
  const hojeStr = hoje()
  const vencidas = abertas.filter(c => c.vencimento && c.vencimento < hojeStr)
  const totalAberto = abertas.reduce((s, c) => s + c.valor, 0)
  const totalVencido = vencidas.reduce((s, c) => s + c.valor, 0)

  const linhaCor = (c: ContaPagarRow) => c.pago ? '#22c55e' : (c.vencimento && c.vencimento < hojeStr ? '#f87171' : c.vencimento === hojeStr ? '#fbbf24' : '#9ca3af')
  const situacao = (c: ContaPagarRow) => c.pago ? 'Paga' : (c.vencimento && c.vencimento < hojeStr ? 'Vencida' : c.vencimento === hojeStr ? 'Vence hoje' : 'A vencer')

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}><Receipt size={22} className="text-[color:var(--sys-accent)]" /> Contas a pagar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Boletos de fornecedores e contas com vencimento. Ao marcar como paga, vira despesa no fluxo de caixa.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Card icon={Clock} label="A pagar (em aberto)" valor={brl(totalAberto)} sub={`${abertas.length} conta(s)`} />
        <Card icon={AlertTriangle} label="Vencidas" valor={brl(totalVencido)} cor={totalVencido > 0 ? '#f87171' : '#22c55e'} sub={`${vencidas.length} conta(s)`} />
        <Card icon={CheckCircle2} label="Pagas" valor={String(base.filter(c => c.pago).length)} cor="#22c55e" sub="registradas" />
      </div>

      {/* Nova conta */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Nova conta a pagar</p>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="col-span-2 lg:col-span-2">
            <label className="block text-[11px] text-gray-500 mb-0.5">Descrição *</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Energia, Internet, Boleto fornecedor" className={FIELD} style={FS} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">Fornecedor</label>
            <input value={fornecedor} onChange={e => setFornecedor(e.target.value)} className={FIELD} style={FS} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">Categoria</label>
            <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex.: Infra" className={FIELD} style={FS} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">Valor *</label>
            <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className={FIELD} style={FS} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">Vencimento</label>
            <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className={FIELD} style={{ ...FS, colorScheme: 'dark' }} />
          </div>
        </div>
        <button onClick={salvar} disabled={saving}
          className="mt-3 inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Adicionar conta
        </button>
      </div>

      {contas === null ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : base.length === 0 ? (
        <div className="text-center py-16 text-gray-600"><Receipt size={32} className="mx-auto mb-3 opacity-40" /><p className="text-sm">Nenhuma conta cadastrada.</p></div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--sys-border)', background: 'var(--sys-surface)' }}>
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-500" style={{ background: 'var(--sys-surface-2)' }}>
                <th className="text-left px-4 py-2.5 font-semibold">Descrição</th>
                <th className="text-left px-4 py-2.5 font-semibold">Fornecedor</th>
                <th className="text-left px-4 py-2.5 font-semibold">Categoria</th>
                <th className="text-center px-4 py-2.5 font-semibold">Vencimento</th>
                <th className="text-right px-4 py-2.5 font-semibold">Valor</th>
                <th className="text-center px-4 py-2.5 font-semibold">Situação</th>
                <th className="text-center px-4 py-2.5 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {base.map(c => (
                <tr key={c.id} className="border-t" style={{ borderColor: 'var(--sys-border)', opacity: c.pago ? 0.7 : 1 }}>
                  <td className="px-4 py-3 font-semibold text-white">{c.descricao}</td>
                  <td className="px-4 py-3 text-gray-300">{c.fornecedor || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{c.categoria || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-300 tabular-nums">{dataBR(c.vencimento)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-white">{brl(c.valor)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: `${linhaCor(c)}22`, color: linhaCor(c) }}>
                      {situacao(c)}{c.pago && c.pago_em ? ` ${dataBR(c.pago_em).slice(0, 5)}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {c.pago ? (
                        <button onClick={() => desmarcar(c.id)} disabled={busy === c.id} title="Desfazer pagamento"
                          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold text-gray-200 disabled:opacity-50" style={FS}>
                          {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Desfazer
                        </button>
                      ) : (
                        <button onClick={() => pagar(c.id)} disabled={busy === c.id} title="Marcar como paga"
                          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                          {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Pagar
                        </button>
                      )}
                      <button onClick={() => excluir(c.id)} disabled={busy === c.id} title="Excluir"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
