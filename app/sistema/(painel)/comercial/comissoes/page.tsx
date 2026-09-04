'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Percent, ChevronLeft, ChevronRight, Award, Repeat, Wallet, CalendarCheck, Target } from 'lucide-react'
import { getComissoes, type ComissoesData, type ComissaoTotais } from '@/lib/api'
import type { ReactNode } from 'react'

const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const dataBR = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
const compBR = (ym: string) => { const [y, m] = ym.split('-'); return `${m}/${y}` }
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const CARD = { background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }
const TH = 'text-[11px] uppercase tracking-wide text-gray-500 px-4 py-2.5 font-semibold'

// Card de estatística — texto sempre centralizado.
function Stat({ label, valor, sub, cor, icon: Icon }: { label: string; valor: string; sub?: ReactNode; cor?: string; icon: typeof Award }) {
  return (
    <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={CARD}>
      <Icon size={18} className="mb-1.5" style={{ color: cor || 'var(--sys-accent)' }} />
      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black mt-1.5" style={{ color: cor || '#fff', letterSpacing: '-0.02em' }}>{valor}</p>
      {sub && <div className="text-xs text-gray-500 mt-1.5 leading-snug">{sub}</div>}
    </div>
  )
}

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-black text-white uppercase tracking-wide mb-3 text-center">{children}</h2>
}

// Linha do quadro Esperado × Realizado
function Linha({ label, esp, real, destaque }: { label: string; esp: number; real: number; destaque?: boolean }) {
  const dif = real - esp
  return (
    <tr className="border-t" style={{ borderColor: 'var(--sys-border)' }}>
      <td className={`px-4 py-3 ${destaque ? 'text-white font-black' : 'text-gray-300 font-semibold'}`}>{label}</td>
      <td className="px-4 py-3 text-right tabular-nums text-gray-300">{brl(esp)}</td>
      <td className={`px-4 py-3 text-right tabular-nums font-black`} style={{ color: destaque ? 'var(--sys-accent)' : '#fff' }}>{brl(real)}</td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: dif < 0 ? '#f87171' : '#22c55e' }}>
        {dif < 0 ? '−' : '+'}{brl(Math.abs(dif))}
      </td>
      <td className="px-4 py-3 text-center tabular-nums text-gray-400">{esp > 0 ? `${Math.round(real / esp * 100)}%` : '—'}</td>
    </tr>
  )
}

