import pool from './db'
import { emitCrmChange } from './realtime'
import { asaasApi, dadosLead, ensureCustomer, competenciaAberta } from './asaas'

// ─── Pix Automático (Asaas) ──────────────────────────────────────────────────
// O "PIX" oferecido na mensagem de cobrança é o QR do Pix Automático: um único
// copia-e-cola que paga a competência em aberto E autoriza os débitos mensais seguintes.
// Cliente que paga por ele entra no automático (paymentCreationMode SUBSCRIPTION → o Asaas
// gera as cobranças sozinho). Quem paga boleto segue na régua normal até migrar.

export interface PixAuto {
  id: string; lead_id: string; asaas_auth_id: string; status: string
  start_date: string | null; valor: number; payload: string | null; encoded_image: string | null; expira_em: string | null
}

const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate())
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export async function getPixAuto(leadId: string): Promise<PixAuto | null> {
  const r = await pool.query(
    `SELECT id, lead_id, asaas_auth_id, status, to_char(start_date,'YYYY-MM-DD') AS start_date, valor, payload, encoded_image,
            to_char(expira_em,'YYYY-MM-DD"T"HH24:MI:SS') AS expira_em
       FROM financeiro_pix_automatico WHERE lead_id = $1 ORDER BY criado_em DESC LIMIT 1`, [leadId]
  )
  return r.rows[0] ? { ...r.rows[0], valor: Number(r.rows[0].valor) } : null
}

/** Devolve a autorização vigente (ACTIVE ou CREATED ainda válida) ou cria uma nova com o QR. */
export async function getOrCreatePixAuto(leadId: string): Promise<PixAuto> {
  const atual = await getPixAuto(leadId)
  if (atual && atual.status === 'ACTIVE') return atual
  if (atual && atual.status === 'CREATED' && atual.expira_em && new Date(atual.expira_em) > new Date()) return atual

  const d = await dadosLead(leadId)
  if (!(Number(d.valor_honorario) > 0)) throw new Error('Lead sem honorário definido')
  const customerId = await ensureCustomer(d)

  // 1º pagamento (QR imediato) = competência em aberto mais antiga; débitos automáticos a partir do mês seguinte
  const comp = await competenciaAberta(leadId)           // 'YYYY-MM-01'
  const dia = d.honorario_vencimento ? new Date(d.honorario_vencimento).getDate() : 10
  const [y, m] = comp.split('-').map(Number)
  const vencAberto = new Date(y, m - 1, dia)
  const startDate = addMonths(vencAberto, 1)
  const valor = Number(d.valor_honorario)
  const nome = (d.emp_nome || d.nome || '').slice(0, 20)
  // contractId precisa ser único por autorização no Asaas (máx. 35 chars): lead + carimbo de tempo
  const contractId = `${leadId.replace(/-/g, '').slice(0, 24)}-${Date.now().toString(36)}`

  const a = await asaasApi<{
    id: string; status: string; startDate: string; payload: string; encodedImage: string
    immediateQrCode?: { expirationDate?: string }
  }>('/pix/automatic/authorizations', {
    method: 'POST',
    body: JSON.stringify({
      customerId,
      contractId,
      frequency: 'MONTHLY',
      startDate: ymd(startDate),
      value: valor,
      description: `Honorarios ${nome}`.slice(0, 35),
      paymentCreationMode: 'SUBSCRIPTION',
      retryPolicy: 'ALLOW_THREE_IN_SEVEN_DAYS',
      immediateQrCode: { originalValue: valor, expirationSeconds: 30 * 24 * 3600, description: `Honorario ${comp.slice(5, 7)}/${comp.slice(0, 4)}` },
    }),
  })
  const expira = a.immediateQrCode?.expirationDate ? new Date(a.immediateQrCode.expirationDate.replace(' ', 'T')) : new Date(Date.now() + 30 * 24 * 3600 * 1000)
  await pool.query(
    `INSERT INTO financeiro_pix_automatico (empresa_id, lead_id, asaas_auth_id, contract_id, status, start_date, valor, payload, encoded_image, expira_em, raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (asaas_auth_id) DO UPDATE SET status = EXCLUDED.status, payload = EXCLUDED.payload, encoded_image = EXCLUDED.encoded_image, expira_em = EXCLUDED.expira_em, raw = EXCLUDED.raw, atualizado_em = now()`,
    [d.empresa_id, leadId, a.id, contractId, a.status || 'CREATED', a.startDate, valor, a.payload, a.encodedImage, expira, JSON.stringify(a)]
  )
  return (await getPixAuto(leadId))!
}

