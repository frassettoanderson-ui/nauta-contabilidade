'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Inbox, LayoutGrid, Users, TrendingUp, ArrowRight, type LucideIcon } from 'lucide-react'
import { getLeads, type LeadRow } from '@/lib/api'

function StatCard({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string; href?: string }) {
  const inner = (
    <div className="rounded-2xl p-5 h-full transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(11,188,212,0.12)' }}>
          <Icon size={18} className="text-[#0BBCD4]" />
        </div>
        {href && <ArrowRight size={15} className="text-gray-600" />}
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null)

  useEffect(() => { getLeads().then(setLeads).catch(() => setLeads([])) }, [])

  const total = leads?.length ?? 0
  const hoje = leads?.filter(l => new Date(l.criado_em).toDateString() === new Date().toDateString()).length ?? 0

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Visão geral do escritório</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Inbox}      label="Leads recebidos"   value={leads === null ? '—' : String(total)} href="/sistema/comercial/leads" />
        <StatCard icon={TrendingUp} label="Leads hoje"        value={leads === null ? '—' : String(hoje)} />
        <StatCard icon={LayoutGrid} label="Funil comercial"   value="Kanban" href="/sistema/comercial/kanban" />
        <StatCard icon={Users}      label="Usuários do sistema" value="Gerenciar" href="/sistema/usuarios" />
      </div>

      <div className="mt-8 rounded-2xl p-6" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        <h2 className="text-white font-bold mb-1">Bem-vindo ao Sistema Nauta 👋</h2>
        <p className="text-gray-500 text-sm">
          Este é o painel de gestão do escritório. Comece pelo módulo <Link href="/sistema/comercial/leads" className="text-[#0BBCD4] hover:underline">Comercial</Link> para acompanhar os leads que chegam pelo site.
        </p>
      </div>
    </div>
  )
}
