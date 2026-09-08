import { NextRequest, NextResponse } from 'next/server'
import { processarWebhook } from '@/lib/asaas'

export const dynamic = 'force-dynamic'

// Webhook do Asaas (PAYMENT_RECEIVED, PAYMENT_OVERDUE, ...). Sem login: protegido pelo
// token configurado no cadastro do webhook (header asaas-access-token = ASAAS_WEBHOOK_TOKEN).
export async function POST(req: NextRequest) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN || ''
  const recebido = req.headers.get('asaas-access-token') || ''
  if (!esperado || recebido !== esperado) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: { event?: string; payment?: never } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'json inválido' }, { status: 400 }) }
  try {
    const r = await processarWebhook(body)
    return NextResponse.json(r)
  } catch (e) {
    // 500 faz o Asaas reenviar depois (fila sequencial) — não perde o evento
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// O Asaas testa a URL com GET ao cadastrar
export async function GET() {
  return NextResponse.json({ ok: true, service: 'nauta-asaas-webhook' })
}
