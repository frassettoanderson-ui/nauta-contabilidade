import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import pool from '@/lib/db'
import { emitCrmChange } from '@/lib/realtime'
import { verificarAviso, pdfFinal } from '@/lib/holysign'
import { anexarNoObrigo } from '@/lib/obrigo-sync'
import { emitirDoLead } from '@/lib/integracoes'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Aviso do Holysign (callback_url do documento). documento.concluido = o cliente assinou (a
// contratada já tinha assinado pelo Termo de autorização): baixa o PDF final, marca o contrato
// como assinado (o card passa a mostrar "Iniciar Onboarding"), anexa no Obrigô e avisa as integrações.
export async function POST(req: NextRequest) {
  const corpo = await req.text()
  const conta = verificarAviso(corpo, req.headers.get('x-holysign-assinatura'))
  if (!conta) return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 })
  let b: { evento?: string; documento_id?: string } = {}
  try { b = JSON.parse(corpo) } catch { return NextResponse.json({ error: 'json' }, { status: 400 }) }
  if (b.evento !== 'documento.concluido' || !b.documento_id) return NextResponse.json({ ok: true })

  const c = (await pool.query(
    `SELECT id, lead_id, cliente_id, tipo, status FROM contratos WHERE provedor = 'holysign' AND autentique_id = $1`, [b.documento_id],
  )).rows[0]
  if (!c) return NextResponse.json({ ok: true, ignorado: 'contrato não encontrado' })
  if (c.status === 'assinado') return NextResponse.json({ ok: true, ja: true }) // aviso repetido

  try {
    const pdf = await pdfFinal(conta, b.documento_id)
    const dir = path.join(process.cwd(), 'uploads-private')
    await mkdir(dir, { recursive: true })
    const nome = `contrato-assinado-holysign-${c.lead_id}-${Date.now()}.pdf`
    await writeFile(path.join(dir, nome), pdf)
    const url = `/api/sistema/arquivo/${nome}`
    await pool.query(
      `UPDATE contratos SET status = 'assinado', autentique_status = 'assinado', autentique_url = $1, assinado_url = $1, atualizado_em = now() WHERE id = $2`,
      [url, c.id],
    )
    emitCrmChange()
    if (c.cliente_id) void anexarNoObrigo(c.cliente_id, 'Contrato assinado.pdf', 'application/pdf', pdf)
    if (c.lead_id) void emitirDoLead(c.lead_id, 'contrato.assinado', { contrato: { id: c.id, tipo: c.tipo, forma: 'eletronica', assinador: 'holysign', url_assinado: null } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[WEBHOOK HOLYSIGN]', e)
    return NextResponse.json({ ok: false }, { status: 500 }) // o Holysign tenta de novo
  }
}
