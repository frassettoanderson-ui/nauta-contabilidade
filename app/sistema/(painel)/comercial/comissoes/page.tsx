'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Percent, ChevronLeft, ChevronRight, Award, Repeat, Wallet, CalendarCheck } from 'lucide-react'
import { getComissoes, type ComissoesData } from '@/lib/api'
import type { ReactNode } from 'react'

const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const dataBR = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
const compBR = (ym: string) => { const [y, m] = ym.split('-'); return `${m}/${y}` }
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }

// Card de estatística — texto sempre centralizado.
function Stat({ label, valor, sub, cor, icon: Icon }: { label: string; valor: string; sub?: ReactNode; cor?: string; icon: typeof Award }) {
  return (
    <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
      <Icon size={18} className="mb-1.5" style={{ color: cor || 'var(--sys-accent)' }} />
      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black mt-1.5" style={{ color: cor || '#fff', letterSpacing: '-0.02em' }}>{valor}</p>
      {sub && <div className="text-xs text-gray-500 mt-1.5 leading-snug">{sub}</div>}
    </div>
  )
}

export default function ComissoesPage() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1) // mês de apuração (pago em)
  const [d, setD] = useState<ComissoesData | null>(null)
  const [erro, setErro] = useState(false)

  const load = useCallback(() => {
    setD(null); setErro(false)
    getComissoes(ano, mes).then(setD).catch(() => setErro(true))
  }, [ano, mes])
  useEffect(() => { load() }, [load])

  const mudarMes = (delta: number) => {
    const n = new Date(ano, mes - 1 + delta, 1)
    setAno(n.getFullYear()); setMes(n.getMonth() + 1)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Percent size={22} className="text-[color:var(--sys-accent)]" /> Comissões do comercial
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          10% de recorrência sobre todos os honorários pagos no mês + 100% do 1º honorário de cada cliente. O que é pago no mês é apurado e pago ao comercial no mês seguinte.
        </p>
      </div>

      {/* Seletor do mês de apuração */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button type="button" onClick={() => mudarMes(-1)} title="Mês anterior"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white" style={FS}>
          <ChevronLeft size={18} />
        </button>
        <div className="text-center w-64">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Honorários pagos em</p>
          <p className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>{d?.label ?? '...'}</p>
        </div>
        <button type="button" onClick={() => mudarMes(1)} title="Próximo mês"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white" style={FS}>
          <ChevronRight size={18} />
        </button>
      </div>

      {erro ? (
        <div className="p-8 text-center text-gray-500">Não foi possível carregar as comissões.</div>
      ) : !d ? (
        <div className="flex justify-center py-24"><Loader2 size={26} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Stat icon={Wallet} label="Honorários pagos" valor={brl(d.totais.honorarios)} sub={`${d.totais.qtd} pagamento(s)`} />
            <Stat icon={Repeat} label="Recorrência (10%)" valor={brl(d.totais.recorrencia)} sub="sobre tudo que foi pago" />
            <Stat icon={Award} label="Primeiros honorários" valor={brl(d.totais.primeiros)} sub={`${d.totais.qtdPrimeiros} cliente(s) novo(s)`} cor="#22c55e" />
            <Stat icon={CalendarCheck} label={`A pagar em ${d.pagarEm}`} valor={brl(d.totais.total)} sub="recorrência + primeiros" cor="var(--sys-accent)" />
          </div>

          {/* Por vendedor */}
          <h2 className="text-sm font-black text-white uppercase tracking-wide mb-3 text-center">Por vendedor</h2>
          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-500" style={{ background: 'var(--sys-surface-2)' }}>
                    <th className="text-left px-4 py-2.5 font-semibold">Vendedor</th>
                    <th className="text-center px-4 py-2.5 font-semibold">Pagamentos</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Honorários</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Recorrência 10%</th>
                    <th className="text-right px-4 py-2.5 font-semibold">1º honorários</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {d.porVendedor.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum honorário pago neste mês.</td></tr>
                  ) : d.porVendedor.map(v => (
                    <tr key={v.vendedor} className="border-t" style={{ borderColor: 'var(--sys-border)' }}>
                      <td className="px-4 py-3 text-white font-semibold">{v.vendedor}</td>
                      <td className="px-4 py-3 text-center text-gray-300 tabular-nums">{v.qtd}</td>
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{brl(v.honorarios)}</td>
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{brl(v.recorrencia)}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#22c55e' }}>{brl(v.primeiros)}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums" style={{ color: 'var(--sys-accent)' }}>{brl(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalhamento */}
          <h2 className="text-sm font-black text-white uppercase tracking-wide mb-3 text-center">Detalhamento dos pagamentos</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-500" style={{ background: 'var(--sys-surface-2)' }}>
                    <th className="text-left px-4 py-2.5 font-semibold">Cliente</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Vendedor</th>
                    <th className="text-center px-4 py-2.5 font-semibold">Competência</th>
                    <th className="text-center px-4 py-2.5 font-semibold">Pago em</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Honorário</th>
                    <th className="text-center px-4 py-2.5 font-semibold">Tipo</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {d.itens.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhum pagamento com data dentro deste mês.</td></tr>
                  ) : d.itens.map(it => (
                    <tr key={it.id} className="border-t" style={{ borderColor: 'var(--sys-border)' }}>
                      <td className="px-4 py-3">
                        <p className="text-white font-semibold">{it.empresa || it.cliente}</p>
                        {it.empresa && <p className="text-xs text-gray-500">{it.cliente}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{it.vendedor}</td>
                      <td className="px-4 py-3 text-center text-gray-400 tabular-nums">{compBR(it.competencia)}</td>
                      <td className="px-4 py-3 text-center text-gray-400 tabular-nums">{dataBR(it.pago_em)}</td>
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{brl(it.valor)}</td>
                      <td className="px-4 py-3 text-center">
                        {it.primeiro ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e' }}>1º honorário + 10%</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: 'rgba(148,163,184,0.12)', color: '#9ca3af' }}>recorrência 10%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-black tabular-nums" style={{ color: 'var(--sys-accent)' }}>{brl(it.comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
