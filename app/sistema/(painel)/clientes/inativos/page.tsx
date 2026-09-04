'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserX, RotateCcw, Eye } from 'lucide-react'
import { listClientes, setSituacaoCliente } from '@/lib/api'
import { useRealtime } from '@/components/sistema/useRealtime'

type Row = Record<string, unknown>

const fmtData = (v: unknown) => {
  if (!v) return '—'
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}
const mesLabel = (v: unknown) => {
  if (!v) return '—'
  const d = new Date(String(v))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')
}

export default function ClientesInativosPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    listClientes()
      .then(all => setRows(all.filter(c => c.situacao === 'inativo')))
      .catch(() => setRows([]))
  }, [])
  useEffect(() => { load() }, [load])
  useRealtime(() => load())

  async function reativar(id: string, nome: string) {
    if (!confirm(`Reativar o cliente "${nome}"?\n\nEle volta para os clientes ativos e para o faturamento.`)) return
    setBusy(id)
    try { await setSituacaoCliente(id, 'ativo'); load() }
    catch { alert('Erro ao reativar.') }
    finally { setBusy(null) }
  }

  // Agrupa por mês do cancelamento (a métrica "CNPJs perdidos" do painel é mensal)
  const porMes = new Map<string, Row[]>()
  for (const r of rows ?? []) {
    const k = mesLabel(r.inativado_em)
    porMes.set(k, [...(porMes.get(k) ?? []), r])
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <UserX size={22} className="text-[color:var(--sys-accent)]" /> Clientes inativos
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Contratos cancelados. Cada cliente aqui conta como CNPJ perdido no mês do cancelamento.</p>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-gray-500 text-sm" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          Nenhum cliente inativo. Para cancelar um contrato, abra o cadastro do cliente e clique em <b className="text-gray-300">Cancelar contrato</b>.
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(porMes.entries()).map(([mes, lista]) => (
            <div key={mes}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2 text-center">
                {mes} · {lista.length} cliente(s)
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-gray-500" style={{ background: 'var(--sys-surface-2)' }}>
                        <th className="text-left px-4 py-2.5 font-semibold">Empresa</th>
                        <th className="text-left px-4 py-2.5 font-semibold">CNPJ</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Responsável</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Cancelado em</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(c => {
                        const id = String(c.id)
                        const nome = String(c.emp_nome || c.responsavel || '—')
                        return (
                          <tr key={id} className="border-t" style={{ borderColor: 'var(--sys-border)' }}>
                            <td className="px-4 py-3 text-white font-semibold">{nome}</td>
                            <td className="px-4 py-3 text-gray-300 tabular-nums">{String(c.emp_cnpj || '—')}</td>
                            <td className="px-4 py-3 text-gray-300">{String(c.responsavel || '—')}</td>
                            <td className="px-4 py-3 text-gray-300 text-center tabular-nums">{fmtData(c.inativado_em)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => router.push(`/sistema/clientes/cadastrar?cliente=${id}`)}
                                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-gray-200"
                                  style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
                                  <Eye size={14} /> Ver cadastro
                                </button>
                                <button onClick={() => reativar(id, nome)} disabled={busy === id}
                                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold text-white disabled:opacity-60"
                                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                                  {busy === id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Reativar
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
