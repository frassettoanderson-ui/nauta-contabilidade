import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deletarDocumento } from '@/lib/autentique'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

// Cancela o envio para assinatura: exclui o documento na Autentique e
// reseta o contrato para 'gerado' (volta a permitir reenvio).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId faltando' }, { status: 400 })

  try {
    // Pega o contrato mais recente do lead que esteja aguardando assinatura
    const r = await pool.query(
      `SELECT id, autentique_id, autentique_status FROM contratos
        WHERE lead_id = $1 ORDER BY criado_em DESC LIMIT 1`,
      [leadId]
    )
    const contrato = r.rows[0]
    if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    if (contrato.autentique_status === 'assinado') {
      return NextResponse.json({ error: 'Contrato já assinado — não é possível cancelar.' }, { status: 409 })
    }

    // Exclui na Autentique (se ainda houver id vinculado)
    if (contrato.autentique_id) {
      try {
        await deletarDocumento(contrato.autentique_id)
      } catch (e) {
        // Se já não existir na Autentique, segue o reset mesmo assim
        console.error('[CANCELAR] deleteDocument falhou:', e)
      }
    }

    // Reseta o contrato para permitir reenvio
    await pool.query(
      `UPDATE contratos SET autentique_id = NULL, autentique_status = NULL, autentique_url = NULL, status = 'gerado' WHERE id = $1`,
      [contrato.id]
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[CANCELAR]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao cancelar envio' }, { status: 500 })
  }
}
