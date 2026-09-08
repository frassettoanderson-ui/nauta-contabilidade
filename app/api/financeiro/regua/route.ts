import { NextRequest, NextResponse } from 'next/server'
import { rodarRegua } from '@/lib/cobranca-envio'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Régua de cobrança (D-3 / D0 / D+3) — chamada pelo cron da VPS 1x por dia útil.
// Sem login: protegida por header x-cron-token = CRON_TOKEN. ?dry=1 só lista quem receberia.
export async function POST(req: NextRequest) {
  const esperado = process.env.CRON_TOKEN || ''
  const recebido = req.headers.get('x-cron-token') || req.nextUrl.searchParams.get('token') || ''
  if (!esperado || recebido !== esperado) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const dry = req.nextUrl.searchParams.get('dry') === '1'
  try {
    return NextResponse.json(await rodarRegua({ dryRun: dry }))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
