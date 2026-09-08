import pool from './db'
import { emitCrmChange } from './realtime'

// ─── Integração Asaas (cobrança automática dos honorários) ──────────────────
// Cada lead ativo no financeiro vira um "customer" + uma "subscription" mensal no
// Asaas (valor = honorário, vencimento = dia do honorario_vencimento). O Asaas gera
// boleto + PIX todo mês e avisa por webhook; o pagamento recebido vira uma linha em
// financeiro_pagamentos (baixa automática). Ambiente pelo ASAAS_ENV (sandbox|production).

const BASE = () => (process.env.ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3')
export const asaasConfigurado = () => !!process.env.ASAAS_API_KEY
export const asaasAmbiente = () => (process.env.ASAAS_ENV === 'production' ? 'production' : 'sandbox')

export interface AsaasPayment {
  id: string; customer: string; subscription?: string | null
  value: number; dueDate: string; status: string; billingType: string
  invoiceUrl?: string | null; bankSlipUrl?: string | null
  paymentDate?: string | null; clientPaymentDate?: string | null
  externalReference?: string | null; description?: string | null
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('Asaas não configurado (ASAAS_API_KEY)')
  const res = await fetch(`${BASE()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key, ...(init.headers || {}) },
    cache: 'no-store',
  })
  const text = await res.text()
  let body: unknown = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) {
    const b = body as { errors?: { description?: string }[] } | null
    const msg = b?.errors?.[0]?.description || `Asaas HTTP ${res.status}`
    throw new Error(msg)
  }
  return body as T
}

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const compOf = (dateStr: string) => `${dateStr.slice(0, 7)}-01` // competência = mês do vencimento

interface LeadBilling {
  id: string; nome: string; email: string | null; whatsapp: string | null
  valor_honorario: number | null; honorario_vencimento: string | null
  asaas_customer_id: string | null; asaas_subscription_id: string | null; empresa_id: string | null
  emp_nome: string | null; emp_cnpj: string | null; cli_cpf: string | null; emp_email: string | null; emp_telefone: string | null
  situacao: string | null
}

async function dadosLead(leadId: string): Promise<LeadBilling> {
  const r = await pool.query(
    `SELECT l.id, l.nome, l.email, l.whatsapp, l.valor_honorario, l.honorario_vencimento,
            l.asaas_customer_id, l.asaas_subscription_id, l.empresa_id,
            c.emp_nome, c.emp_cnpj, c.cli_cpf, c.emp_email, c.emp_telefone, c.situacao
       FROM leads l LEFT JOIN clientes c ON c.lead_id = l.id
      WHERE l.id = $1 LIMIT 1`,
    [leadId]
  )
  if (!r.rows[0]) throw new Error('Lead não encontrado')
  return r.rows[0]
}

// ── Customer ─────────────────────────────────────────────────────────────────
async function ensureCustomer(d: LeadBilling): Promise<string> {
  if (d.asaas_customer_id) {
    try { await api(`/customers/${d.asaas_customer_id}`); return d.asaas_customer_id } catch { /* recria abaixo */ }
  }
  const found = await api<{ data: { id: string }[] }>(`/customers?externalReference=${encodeURIComponent(d.id)}&limit=1`)
  let id = found.data?.[0]?.id
  if (!id) {
    const doc = digits(d.emp_cnpj) || digits(d.cli_cpf)
    if (!doc) throw new Error('Cliente sem CNPJ/CPF no cadastro — necessário para cobrar no Asaas')
    const tel = digits(d.emp_telefone || d.whatsapp)
    const c = await api<{ id: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: d.emp_nome || d.nome,
        cpfCnpj: doc,
        email: d.emp_email || d.email || undefined,
        mobilePhone: tel.length >= 10 ? tel.slice(-11) : undefined,
        externalReference: d.id,
        notificationDisabled: true, // quem avisa o cliente é a Nauta (WhatsApp/e-mail), não o Asaas
      }),
    })
    id = c.id
  }
  // garante notificações do Asaas desligadas também para clientes já existentes
  try { await api(`/customers/${id}`, { method: 'PUT', body: JSON.stringify({ notificationDisabled: true }) }) } catch { /* ignora */ }
  await pool.query(`UPDATE leads SET asaas_customer_id = $2 WHERE id = $1`, [d.id, id])
  return id
}

// Próximo vencimento a cobrar: primeira competência (a partir do 1º vencimento) ainda
// sem pagamento lançado, com data >= amanhã (o Asaas não aceita vencimento no passado).
async function proximoVencimento(d: LeadBilling): Promise<string> {
  const base = d.honorario_vencimento ? new Date(d.honorario_vencimento) : new Date()
  const dia = base.getDate()
  const pagos = new Set((await pool.query(
    `SELECT to_char(competencia, 'YYYY-MM') AS c FROM financeiro_pagamentos WHERE lead_id = $1`, [d.id]
  )).rows.map(r => String(r.c)))
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  let cur = new Date(base.getFullYear(), base.getMonth(), 1)
  for (let i = 0; i < 36; i++) {
    const comp = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
    const venc = new Date(cur.getFullYear(), cur.getMonth(), Math.min(dia, new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate()))
    if (!pagos.has(comp) && venc > hoje) return ymd(venc)
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  const n = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia)
  return ymd(n)
}

// ── Subscription ─────────────────────────────────────────────────────────────
async function ensureSubscription(d: LeadBilling, customerId: string): Promise<string> {
  if (d.asaas_subscription_id) {
    try {
      const s = await api<{ id: string; status: string; value: number }>(`/subscriptions/${d.asaas_subscription_id}`)
      if (s.status === 'ACTIVE') {
        // mantém o valor sincronizado com o honorário do ERP
        if (Number(s.value) !== Number(d.valor_honorario)) {
          await api(`/subscriptions/${s.id}`, { method: 'PUT', body: JSON.stringify({ value: Number(d.valor_honorario), updatePendingPayments: true }) })
        }
        return s.id
      }
    } catch { /* recria abaixo */ }
  }
  const s = await api<{ id: string }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'UNDEFINED', // cliente escolhe boleto, PIX ou cartão na fatura
      value: Number(d.valor_honorario),
      nextDueDate: await proximoVencimento(d),
      cycle: 'MONTHLY',
      description: `Honorários contábeis — ${d.emp_nome || d.nome}`,
      externalReference: d.id,
    }),
  })
  await pool.query(`UPDATE leads SET asaas_subscription_id = $2 WHERE id = $1`, [d.id, s.id])
  return s.id
}

// ── Cobranças (payments) ─────────────────────────────────────────────────────
const PAGO = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'])

export async function upsertCobranca(p: AsaasPayment, leadId: string, empresaId: string | null, competenciaOverride?: string) {
  const competencia = competenciaOverride ?? compOf(p.dueDate)
  const pagoEm = PAGO.has(p.status) ? (p.clientPaymentDate || p.paymentDate || null) : null
  await pool.query(
    `INSERT INTO financeiro_cobrancas
       (empresa_id, lead_id, asaas_payment_id, asaas_subscription_id, competencia, valor, vencimento, status, billing_type, invoice_url, bank_slip_url, pago_em, raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (asaas_payment_id) DO UPDATE SET
       status = EXCLUDED.status, valor = EXCLUDED.valor, vencimento = EXCLUDED.vencimento, competencia = EXCLUDED.competencia,
       billing_type = EXCLUDED.billing_type, invoice_url = EXCLUDED.invoice_url, bank_slip_url = EXCLUDED.bank_slip_url,
       pago_em = EXCLUDED.pago_em, raw = EXCLUDED.raw, atualizado_em = now()`,
    [empresaId, leadId, p.id, p.subscription ?? null, competencia, Number(p.value || 0), p.dueDate, p.status, p.billingType,
     p.invoiceUrl ?? null, p.bankSlipUrl ?? null, pagoEm, JSON.stringify(p)]
  )
  // Baixa automática: pagamento recebido → financeiro_pagamentos (uma vez por competência)
  if (pagoEm) {
    const ja = await pool.query(`SELECT 1 FROM financeiro_pagamentos WHERE lead_id = $1 AND competencia = $2 LIMIT 1`, [leadId, competencia])
    if (!ja.rows[0]) {
      await pool.query(
        `INSERT INTO financeiro_pagamentos (lead_id, competencia, valor, pago_em, empresa_id)
         VALUES ($1, $2, $3, $4, COALESCE($5, (SELECT empresa_id FROM leads WHERE id = $1)))`,
        [leadId, competencia, Number(p.value || 0), pagoEm, empresaId]
      )
    }
  }
}

async function syncPayments(leadId: string, subscriptionId: string, empresaId: string | null) {
  const r = await api<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments?limit=100`)
  for (const p of r.data || []) await upsertCobranca(p, leadId, empresaId)
  return (r.data || []).length
}

// ── Operações públicas ───────────────────────────────────────────────────────
export async function sincronizarLead(leadId: string) {
  const d = await dadosLead(leadId)
  if (d.situacao === 'inativo') { await cancelarAssinatura(leadId); return { leadId, ok: true, cancelado: true } }
  if (!(Number(d.valor_honorario) > 0)) throw new Error('Lead sem honorário definido')
  const customerId = await ensureCustomer(d)
  const subId = await ensureSubscription({ ...d, asaas_customer_id: customerId }, customerId)
  const n = await syncPayments(d.id, subId, d.empresa_id)
  emitCrmChange()
  return { leadId, ok: true, customerId, subscriptionId: subId, cobrancas: n }
}

export async function cancelarAssinatura(leadId: string) {
  const d = await dadosLead(leadId)
  if (d.asaas_subscription_id) {
    try { await api(`/subscriptions/${d.asaas_subscription_id}`, { method: 'DELETE' }) } catch { /* já removida */ }
    await pool.query(`UPDATE leads SET asaas_subscription_id = NULL WHERE id = $1`, [leadId])
  }
  return { ok: true }
}

export async function sincronizarTodos(empresaId: string) {
  const r = await pool.query(
    `SELECT l.id, l.nome FROM leads l
      WHERE l.empresa_id = $1 AND l.financeiro_ativo = true AND l.valor_honorario > 0
        AND NOT EXISTS (SELECT 1 FROM clientes c WHERE c.lead_id = l.id AND c.situacao = 'inativo')
      ORDER BY l.nome`, [empresaId]
  )
  const out: { leadId: string; nome: string; ok: boolean; erro?: string }[] = []
  for (const l of r.rows) {
    try { await sincronizarLead(l.id); out.push({ leadId: l.id, nome: l.nome, ok: true }) }
    catch (e) { out.push({ leadId: l.id, nome: l.nome, ok: false, erro: (e as Error).message }) }
  }
  return out
}

// Webhook: { event: 'PAYMENT_RECEIVED', payment: {...} }
export async function processarWebhook(body: { event?: string; payment?: AsaasPayment }) {
  const p = body.payment
  if (!p?.id) return { ignored: true }
  const r = await pool.query(
    `SELECT id, empresa_id FROM leads
      WHERE ($1::text IS NOT NULL AND asaas_subscription_id = $1)
         OR asaas_customer_id = $2
         OR id::text = $3
      LIMIT 1`,
    [p.subscription ?? null, p.customer, p.externalReference ?? '']
  )
  const lead = r.rows[0]
  if (!lead) return { ignored: true, motivo: 'lead não encontrado' }
  // Pagamento sem assinatura de boleto e com Pix Automático (criado/ativo) → é o QR do
  // Pix Automático ou um débito recorrente: quita a competência em aberto mais antiga.
  let compOverride: string | undefined
  if (!p.subscription) {
    const pa = await pool.query(
      `SELECT 1 FROM financeiro_pix_automatico WHERE lead_id = $1 AND status IN ('CREATED','ACTIVE') LIMIT 1`, [lead.id]
    )
    if (pa.rows[0]) compOverride = await competenciaAberta(lead.id)
  }
  await upsertCobranca(p, lead.id, lead.empresa_id, compOverride)
  emitCrmChange()
  return { ok: true, event: body.event, leadId: lead.id }
}

// Competência em aberto mais antiga do lead ('YYYY-MM-01'): a 1ª cobrança pendente/vencida;
// se não houver, o mês seguinte ao último pago; senão o mês do 1º vencimento.
export async function competenciaAberta(leadId: string): Promise<string> {
  const c = await pool.query(
    `SELECT to_char(competencia,'YYYY-MM-01') AS c FROM financeiro_cobrancas
      WHERE lead_id = $1 AND status IN ('PENDING','OVERDUE') ORDER BY vencimento ASC LIMIT 1`, [leadId]
  )
  if (c.rows[0]?.c) return c.rows[0].c
  const p = await pool.query(
    `SELECT to_char((MAX(competencia) + INTERVAL '1 month')::date,'YYYY-MM-01') AS c FROM financeiro_pagamentos WHERE lead_id = $1`, [leadId]
  )
  if (p.rows[0]?.c) return p.rows[0].c
  const l = await pool.query(`SELECT to_char(honorario_vencimento,'YYYY-MM-01') AS c FROM leads WHERE id = $1`, [leadId])
  return l.rows[0]?.c || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
}

// PIX copia-e-cola de uma cobrança comum (fallback quando não há Pix Automático)
export async function pixDaCobranca(asaasPaymentId: string): Promise<string> {
  try { const r = await api<{ payload?: string }>(`/payments/${asaasPaymentId}/pixQrCode`); return r.payload || '' } catch { return '' }
}

// Pix Automático disponível para a conta? (recurso precisa ser habilitado pelo Asaas)
export async function pixAutomaticoDisponivel(): Promise<boolean> {
  try { await api('/pix/automatic/eligibility'); return true } catch { return false }
}

// Usados pelos módulos de Pix Automático e régua de cobrança
export { api as asaasApi, dadosLead, ensureCustomer }

// Consultas para a UI
export async function listCobrancasLead(leadId: string) {
  const r = await pool.query(
    `SELECT id, asaas_payment_id, to_char(competencia,'YYYY-MM') AS competencia, valor, to_char(vencimento,'YYYY-MM-DD') AS vencimento,
            status, billing_type, invoice_url, bank_slip_url, to_char(pago_em,'YYYY-MM-DD') AS pago_em
       FROM financeiro_cobrancas WHERE lead_id = $1 ORDER BY vencimento DESC`, [leadId]
  )
  return r.rows
}

// Resumo por lead: a cobrança em aberto mais antiga (ou a última paga) — para a tela de Faturamento
export async function resumoCobrancas(empresaId: string) {
  const r = await pool.query(
    `SELECT DISTINCT ON (lead_id) lead_id, status, to_char(vencimento,'YYYY-MM-DD') AS vencimento, invoice_url, bank_slip_url, valor
       FROM financeiro_cobrancas
      WHERE empresa_id = $1 OR lead_id IN (SELECT id FROM leads WHERE empresa_id = $1)
      ORDER BY lead_id, (status IN ('PENDING','OVERDUE')) DESC, vencimento ASC`, [empresaId]
  )
  const map: Record<string, { status: string; vencimento: string; invoice_url: string | null; bank_slip_url: string | null; valor: number }> = {}
  for (const row of r.rows) map[String(row.lead_id)] = { status: row.status, vencimento: row.vencimento, invoice_url: row.invoice_url, bank_slip_url: row.bank_slip_url, valor: Number(row.valor) }
  return map
}
