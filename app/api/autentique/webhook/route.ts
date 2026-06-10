import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { consultarDocumento } from '@/lib/autentique'
import { emitCrmChange } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text()
    console.log('[WEBHOOK AUTENTIQUE] payload:', raw.slice(0, 800))
    let body: Record<string, unknown> = {}
    try { body = JSON.parse(raw) } catch {}

    // Tenta extrair o id do documento em vários formatos possíveis do payload
    const documentId: string | undefined =
      (body?.document as { id?: string })?.id ||
      (body?.id as string) ||
      ((body?.partes as { document?: { id?: string } })?.document?.id) ||
      (body?.uuid as string)

    console.log('[WEBHOOK AUTENTIQUE] documentId extraído:', documentId)
    if (!documentId) return NextResponse.json({ ok: true })

    // Consulta o status atual no Autentique
    const doc = await consultarDocumento(documentId) as { signatures?: { signed?: unknown }[]; files?: { signed?: string } }
    const allSigned = doc.signatures?.every((s: { signed?: unknown }) => !!s.signed)
    const signedUrl: string | null = doc.files?.signed || null
    console.log('[WEBHOOK AUTENTIQUE] allSigned:', allSigned, 'url:', signedUrl)

    if (allSigned) {
      const r = await pool.query(
        `UPDATE contratos SET autentique_status = 'assinado', autentique_url = $1, status = 'assinado' WHERE autentique_id = $2`,
        [signedUrl, documentId]
      )
      console.log('[WEBHOOK AUTENTIQUE] linhas atualizadas:', r.rowCount)
      emitCrmChange()
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[WEBHOOK AUTENTIQUE]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
