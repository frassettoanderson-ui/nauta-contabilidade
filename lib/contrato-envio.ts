// Envio do contrato para assinatura (Holysign quando a conta da contratada está ligada; senão Autentique).
// Usado pelo botão do card (/api/contratos/assinar) e pelo "refazer contrato".
import { gerarContrato, getContratoByLead } from './contrato-gen'
import { criarDocumento, assinarDocumento, criarLinkAssinatura, deletarDocumento } from './autentique'
import { getClienteByLead } from './clientes'
import { holysignAtivo, enviarContrato, cancelarContrato } from './holysign'
import type { ContratadaId } from './contratada'
import pool from './db'
import { readFile } from 'fs/promises'
import path from 'path'

export interface ResultadoEnvio { ok: boolean; provedor: 'holysign' | 'autentique'; documento_id?: string; autentique_id?: string; link_assinatura: string | null }

export async function enviarContratoParaAssinatura(leadId: string): Promise<ResultadoEnvio> {
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
  // Limpa: remove rótulo "E-mail:" colado por engano no cadastro, espaços e caractere
  // invisível — a Autentique recusa qualquer coisa fora do formato como "validation".
  const emailSocio = String(
    (socio1?.email as string) || (cliente.cli_email as string) || (cliente.emp_email as string) || ''
  ).replace(/^\s*e-?mail\s*:?\s*/i, '').trim().replace(/\s+/g, '').toLowerCase()
  if (!emailSocio) throw new Error('E-mail não encontrado no cadastro. Preencha o e-mail na aba Dados do Cliente.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSocio)) {
    throw new Error(`E-mail do cliente inválido: "${emailSocio}". Corrija na aba Dados do Cliente e envie novamente.`)
  }

  const nomeSocio = String((socio1?.nome_completo as string) || (cliente.cli_nome_completo as string) || 'Sócio 1').trim()
  const nomeEmpresa = (cliente.emp_nome as string) || (cliente.cli_nome_completo as string) || 'Cliente'

  // Holysign (assinador da HolyTech): contrato já sai assinado pelo representante da contratada
  // (Nauta ou Atuan); o cliente recebe o convite e, quando assina, o webhook libera o onboarding.
  const contratada = ((contrato.contratada as string) || 'nauta') as ContratadaId
  if (holysignAtivo(contratada)) {
    const lead = (await pool.query(`SELECT whatsapp FROM leads WHERE id = $1`, [leadId])).rows[0]
    const s1 = socio1 as { cpf?: string; nome_completo?: string } | undefined
    const doc = await enviarContrato(contratada, {
      titulo: `Contrato - ${nomeEmpresa}`, pdfBase64, externalId: `erp-contrato-${contrato.id}`,
      callbackUrl: `${(process.env.NEXTAUTH_URL || 'https://obrigo.com.br').replace(/\/$/, '')}/api/holysign/webhook`,
      cliente: { nome: nomeSocio, cpf: (s1?.cpf as string) || (cliente.cli_cpf as string) || null, email: emailSocio, whatsapp: lead?.whatsapp || (cliente.emp_telefone as string) || null },
    })
    const linkAssinatura = doc.signatarios.find(s => s.papel !== 'contratada')?.link ?? null
    await pool.query(
      `UPDATE contratos SET provedor = 'holysign', autentique_id = $1, autentique_status = 'pendente', status = 'aguardando_assinatura', link_assinatura = $3 WHERE id = $2`,
      [doc.id, contrato.id, linkAssinatura]
    )
    return { ok: true, provedor: 'holysign', documento_id: doc.id, link_assinatura: linkAssinatura }
  }

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

  return { ok: true, provedor: 'autentique', autentique_id: doc.id, link_assinatura: linkAssinatura }
}

// Cancela o envio em andamento (no assinador em que estiver) e marca o contrato como substituído,
// para o próximo envio gerar um PDF novo. Contrato já assinado não é tocado.
export async function substituirContrato(leadId: string) {
  const c = await getContratoByLead(leadId)
  if (!c) return null
  if (c.autentique_status === 'assinado' || c.status === 'assinado') throw new Error('Contrato já assinado — não é possível refazer.')
  if (c.autentique_id && c.provedor === 'holysign') {
    try { await cancelarContrato(((c.contratada as string) || 'nauta') as ContratadaId, c.autentique_id) } catch (e) { console.error('[REFAZER] Holysign cancelar falhou:', e) }
  } else if (c.autentique_id) {
    try { await deletarDocumento(c.autentique_id) } catch (e) { console.error('[REFAZER] Autentique delete falhou:', e) }
  }
  await pool.query(`UPDATE contratos SET status = 'substituido', autentique_status = NULL, link_assinatura = NULL WHERE id = $1`, [c.id])
  return c.id as string
}

// Refaz: cancela o envio atual, gera um contrato novo (dados atuais da ficha/negociação) e envia
export async function refazerContrato(leadId: string) {
  const antigo = await substituirContrato(leadId)
  await gerarContrato(leadId)
  const r = await enviarContratoParaAssinatura(leadId)
  return { ...r, contrato_substituido: antigo }
}
