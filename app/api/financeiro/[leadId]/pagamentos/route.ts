import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'
import { listPagamentos, addPagamento, deletePagamento } from '@/lib/leads'
import { quitarNoAsaas, desfazerQuitacaoAsaas } from '@/lib/asaas'
import { empresaAtivaId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { leadId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listPagamentos(params.leadId))
}

// Baixa manual → também avisa o Asaas (cobrança da competência marcada como recebida), senão ele segue cobrando.
export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { competencia, valor, pago_em } = await req.json()
  if (!competencia) return NextResponse.json({ error: 'competência faltando' }, { status: 400 })
  const p = await addPagamento(params.leadId, competencia, valor ?? null, pago_em ?? null, await empresaAtivaId())
  const asaas = await quitarNoAsaas(params.leadId, String(competencia), valor ?? null, pago_em ?? null).catch(e => [{ asaasPaymentId: '', ok: false, erro: (e as Error).message }])
  return NextResponse.json({ ...p, asaas })
}

export async function DELETE(req: NextRequest, { params }: { params: { leadId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id faltando' }, { status: 400 })
  const pg = (await pool.query(`SELECT to_char(competencia,'YYYY-MM') AS c FROM financeiro_pagamentos WHERE id = $1`, [id])).rows[0]
  await deletePagamento(id)
  // Se não sobrou pagamento nessa competência, reabre a cobrança no Asaas (desfaz o "recebido em dinheiro")
  if (pg?.c) {
    const resta = await pool.query(`SELECT 1 FROM financeiro_pagamentos WHERE lead_id = $1 AND to_char(competencia,'YYYY-MM') = $2 LIMIT 1`, [params.leadId, pg.c])
    if (!resta.rows[0]) await desfazerQuitacaoAsaas(params.leadId, pg.c).catch(() => [])
  }
  return NextResponse.json({ ok: true })
}
