import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

// Histórico financeiro de um cliente (por lead do ERP), mês a mês:
// vencimento/valor/status + a linha do tempo de cada competência (envios, pagamento).
// Usado pela seção "Financeiro" da ficha do Obrigô (chama este endpoint da Nauta por nautaLeadId).
const PAGO = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'])

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const leadId = req.nextUrl.searchParams.get('lead') || ''
  if (!leadId) return NextResponse.json({ error: 'lead ausente' }, { status: 400 })

  const cobr = (await pool.query(
    `SELECT id, to_char(competencia,'YYYY-MM') AS comp, to_char(vencimento,'YYYY-MM-DD') AS venc,
            valor, status, to_char(pago_em,'YYYY-MM-DD"T"HH24:MI:SS') AS pago_em, invoice_url
       FROM financeiro_cobrancas WHERE lead_id = $1 ORDER BY vencimento DESC`, [leadId]
  )).rows

  const envs = (await pool.query(
    `SELECT cobranca_id, tipo, canal, ok, to_char(criado_em,'YYYY-MM-DD"T"HH24:MI:SS') AS em
       FROM cobranca_envios WHERE lead_id = $1 ORDER BY criado_em ASC`, [leadId]
  )).rows
  const envByCob: Record<string, { tipo: string; canal: string; ok: boolean; em: string }[]> = {}
  for (const e of envs) (envByCob[e.cobranca_id] ??= []).push({ tipo: e.tipo, canal: e.canal, ok: e.ok, em: e.em })

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const meses = cobr.map((c) => {
    const pago = PAGO.has(c.status) || !!c.pago_em
    let status: string
    if (pago && c.pago_em) {
      const pd = new Date(c.pago_em.slice(0, 10)); const vd = new Date(c.venc)
      status = pd < vd ? 'pago_antes' : pd > vd ? 'pago_depois' : 'pago_dia'
    } else if (pago) {
      status = 'pago_dia'
    } else {
      status = new Date(c.venc) < hoje ? 'vencido' : 'a_vencer'
    }
    return {
      competencia: c.comp, vencimento: c.venc, valor: Number(c.valor), status,
      pagoEm: c.pago_em, invoiceUrl: c.invoice_url,
      envios: envByCob[c.id] ?? [],
    }
  })

  return NextResponse.json({ meses })
}
