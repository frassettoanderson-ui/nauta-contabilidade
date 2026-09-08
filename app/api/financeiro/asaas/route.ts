import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { asaasConfigurado, asaasAmbiente, sincronizarLead, sincronizarTodos, cancelarAssinatura, listCobrancasLead, resumoCobrancas } from '@/lib/asaas'

export const dynamic = 'force-dynamic'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session) return { err: NextResponse.json(null, { status: 401 }) }
  const empresaId = await empresaAtivaId()
  if (!empresaId) return { err: NextResponse.json(null, { status: 403 }) }
  return { empresaId }
}

// GET            → { configurado, ambiente, resumo: { [leadId]: {status, vencimento, invoice_url, ...} } }
// GET ?leadId=x  → cobranças do lead
export async function GET(req: NextRequest) {
  const g = await guard(); if ('err' in g) return g.err
  const leadId = req.nextUrl.searchParams.get('leadId')
  if (leadId) return NextResponse.json(await listCobrancasLead(leadId))
  return NextResponse.json({ configurado: asaasConfigurado(), ambiente: asaasAmbiente(), resumo: await resumoCobrancas(g.empresaId!) })
}

// POST { leadId }            → cria/atualiza cliente + assinatura e puxa cobranças
// POST { todos: true }       → o mesmo para todos os clientes ativos no financeiro
// POST { leadId, cancelar }  → remove a assinatura no Asaas
export async function POST(req: NextRequest) {
  const g = await guard(); if ('err' in g) return g.err
  if (!asaasConfigurado()) return NextResponse.json({ error: 'Asaas não configurado' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  try {
    if (body.todos) return NextResponse.json({ resultados: await sincronizarTodos(g.empresaId!) })
    if (!body.leadId) return NextResponse.json({ error: 'leadId obrigatório' }, { status: 400 })
    if (body.cancelar) return NextResponse.json(await cancelarAssinatura(String(body.leadId)))
    return NextResponse.json(await sincronizarLead(String(body.leadId)))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
