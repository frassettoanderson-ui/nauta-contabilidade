import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gerarContrato, getContratoByLead } from '@/lib/contrato-gen'
import { criarDocumento, assinarDocumento, criarLinkAssinatura } from '@/lib/autentique'
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
    // Busca e-mail na ordem: e-mail do sócio → e-mail do cliente (cli_email) → e-mail da empresa
    // Limpa espaços/caractere invisível: a Autentique recusa e-mail com espaço como "format_is_invalid".
    const emailSocio = String(
      (socio1?.email as string) || (cliente.cli_email as string) || (cliente.emp_email as string) || ''
    ).trim().replace(/\s+/g, '').toLowerCase()
    if (!emailSocio) throw new Error('E-mail não encontrado no cadastro. Preencha o e-mail na aba Dados do Cliente.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSocio)) {
      throw new Error(`E-mail do cliente inválido: "${emailSocio}". Corrija na aba Dados do Cliente e envie novamente.`)
    }

    const nomeSocio = String((socio1?.nome_completo as string) || (cliente.cli_nome_completo as string) || 'Sócio 1').trim()
    const nomeEmpresa = (cliente.emp_nome as string) || 'Cliente'

    // 4. Cria documento no Autentique com 2 signatários: Nauta + Sócio 1
    const doc = await criarDocumento(
      `Contrato - ${nomeEmpresa}`,
      pdfBase64,
      [
        { name: 'Nauta Contabilidade', email: 'contato@nautacontabilidade.com.br', action: 'SIGN' },
        { name: nomeSocio, email: emailSocio, action: 'SIGN' },
      ]
    )

    // 5. Assina imediatamente como Nauta via API (usa o id do documento)
    await assinarDocumento(doc.id)

    // Link de assinatura do cliente (para copiar / enviar por WhatsApp).
    // Pega o signatário que NÃO é a Nauta (só há 2: Nauta + cliente) e gera o
    // short_link oficial via Autentique — a entrega por e-mail continua valendo.
    const signerCliente = (doc.signatures || []).find(
      s => (s.email || '').toLowerCase() !== 'contato@nautacontabilidade.com.br'
    )
    let linkAssinatura: string | null = null
    if (signerCliente?.public_id) {
      try {
        linkAssinatura = await criarLinkAssinatura(signerCliente.public_id)
      } catch (e) {
        console.error('[ASSINAR] Falha ao gerar link de assinatura:', e)
      }
    }

    // 6. Salva autentique_id, status e link de assinatura no DB
    await pool.query(
      `UPDATE contratos SET autentique_id = $1, autentique_status = 'pendente', status = 'aguardando_assinatura', link_assinatura = $3 WHERE id = $2`,
      [doc.id, contrato.id, linkAssinatura]
    )

    return NextResponse.json({ ok: true, autentique_id: doc.id, link_assinatura: linkAssinatura })
  } catch (e) {
    console.error('[ASSINAR]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao enviar para assinatura' }, { status: 500 })
  }
}
