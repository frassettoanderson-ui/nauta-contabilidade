import { NextRequest, NextResponse } from 'next/server'
import { processar } from '@/lib/integracoes'

export const dynamic = 'force-dynamic'

// Fila de webhooks: o cron chama a cada minuto (reenvio de quem falhou) e o Obrigô chama logo
// depois de enfileirar um evento dele (empresa.cadastrada). Sem login: header x-cron-token = CRON_TOKEN.
export async function POST(req: NextRequest) {
  const esperado = process.env.CRON_TOKEN || ''
  if (!esperado || req.headers.get('x-cron-token') !== esperado) return NextResponse.json({ error: 'token' }, { status: 401 })
  return NextResponse.json({ ok: true, enviadas: await processar() })
}
