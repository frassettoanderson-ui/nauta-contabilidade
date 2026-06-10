import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { consultarDocumento } from '@/lib/autentique'
import { emitCrmChange } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const documentId: string = body?.document?.id || body?.id
    if (!documentId) return NextResponse.json({ ok: true })

    // Consulta o status atual no Autentique
    const doc = await consultarDocumento(documentId)
    const allSigned = doc.signatures?.every((s: { signed?: unknown }) => !!s.signed)
    const signedUrl: string | null = doc.files?.signed || null

    if (allSigned) {
      await pool.query(
        `UPDATE contratos SET autentique_status = 'assinado', autentique_url = $1, status = 'assinado' WHERE autentique_id = $2`,
        [signedUrl, documentId]
      )
      emitCrmChange()
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[WEBHOOK AUTENTIQUE]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
