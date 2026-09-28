// Ponte ERP → Obrigô: avisa a API do Obrigô para subir o cadastro (link público, tela antiga,
// conclusão de onboarding) para a Empresa correspondente. Server-to-server, fire-and-forget:
// nunca bloqueia nem quebra o fluxo do ERP — falha só vai pro log.
import pool from './db'
import { empresaAtivaId } from './tenant'

const OBRIGO_API = (process.env.OBRIGO_API_URL || 'http://127.0.0.1:4002').replace(/\/$/, '')

// Sobe o cadastro do ERP para a Empresa do Obrigô. Retorna o id da Empresa (ou null se falhar).
export async function syncEmpresaFromNauta(nautaClienteId: string): Promise<string | null> {
  const secret = process.env.SSO_GESTOROA_SECRET
  if (!secret || !nautaClienteId) return null
  try {
    const r = await fetch(`${OBRIGO_API}/api/v1/interno/sync-from-nauta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ nautaClienteId }),
    })
    if (!r.ok) { console.error('[obrigo-sync] resposta', r.status, await r.text().catch(() => '')); return null }
    const j = await r.json().catch(() => null)
    return (j?.data?.empresaId as string) ?? null
  } catch (e) {
    console.error('[obrigo-sync] falha ao sincronizar', nautaClienteId, (e as Error).message)
    return null
  }
}

// Garante o registro `clientes` do ERP para o lead (cria mínimo a partir do lead se não existir).
async function ensureClienteForLead(leadId: string): Promise<string | null> {
  const ex = await pool.query('SELECT id FROM clientes WHERE lead_id = $1 LIMIT 1', [leadId])
  if (ex.rows[0]?.id) return ex.rows[0].id
  const empresaId = await empresaAtivaId()
  const l = await pool.query('SELECT nome, email, whatsapp FROM leads WHERE id = $1', [leadId])
  const lead = l.rows[0]
  if (!lead) return null
  const ins = await pool.query(
    `INSERT INTO clientes (lead_id, empresa_id, cli_nome_completo, cli_email, emp_telefone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [leadId, empresaId, lead.nome ?? null, lead.email ?? null, lead.whatsapp ?? null]
  )
  return ins.rows[0]?.id ?? null
}

// Anexa um arquivo (contrato assinado, comprovante) aos Arquivos anexos da empresa do Obrigô.
export async function anexarNoObrigo(nautaClienteId: string, nomeArquivo: string, mime: string, buffer: Buffer): Promise<void> {
  const secret = process.env.SSO_GESTOROA_SECRET
  if (!secret || !nautaClienteId || !buffer?.length) return
  try {
    const fd = new FormData()
    fd.append('nautaClienteId', nautaClienteId)
    fd.append('nomeArquivo', nomeArquivo)
    fd.append('arquivo', new Blob([new Uint8Array(buffer)], { type: mime || 'application/octet-stream' }), nomeArquivo)
    const r = await fetch(`${OBRIGO_API}/api/v1/interno/anexo-from-nauta`, {
      method: 'POST', headers: { 'x-internal-secret': secret }, body: fd,
    })
    if (!r.ok) console.error('[obrigo-sync] anexo resposta', r.status, await r.text().catch(() => ''))
  } catch (e) {
    console.error('[obrigo-sync] falha ao anexar', nautaClienteId, (e as Error).message)
  }
}

// Anexa o contrato assinado de um contrato do ERP (por lead): baixa o PDF assinado e envia ao Obrigô.
export async function anexarContratoAssinadoDoLead(leadId: string): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT cliente_id, autentique_url, assinado_url FROM contratos
        WHERE lead_id = $1 ORDER BY atualizado_em DESC NULLS LAST LIMIT 1`, [leadId])
    const row = r.rows[0]
    if (!row?.cliente_id) return
    const url: string | null = row.autentique_url || row.assinado_url || null
    if (!url) return
    const abs = url.startsWith('http') ? url : `${process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000'}${url}`
    const resp = await fetch(abs)
    if (!resp.ok) { console.error('[obrigo-sync] baixar contrato assinado', resp.status); return }
    const buf = Buffer.from(await resp.arrayBuffer())
    const mime = resp.headers.get('content-type') || 'application/pdf'
    await anexarNoObrigo(row.cliente_id, 'Contrato assinado.pdf', mime, buf)
  } catch (e) {
    console.error('[obrigo-sync] anexarContratoAssinadoDoLead', leadId, (e as Error).message)
  }
}

// Idem, mas identificando o contrato pelo id do documento no Autentique (usado no webhook).
export async function anexarContratoAssinadoPorAutentiqueId(autentiqueId: string): Promise<void> {
  try {
    const r = await pool.query('SELECT cliente_id, autentique_url FROM contratos WHERE autentique_id = $1 LIMIT 1', [autentiqueId])
    const row = r.rows[0]
    if (!row?.cliente_id || !row?.autentique_url) return
    const resp = await fetch(row.autentique_url as string)
    if (!resp.ok) { console.error('[obrigo-sync] baixar contrato (webhook)', resp.status); return }
    const buf = Buffer.from(await resp.arrayBuffer())
    await anexarNoObrigo(row.cliente_id, 'Contrato assinado.pdf', resp.headers.get('content-type') || 'application/pdf', buf)
  } catch (e) {
    console.error('[obrigo-sync] anexarContratoAssinadoPorAutentiqueId', autentiqueId, (e as Error).message)
  }
}

// Garante que exista a Empresa no Obrigô para o lead e devolve o id (pra abrir a ficha).
export async function ensureEmpresaObrigo(leadId: string): Promise<string | null> {
  const clienteId = await ensureClienteForLead(leadId)
  if (!clienteId) return null
  return syncEmpresaFromNauta(clienteId)
}

// Conveniência: dado um lead, resolve o cliente vinculado e sincroniza.
export async function syncEmpresaFromLead(leadId: string): Promise<void> {
  try {
    const r = await pool.query('SELECT id FROM clientes WHERE lead_id = $1 LIMIT 1', [leadId])
    const id = r.rows[0]?.id
    if (id) await syncEmpresaFromNauta(id)
  } catch (e) {
    console.error('[obrigo-sync] falha ao resolver cliente do lead', leadId, (e as Error).message)
  }
}