/** Autorização ativou: encerra a cobrança por boleto (assinatura + pendências) para não cobrar 2x. */
async function migrarParaPixAutomatico(leadId: string) {
  const l = await pool.query(`SELECT asaas_subscription_id FROM leads WHERE id = $1`, [leadId])
  const subId = l.rows[0]?.asaas_subscription_id as string | null
  if (subId) {
    const pend = await pool.query(
      `SELECT asaas_payment_id FROM financeiro_cobrancas WHERE lead_id = $1 AND asaas_subscription_id = $2 AND status IN ('PENDING','OVERDUE')`,
      [leadId, subId]
    )
    for (const row of pend.rows) {
      try { await asaasApi(`/payments/${row.asaas_payment_id}`, { method: 'DELETE' }) } catch { /* já removida */ }
      await pool.query(`UPDATE financeiro_cobrancas SET status = 'DELETED', atualizado_em = now() WHERE asaas_payment_id = $1`, [row.asaas_payment_id])
    }
    try { await asaasApi(`/subscriptions/${subId}`, { method: 'DELETE' }) } catch { /* já removida */ }
  }
  await pool.query(`UPDATE leads SET asaas_subscription_id = NULL, pix_automatico_ativo = true WHERE id = $1`, [leadId])
}

/** Webhook: eventos PIX_AUTOMATIC_RECURRING_* */
export async function processarEventoPixAuto(body: { event?: string; authorization?: { id?: string; status?: string; startDate?: string }; paymentInstruction?: { authorizationId?: string; paymentId?: string; status?: string } }) {
  const ev = body.event || ''
  const authId = body.authorization?.id || body.paymentInstruction?.authorizationId
  if (!authId) return { ignored: true }
  const r = await pool.query(`SELECT lead_id FROM financeiro_pix_automatico WHERE asaas_auth_id = $1`, [authId])
  const leadId = r.rows[0]?.lead_id as string | undefined
  if (!leadId) return { ignored: true, motivo: 'autorização desconhecida' }

  if (ev.includes('AUTHORIZATION')) {
    const status = body.authorization?.status
      || (ev.endsWith('ACTIVATED') ? 'ACTIVE' : ev.endsWith('CANCELLED') ? 'CANCELLED' : ev.endsWith('EXPIRED') ? 'EXPIRED' : ev.endsWith('REFUSED') ? 'REFUSED' : 'CREATED')
    await pool.query(
      `UPDATE financeiro_pix_automatico SET status = $2, start_date = COALESCE($3::date, start_date), raw = $4, atualizado_em = now() WHERE asaas_auth_id = $1`,
      [authId, status, body.authorization?.startDate ?? null, JSON.stringify(body)]
    )
    if (status === 'ACTIVE') await migrarParaPixAutomatico(leadId)
    if (['CANCELLED', 'EXPIRED', 'REFUSED'].includes(status)) {
      // volta para a cobrança normal (boleto/PIX) — recria a assinatura se não houver
      await pool.query(`UPDATE leads SET pix_automatico_ativo = false WHERE id = $1`, [leadId])
      const { sincronizarLead } = await import('./asaas')
      sincronizarLead(leadId).catch(e => console.error('[pix-auto] recriar assinatura:', (e as Error).message))
    }
  }
  // Instruções de pagamento (débito agendado/recusado) só ficam registradas no raw da autorização
  if (ev.includes('PAYMENT_INSTRUCTION')) {
    await pool.query(`UPDATE financeiro_pix_automatico SET raw = raw || $2::jsonb, atualizado_em = now() WHERE asaas_auth_id = $1`,
      [authId, JSON.stringify({ ultimaInstrucao: body.paymentInstruction, evento: ev })])
  }
  emitCrmChange()
  return { ok: true, event: ev, leadId }
}

export async function cancelarPixAuto(leadId: string) {
  const a = await getPixAuto(leadId)
  if (a && ['CREATED', 'ACTIVE'].includes(a.status)) {
    try { await asaasApi(`/pix/automatic/authorizations/${a.asaas_auth_id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: 'Cancelado pelo escritório' }) }) } catch { /* ignora */ }
    await pool.query(`UPDATE financeiro_pix_automatico SET status = 'CANCELLED', atualizado_em = now() WHERE asaas_auth_id = $1`, [a.asaas_auth_id])
  }
  await pool.query(`UPDATE leads SET pix_automatico_ativo = false WHERE id = $1`, [leadId])
  emitCrmChange()
  return { ok: true }
}
