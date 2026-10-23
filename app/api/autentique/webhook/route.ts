import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { emitCrmChange } from '@/lib/realtime'
import { anexarContratoAssinadoPorAutentiqueId } from '@/lib/obrigo-sync'
import { emitirDoLead } from '@/lib/integracoes'

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
      // O Autentique avisa mais de uma vez (assinatura + documento finalizado): o evento sai só na 1ª
      const novos = await pool.query(`SELECT id, lead_id, tipo FROM contratos WHERE autentique_id = $1 AND status <> 'assinado'`, [documentId])
      await pool.query(
        `UPDATE contratos SET autentique_status = 'assinado', autentique_url = $1, status = 'assinado' WHERE autentique_id = $2`,
        [signedUrl, documentId]
      )
      emitCrmChange()
      // Integrações: contrato.assinado
      for (const c of novos.rows) if (c.lead_id) void emitirDoLead(c.lead_id, 'contrato.assinado', { contrato: { id: c.id, tipo: c.tipo, forma: 'eletronica', url_assinado: signedUrl } })
      // Grava o contrato assinado nos Arquivos anexos da empresa no Obrigô.
      void anexarContratoAssinadoPorAutentiqueId(documentId)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[WEBHOOK AUTENTIQUE]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
