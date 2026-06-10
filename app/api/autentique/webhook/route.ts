import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { emitCrmChange } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

interface AutentiqueWebhook {
  event?: {
    type?: string
    data?: {
      id?: string
      files?: { signed?: string }
      signed_count?: number
      signatures_count?: number
      signatures?: { signed?: string | null }[]
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text()
    let body: AutentiqueWebhook = {}
    try { body = JSON.parse(raw) } catch {}

    // O payload do Autentique traz o documento em event.data
    const data = body?.event?.data
    const documentId = data?.id
    if (!documentId) return NextResponse.json({ ok: true })

    // Documento totalmente assinado? (usa os dados do próprio payload)
    const tipo = body?.event?.type
    const todosAssinaram =
      tipo === 'document.finished' ||
      (typeof data?.signed_count === 'number' &&
        typeof data?.signatures_count === 'number' &&
        data.signed_count >= data.signatures_count) ||
      (Array.isArray(data?.signatures) && data.signatures.every(s => !!s.signed))

    if (todosAssinaram) {
      const signedUrl = data?.files?.signed || null
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
