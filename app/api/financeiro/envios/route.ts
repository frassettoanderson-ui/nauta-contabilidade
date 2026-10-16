import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import pool from '@/lib/db'
import { enviarCobranca, listEnvios, resumoEnvios, whatsConfigurado, emailConfigurado, cobradosHoje, enviarCobrancaManual, cobrarTodos, statusCobrancaEmMassa, type TipoEnvio } from '@/lib/cobranca-envio'
import { listFinanceiro } from '@/lib/leads'
import { getOrCreatePixAuto, cancelarPixAuto, getPixAuto } from '@/lib/pix-automatico'

export const dynamic = 'force-dynamic'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session) return { err: NextResponse.json(null, { status: 401 }) }
  const empresaId = await empresaAtivaId()
  if (!empresaId) return { err: NextResponse.json(null, { status: 403 }) }
  return { empresaId }
}

// GET           → { whats, email, envios: {leadId: ultimo envio}, pixAuto: {leadId: status} }
// GET ?leadId=x → histórico de envios do lead
export async function GET(req: NextRequest) {
  const g = await guard(); if ('err' in g) return g.err
  const leadId = req.nextUrl.searchParams.get('leadId')
  if (leadId && req.nextUrl.searchParams.get('pixAuto') === '1') return NextResponse.json(await getPixAuto(leadId))
  if (leadId) return NextResponse.json(await listEnvios(leadId))
  const pa = await pool.query(
    `SELECT DISTINCT ON (lead_id) lead_id, status FROM financeiro_pix_automatico
      WHERE lead_id IN (SELECT id FROM leads WHERE empresa_id = $1) ORDER BY lead_id, criado_em DESC`, [g.empresaId!]
  )
  const pixAuto: Record<string, string> = {}
  for (const r of pa.rows) pixAuto[String(r.lead_id)] = String(r.status)
  return NextResponse.json({ whats: whatsConfigurado(), email: emailConfigurado(), envios: await resumoEnvios(g.empresaId!), pixAuto,
    cobradosHoje: await cobradosHoje(g.empresaId!), cobrancaEmMassa: statusCobrancaEmMassa() })
}

// POST { leadId, tipo }            → envia cobrança agora (WhatsApp + e-mail se configurado)
// POST { leadId, pixAuto: true }   → gera/retorna o QR do Pix Automático
// POST { leadId, cancelarPixAuto } → cancela a autorização
export async function POST(req: NextRequest) {
  const g = await guard(); if ('err' in g) return g.err
  const body = await req.json().catch(() => ({}))
  // POST { cobrarTodos: true, modelo } → envia o modelo p/ todos em atraso ainda não cobrados hoje (2º plano)
  if (body.cobrarTodos) {
    try {
      const ja = new Set(await cobradosHoje(g.empresaId!))
      const rows = await listFinanceiro(g.empresaId!) as Record<string, unknown>[]
      const ids = rows.filter(r => r.status_global === 'atrasado' && r.contabilidade !== 'nauta' && !ja.has(String(r.lead_id))).map(r => String(r.lead_id))
      if (!ids.length) return NextResponse.json({ iniciado: false, total: 0 })
      return NextResponse.json(await cobrarTodos(ids, Number(body.modelo)))
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }) }
  }
  const leadId = String(body.leadId || '')
  if (!leadId) return NextResponse.json({ error: 'leadId obrigatório' }, { status: 400 })
  try {
    if (body.cancelarPixAuto) return NextResponse.json(await cancelarPixAuto(leadId))
    if (body.pixAuto) return NextResponse.json(await getOrCreatePixAuto(leadId))
    // POST { leadId, modeloCobranca } → cobrança manual (1 dos 5 modelos, sem link; 1 por dia)
    if (body.modeloCobranca) return NextResponse.json(await enviarCobrancaManual(leadId, Number(body.modeloCobranca)))
    const tipo = (['lembrete', 'vencimento', 'atraso'].includes(body.tipo) ? body.tipo : 'atraso') as TipoEnvio
    return NextResponse.json(await enviarCobranca(leadId, tipo, body.cobrancaId ? String(body.cobrancaId) : undefined))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
