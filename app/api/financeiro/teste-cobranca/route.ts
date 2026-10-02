import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { sincronizarLead } from '@/lib/asaas'
import { enviarCobranca } from '@/lib/cobranca-envio'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Utilitário server-to-server (protegido por x-cron-token = CRON_TOKEN):
// sincroniza o lead no Asaas (cria cliente + assinatura + cobrança) e envia a
// cobrança pelos canais da Nauta (WhatsApp + e-mail). Usado para testes manuais.
export async function POST(req: NextRequest) {
  const esperado = process.env.CRON_TOKEN || ''
  const recebido = req.headers.get('x-cron-token') || ''
  if (!esperado || recebido !== esperado) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { leadId } = await req.json().catch(() => ({}))
  if (!leadId) return NextResponse.json({ error: 'leadId ausente' }, { status: 400 })

  const sync = await sincronizarLead(String(leadId))
  const cob = (await pool.query(
    `SELECT id, asaas_payment_id, valor, to_char(vencimento,'YYYY-MM-DD') AS vencimento, status, invoice_url
       FROM financeiro_cobrancas WHERE lead_id = $1 ORDER BY criado_em DESC LIMIT 1`, [leadId]
  )).rows[0] ?? null

  let envio = null
  if (cob?.id) envio = await enviarCobranca(String(leadId), 'vencimento', cob.id)

  return NextResponse.json({ sync, cobranca: cob, envio })
}
