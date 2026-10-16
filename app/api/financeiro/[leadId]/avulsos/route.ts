import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { criarServicoAvulso, listServicosAvulsos, excluirServicoAvulso } from '@/lib/asaas'
import { enviarServicoAvulso } from '@/lib/cobranca-envio'

export const dynamic = 'force-dynamic'

// Serviços avulsos do cliente (ficha › Financeiro):
//  GET → lista | POST { servico, valor, vencimento, enviar } → cobra no Asaas (e envia) | DELETE ?id= → exclui (só não pago)
async function ok() { return !!(await getServerSession(authOptions)) }

export async function GET(_req: NextRequest, { params }: { params: { leadId: string } }) {
  if (!(await ok())) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listServicosAvulsos(params.leadId))
}

export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  if (!(await ok())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  try {
    const c = await criarServicoAvulso(params.leadId, String(b.servico ?? ''), Number(b.valor), String(b.vencimento ?? ''))
    const envio = b.enviar && c.id ? await enviarServicoAvulso(params.leadId, c.id).catch(e => ({ envios: [{ canal: 'envio', ok: false, erro: (e as Error).message }] })) : null
    return NextResponse.json({ ...c, envio })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { leadId: string } }) {
  if (!(await ok())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try { return NextResponse.json(await excluirServicoAvulso(params.leadId, req.nextUrl.searchParams.get('id') || '')) }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }) }
}
