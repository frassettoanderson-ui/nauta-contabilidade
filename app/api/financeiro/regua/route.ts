import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { rodarRegua, alvosDisponivel, dispararDisponiveis, statusDisparo } from '@/lib/cobranca-envio'
import { sincronizarTodos } from '@/lib/asaas'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Régua de cobrança (D-3 / D0 / D+3) — chamada pelo cron da VPS 1x por dia (seg–sáb).
// Sem login: protegida por header x-cron-token = CRON_TOKEN. ?dry=1 só lista quem receberia.
// ?acao=sincronizar           → cria/atualiza cliente + assinatura no Asaas p/ toda a carteira ativa
// ?acao=disponivel&ate=AAAA-MM-DD[&dry=1] → avisa "fatura disponível" (1x por cobrança), em segundo plano
// ?acao=status                → andamento do disparo em segundo plano
export async function POST(req: NextRequest) {
  const esperado = process.env.CRON_TOKEN || ''
  const recebido = req.headers.get('x-cron-token') || req.nextUrl.searchParams.get('token') || ''
  if (!esperado || recebido !== esperado) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const dry = sp.get('dry') === '1'
  const acao = sp.get('acao') || 'regua'
  try {
    if (acao === 'status') return NextResponse.json({ disparo: statusDisparo() })
    if (acao === 'sincronizar') {
      const emp = await pool.query(`SELECT DISTINCT empresa_id FROM leads WHERE financeiro_ativo = true AND valor_honorario > 0 AND empresa_id IS NOT NULL`)
      const resultados = []
      for (const e of emp.rows) resultados.push(...await sincronizarTodos(String(e.empresa_id)))
      return NextResponse.json({ total: resultados.length, erros: resultados.filter(r => !r.ok), resultados })
    }
    if (acao === 'disponivel') {
      const ate = sp.get('ate') || ''
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ate)) return NextResponse.json({ error: 'ate=AAAA-MM-DD obrigatório' }, { status: 400 })
      if (dry) { const a = await alvosDisponivel(ate); return NextResponse.json({ total: a.length, alvos: a }) }
      return NextResponse.json(await dispararDisponiveis(ate))
    }
    return NextResponse.json(await rodarRegua({ dryRun: dry }))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
