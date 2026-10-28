import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'
import { refazerContrato } from '@/lib/contrato-envio'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

// Refazer contrato: cancela o envio atual, gera um contrato novo e envia para assinatura.
// { leadId, obs? } — obs entra nas observações da negociação (aparece no contrato).
// Login de admin/gerente, ou x-cron-token (uso interno/suporte).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  const interno = !!process.env.CRON_TOKEN && req.headers.get('x-cron-token') === process.env.CRON_TOKEN
  if (!interno && (!session || (role !== 'admin' && role !== 'gerente'))) return NextResponse.json({ error: 'Apenas admin/gerente' }, { status: 403 })
  const { leadId, obs } = await req.json().catch(() => ({}))
  if (!leadId) return NextResponse.json({ error: 'leadId faltando' }, { status: 400 })
  try {
    if (obs && String(obs).trim()) {
      await pool.query(
        `UPDATE leads SET negociacao_obs = CASE WHEN COALESCE(TRIM(negociacao_obs), '') = '' THEN $2 ELSE negociacao_obs || E'
' || $2 END WHERE id = $1`,
        [leadId, String(obs).trim()],
      )
    }
    return NextResponse.json(await refazerContrato(leadId))
  } catch (e) {
    console.error('[REFAZER]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao refazer contrato' }, { status: 500 })
  }
}
