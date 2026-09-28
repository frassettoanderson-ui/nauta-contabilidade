// Ponte ERP → Obrigô: avisa a API do Obrigô para subir o cadastro (link público, tela antiga,
// conclusão de onboarding) para a Empresa correspondente. Server-to-server, fire-and-forget:
// nunca bloqueia nem quebra o fluxo do ERP — falha só vai pro log.
import pool from './db'

const OBRIGO_API = (process.env.OBRIGO_API_URL || 'http://127.0.0.1:4002').replace(/\/$/, '')

export async function syncEmpresaFromNauta(nautaClienteId: string): Promise<void> {
  const secret = process.env.SSO_GESTOROA_SECRET
  if (!secret || !nautaClienteId) return
  try {
    const r = await fetch(`${OBRIGO_API}/api/v1/interno/sync-from-nauta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ nautaClienteId }),
    })
    if (!r.ok) console.error('[obrigo-sync] resposta', r.status, await r.text().catch(() => ''))
  } catch (e) {
    console.error('[obrigo-sync] falha ao sincronizar', nautaClienteId, (e as Error).message)
  }
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
