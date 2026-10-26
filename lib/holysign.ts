// Holysign (assinador da HolyTech) — envio do contrato já assinado pela contratada (representante
// com Termo de autorização) e aviso de volta (webhook) quando o cliente assina.
// Uma conta no Holysign por contratada: HOLYSIGN_CONTAS="nauta:<api_key>:<webhook_secret>,atuan:<api_key>:<webhook_secret>"
import crypto from 'crypto'
import type { ContratadaId } from './contratada'

const BASE = (process.env.HOLYSIGN_URL || 'https://holytechsolution.com.br/holysign').replace(/\/$/, '')

interface ContaHolysign { apiKey: string; webhookSecret: string }
function contas(): Partial<Record<ContratadaId, ContaHolysign>> {
  const out: Partial<Record<ContratadaId, ContaHolysign>> = {}
  for (const parte of (process.env.HOLYSIGN_CONTAS || '').split(',')) {
    const [id, apiKey, webhookSecret] = parte.split(':').map((x) => x.trim())
    if ((id === 'nauta' || id === 'atuan') && apiKey && webhookSecret) out[id] = { apiKey, webhookSecret }
  }
  return out
}

// Contrato vai pelo Holysign quando a conta da contratada está configurada; senão segue no Autentique
export const holysignAtivo = (c: ContratadaId) => !!contas()[c]

async function api<T>(c: ContratadaId, caminho: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const conta = contas()[c]
  if (!conta) throw new Error(`Holysign sem conta configurada para ${c}`)
  const r = await fetch(`${BASE}/api/v1${caminho}`, {
    method: init.method ?? 'GET',
    headers: { authorization: `Bearer ${conta.apiKey}`, ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(60_000),
  })
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { erro?: string }
    throw new Error(`Holysign: ${j.erro || `HTTP ${r.status}`}`)
  }
  return (await r.json()) as T
}

export interface DocHolysign { id: string; codigo: string; status: string; verificacao: string; signatarios: { id: string; nome: string; papel: string; status: string; link: string | null }[] }

// Cria o documento já assinado pelo representante da contratada; o cliente recebe o convite (e-mail/WhatsApp)
export function enviarContrato(c: ContratadaId, d: { titulo: string; pdfBase64: string; externalId: string; callbackUrl: string; cliente: { nome: string; cpf?: string | null; email?: string | null; whatsapp?: string | null } }) {
  return api<DocHolysign>(c, '/documentos', {
    method: 'POST',
    body: {
      titulo: d.titulo, pdf_base64: d.pdfBase64, external_id: d.externalId, callback_url: d.callbackUrl,
      assinatura_representante: true, enviar_convite: true,
      signatarios: [{ nome: d.cliente.nome, cpf: d.cliente.cpf || undefined, email: d.cliente.email || undefined, whatsapp: d.cliente.whatsapp || undefined, papel: 'parte' }],
    },
  })
}

export const cancelarContrato = (c: ContratadaId, id: string) => api<{ ok: boolean }>(c, `/documentos/${encodeURIComponent(id)}/cancelar`, { method: 'POST' })

export async function pdfFinal(c: ContratadaId, id: string): Promise<Buffer> {
  const conta = contas()[c]
  if (!conta) throw new Error(`Holysign sem conta configurada para ${c}`)
  const r = await fetch(`${BASE}/api/v1/documentos/${encodeURIComponent(id)}/final.pdf`, { headers: { authorization: `Bearer ${conta.apiKey}` }, signal: AbortSignal.timeout(60_000) })
  if (!r.ok) throw new Error(`Holysign: PDF final HTTP ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}

// Aviso do Holysign: X-Holysign-Assinatura = HMAC-SHA256(corpo, webhook_secret) em hex. Devolve a conta que assinou ou null.
export function verificarAviso(corpo: string, assinatura: string | null): ContratadaId | null {
  if (!assinatura) return null
  for (const [id, conta] of Object.entries(contas()) as [ContratadaId, ContaHolysign][]) {
    const esperado = crypto.createHmac('sha256', conta.webhookSecret).update(corpo).digest('hex')
    if (esperado.length === assinatura.length && crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(assinatura))) return id
  }
  return null
}
