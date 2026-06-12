'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { getDashboard, type DashboardData } from '@/lib/api'

const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

function melhor(serie: number[], meses: string[]) {
  if (!serie?.length) return null
  let idx = 0
  serie.forEach((v, i) => { if (v > serie[idx]) idx = i })
  return { valor: serie[idx], mes: meses[idx] }
}

// Gráfico de área (comparativo mensal)
function AreaChart({ data, color }: { data: number[]; color: string }) {
  const W = 320, H = 90, P = 4
  const n = data.length
  if (n < 2) return <div className="h-[90px]" />
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const span = max - min || 1
  const x = (i: number) => P + (i / (n - 1)) * (W - P * 2)
  const y = (v: number) => H - P - ((v - min) / span) * (H - P * 2)
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`
  const gid = `g-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 90 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => i === n - 1 && <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#fff" />)}
    </svg>
  )
}

function Card({ titulo, valor, sub, serie, meses, icon: Icon, from, to }: {
  titulo: string; valor: string; sub?: string; serie: number[]; meses: string[]
  icon: typeof TrendingUp; from: string; to: string
}) {
  return (
    <div className="rounded-2xl p-5 overflow-hidden flex flex-col" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/85 text-sm font-semibold">{titulo}</p>
          <p className="text-3xl font-black text-white mt-1" style={{ letterSpacing: '-0.02em' }}>{valor}</p>
          {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
        </div>
        <Icon size={34} className="text-white/40 shrink-0" />
      </div>
      <div className="mt-3 -mx-1">
        <AreaChart data={serie} color={from} />
        <div className="flex justify-between px-1 text-[9px] text-white/50 -mt-1">
          {meses.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [d, setD] = useState<DashboardData | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => { getDashboard().then(setD).catch(() => setErro(true)) }, [])

  if (erro) return <div className="p-8 text-gray-500">Não foi possível carregar a dashboard.</div>
  if (!d) return <div className="flex justify-center py-24"><Loader2 size={26} className="animate-spin text-[#0BBCD4]" /></div>

  const mRecebido = melhor(d.recebidoSerie, d.meses)
  const mReceber = melhor(d.aReceberSerie, d.meses)
  const mVencidos = melhor(d.vencidosSerie, d.meses)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Visão geral financeira do escritório</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card titulo="Resultado do mês" valor={brl(d.resultadoMes)}
          sub={mRecebido ? `Melhor mês: ${mRecebido.mes} · ${brl(mRecebido.valor)}` : undefined}
          serie={d.recebidoSerie} meses={d.meses} icon={TrendingUp} from="#1e3a8a" to="#2563eb" />

        <Card titulo="A receber (a vencer)" valor={brl(d.aReceberMes)}
          sub={mReceber ? `Pico: ${mReceber.mes} · ${brl(mReceber.valor)}` : undefined}
          serie={d.aReceberSerie} meses={d.meses} icon={Clock} from="#065f46" to="#10b981" />

        <Card titulo="Clientes vencidos" valor={String(d.vencidosCount)}
          sub={mVencidos ? `Pico: ${mVencidos.mes} · ${mVencidos.valor} cliente(s)` : undefined}
          serie={d.vencidosSerie} meses={d.meses} icon={AlertTriangle} from="#6d28d9" to="#db2777" />
      </div>
    </div>
  )
}