export default function ComissoesPage() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1) // mês de apuração (pago em / vence em)
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

  const E: ComissaoTotais | undefined = d?.esperado
  const R: ComissaoTotais | undefined = d?.totais

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Percent size={22} className="text-[color:var(--sys-accent)]" /> Comissões do comercial
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          100% do 1º honorário de cada cliente + 10% de recorrência sobre os demais honorários pagos no mês (a recorrência começa no 2º honorário). O que é pago no mês é apurado e pago ao setor comercial no mês seguinte.
        </p>
      </div>

      {/* Seletor do mês de apuração */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button type="button" onClick={() => mudarMes(-1)} title="Mês anterior"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white" style={FS}>
          <ChevronLeft size={18} />
        </button>
        <div className="text-center w-64">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Mês de apuração</p>
          <p className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>{d?.label ?? '...'}</p>
          {d && <p className="text-xs text-gray-500">comissão paga em <b className="text-gray-300">{d.pagarEm}</b></p>}
        </div>
        <button type="button" onClick={() => mudarMes(1)} title="Próximo mês"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white" style={FS}>
          <ChevronRight size={18} />
        </button>
      </div>

      {erro ? (
        <div className="p-8 text-center text-gray-500">Não foi possível carregar as comissões.</div>
      ) : !d || !E || !R ? (
        <div className="flex justify-center py-24"><Loader2 size={26} className="animate-spin text-[color:var(--sys-accent)]" /></div>
      ) : (
        <>
          {/* Cards: expectativa × realizado */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Stat icon={Target} label="Comissão esperada" valor={brl(E.total)}
              sub={<>{E.qtd} vencimento(s) · {E.qtdPrimeiros} 1º honorário(s)</>} cor="#a78bfa" />
            <Stat icon={CalendarCheck} label={`Comissão realizada`} valor={brl(R.total)}
              sub={<>a pagar em <b className="text-gray-300">{d.pagarEm}</b></>} cor="var(--sys-accent)" />
            <Stat icon={Repeat} label="Recorrência (10%)" valor={brl(R.recorrencia)} sub={<>esperado {brl(E.recorrencia)}</>} />
            <Stat icon={Award} label="Primeiros honorários" valor={brl(R.primeiros)} sub={<>esperado {brl(E.primeiros)}</>} cor="#22c55e" />
          </div>

          {/* Quadro Esperado × Realizado */}
          <Titulo>Esperado × Realizado — {d.label}</Titulo>
          <div className="rounded-2xl overflow-hidden mb-6" style={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--sys-surface-2)' }}>
                    <th className={`${TH} text-left`}>Item</th>
                    <th className={`${TH} text-right`}>Esperado (vencimentos)</th>
                    <th className={`${TH} text-right`}>Realizado (pagos)</th>
                    <th className={`${TH} text-right`}>Diferença</th>
                    <th className={`${TH} text-center`}>Atingido</th>
                  </tr>
                </thead>
                <tbody>
                  <Linha label="Honorários" esp={E.honorarios} real={R.honorarios} />
                  <Linha label="Recorrência 10%" esp={E.recorrencia} real={R.recorrencia} />
                  <Linha label="Primeiros honorários (100%)" esp={E.primeiros} real={R.primeiros} />
                  <Linha label="Comissão total" esp={E.total} real={R.total} destaque />
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 text-center px-4 py-2.5" style={{ borderTop: '1px solid var(--sys-border)' }}>
              Esperado = honorários dos clientes ativos que vencem em {d.label}; o 1º honorário (cliente cujo primeiro vencimento cai neste mês) vale 100% e não gera os 10%. Realizado = pagamentos com data dentro do mês.
            </p>
          </div>

          {/* Detalhamento: realizado */}
          <Titulo>Pagamentos realizados em {d.label}</Titulo>
          <div className="rounded-2xl overflow-hidden mb-6" style={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--sys-surface-2)' }}>
                    <th className={`${TH} text-left`}>Cliente</th>
                    <th className={`${TH} text-center`}>Competência</th>
                    <th className={`${TH} text-center`}>Pago em</th>
                    <th className={`${TH} text-right`}>Honorário</th>
                    <th className={`${TH} text-center`}>Tipo</th>
                    <th className={`${TH} text-right`}>Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {d.itens.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum pagamento com data dentro deste mês.</td></tr>
                  ) : d.itens.map(it => (
                    <tr key={it.id} className="border-t" style={{ borderColor: 'var(--sys-border)' }}>
                      <td className="px-4 py-3">
                        <p className="text-white font-semibold">{it.empresa || it.cliente}</p>
                        {it.empresa && <p className="text-xs text-gray-500">{it.cliente}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 tabular-nums">{compBR(it.competencia)}</td>
                      <td className="px-4 py-3 text-center text-gray-400 tabular-nums">{dataBR(it.pago_em)}</td>
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{brl(it.valor)}</td>
                      <td className="px-4 py-3 text-center">
                        {it.primeiro ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e' }}>1º honorário (100%)</span>
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

          {/* Detalhamento: esperado */}
          <Titulo>Vencimentos esperados em {d.label}</Titulo>
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--sys-surface-2)' }}>
                    <th className={`${TH} text-left`}>Cliente</th>
                    <th className={`${TH} text-center`}>Vencimento</th>
                    <th className={`${TH} text-right`}>Honorário</th>
                    <th className={`${TH} text-center`}>Tipo</th>
                    <th className={`${TH} text-right`}>Comissão esperada</th>
                  </tr>
                </thead>
                <tbody>
                  {d.esperadoItens.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum vencimento previsto neste mês.</td></tr>
                  ) : d.esperadoItens.map(it => (
                    <tr key={it.lead_id} className="border-t" style={{ borderColor: 'var(--sys-border)' }}>
                      <td className="px-4 py-3">
                        <p className="text-white font-semibold">{it.empresa || it.cliente}</p>
                        {it.empresa && <p className="text-xs text-gray-500">{it.cliente}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 tabular-nums">{it.vencimento}</td>
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{brl(it.valor)}</td>
                      <td className="px-4 py-3 text-center">
                        {it.primeiro ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e' }}>1º honorário (100%)</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: 'rgba(148,163,184,0.12)', color: '#9ca3af' }}>recorrência 10%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-gray-200">{brl(it.primeiro ? it.valor : it.valor * 0.10)}</td>
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
