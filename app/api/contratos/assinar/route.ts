import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gerarContrato, getContratoByLead } from '@/lib/contrato-gen'
import { criarDocumento, assinarDocumento } from '@/lib/autentique'
import { getClienteByLead } from '@/lib/clientes'
import pool from '@/lib/db'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId faltando' }, { status: 400 })

  try {
    // 1. Gera (ou reutiliza) o contrato PDF
    let contrato = await getContratoByLead(leadId)
    if (!contrato) contrato = await gerarContrato(leadId)

    // 2. Lê o PDF do disco
    const filename = contrato.pdf_url?.split('/').pop()
    if (!filename) throw new Error('PDF do contrato não encontrado')
    const pdfPath = path.join(process.cwd(), 'uploads-private', filename)
    const pdfBuf = await readFile(pdfPath)
    const pdfBase64 = pdfBuf.toString('base64')

    // 3. Busca dados do Sócio 1 para montar o signatário
    const cliente = await getClienteByLead(leadId)
    if (!cliente) throw new Error('Cadastro do cliente não encontrado')

    const socios: Array<{ nome_completo?: string; email?: string }> = (cliente.socios as Array<{ nome_completo?: string; email?: string }>) || []
    const socio1 = socios[0]
    const emailSocio = socio1?.email || cliente.emp_email
    if (!emailSocio) throw new Error('E-mail do Sócio 1 não encontrado no cadastro')

    const nomeEmpresa = (cliente.emp_nome as string) || 'Cliente'

    // 4. Cria documento no Autentique com 2 signatários: Nauta + Sócio 1
    const doc = await criarDocumento(
      `Contrato - ${nomeEmpresa}`,
      pdfBase64,
      [
        { name: 'Nauta Contabilidade', email: 'contato@nautacontabilidade.com.br', action: 'SIGN' },
        { name: (socio1?.nome_completo as string) || nomeEmpresa, email: emailSocio, action: 'SIGN' },
      ]
    )

    // 5. Assina imediatamente como Nauta via API
    await assinarDocumento(doc.id)

    // 6. Salva autentique_id e status no DB
    await pool.query(
      `UPDATE contratos SET autentique_id = $1, autentique_status = 'pendente', status = 'aguardando_assinatura' WHERE id = $2`,
      [doc.id, contrato.id]
    )

    return NextResponse.json({ ok: true, autentique_id: doc.id })
  } catch (e) {
    console.error('[ASSINAR]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao enviar para assinatura' }, { status: 500 })
  }
}
