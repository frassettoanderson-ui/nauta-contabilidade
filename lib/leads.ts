import pool from './db'
import { isContratoPronto } from './contratos'
import { emitCrmChange } from './realtime'
import { calcStatusFinanceiro } from './financeiro-calc'

export type Lead = {
  id?: string
  nome: string
  whatsapp: string
  email: string
  interesse: string
  etapa?: string
  classificacao?: number
  criado_em?: string
}

export interface Atividade {
  id: string
  lead_id: string
  descricao: string
  autor: string | null
  criado_em: string
}

export interface Lembrete {
  id: string
  lead_id: string
  descricao: string
  data: string
  concluido: boolean
  criado_em: string
}

// ─── CRIAÇÃO / LISTAGEM ──────────────────────────────────────────────────

export async function insertLead(lead: {
  nome: string; whatsapp: string; email: string; interesse: string
  etapa?: string; classificacao?: number
  responsavel_id?: string | null; responsavel_nome?: string | null
  origem?: string | null
}) {
  const res = await pool.query(
    `INSERT INTO leads (nome, whatsapp, email, interesse, etapa, classificacao, responsavel_id, responsavel_nome, origem)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [lead.nome, lead.whatsapp, lead.email, lead.interesse, lead.etapa ?? 'novo', lead.classificacao ?? 0,
     lead.responsavel_id ?? null, lead.responsavel_nome ?? null, lead.origem ?? null]
  )
  emitCrmChange()
  return res.rows[0]
}

export async function getLeads(opts?: { userId?: string; role?: string }) {
  // admin/gerente veem todos; comercial (e demais) veem apenas os seus
  const verTodos = !opts || opts.role === 'admin' || opts.role === 'gerente'
  const res = await pool.query(
    `SELECT l.*,
      (SELECT COUNT(*) FROM lead_lembretes ll
        WHERE ll.lead_id = l.id AND ll.concluido = false AND ll.data <= CURRENT_DATE) AS lembretes_pendentes,
      (SELECT autentique_status FROM contratos c WHERE c.lead_id = l.id ORDER BY c.criado_em DESC LIMIT 1) AS contrato_autentique_status,
      (SELECT status FROM contratos c WHERE c.lead_id = l.id ORDER BY c.criado_em DESC LIMIT 1) AS contrato_status
     FROM leads l
     WHERE COALESCE(l.em_onboarding, false) = false
       ${verTodos ? '' : 'AND l.responsavel_id = $1'}
     ORDER BY l.criado_em DESC`,
    verTodos ? [] : [opts!.userId]
  )
  const leads = res.rows

  // Anexa info de cadastro (id + completude) por lead
  const cli = await pool.query(`SELECT * FROM clientes WHERE lead_id IS NOT NULL`)
  const soc = await pool.query(`SELECT * FROM cliente_socios`)
  const sociosByCliente: Record<string, unknown[]> = {}
  for (const s of soc.rows) {
    (sociosByCliente[s.cliente_id] ||= []).push(s)
  }
  const cliByLead: Record<string, Record<string, unknown>> = {}
  for (const c of cli.rows) {
    cliByLead[c.lead_id] = { ...c, socios: sociosByCliente[c.id] || [] }
  }

  for (const l of leads) {
    const c = cliByLead[l.id]
    l.cliente_id = c ? c.id : null
    l.cadastro_completo = isContratoPronto(c, l)
  }
  return leads
}

export async function getLeadDetail(id: string) {
  const lead = await pool.query(`SELECT * FROM leads WHERE id = $1`, [id])
  if (!lead.rows[0]) return null
  const atividades = await pool.query(
    `SELECT * FROM lead_atividades WHERE lead_id = $1 ORDER BY criado_em DESC`, [id]
  )
  const lembretes = await pool.query(
    `SELECT * FROM lead_lembretes WHERE lead_id = $1 ORDER BY concluido ASC, data ASC`, [id]
  )
  return { ...lead.rows[0], atividades: atividades.rows, lembretes: lembretes.rows }
}

const LEAD_UPDATE_COLS = new Set([
  'nome', 'whatsapp', 'email', 'interesse', 'etapa', 'classificacao',
  'valor_honorario', 'valor_abertura', 'honorario_vencimento', 'negociacao_obs',
])

export async function updateLead(id: string, fields: Record<string, unknown>) {
  const keys = Object.keys(fields).filter(k => LEAD_UPDATE_COLS.has(k))
  if (keys.length === 0) return
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = keys.map(k => fields[k])
  await pool.query(`UPDATE leads SET ${sets} WHERE id = $1`, [id, ...values])
  emitCrmChange()
}

export async function deleteLead(id: string) {
  await pool.query(`DELETE FROM leads WHERE id = $1`, [id])
  emitCrmChange()
}

/** Há leads na coluna "Novo" do CRM (para o badge do menu Comercial)? */
export async function countLeadsNovos(): Promise<number> {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS n FROM leads
      WHERE COALESCE(etapa, 'novo') = 'novo' AND COALESCE(em_onboarding, false) = false`
  )
  return r.rows[0]?.n ?? 0
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────

/** Move o lead para o Onboarding (Etapa 1) na categoria informada. */
export async function iniciarOnboarding(leadId: string, categoria: string) {
  await pool.query(
    `UPDATE leads SET em_onboarding = true, onboarding_etapa = 1, onboarding_categoria = $2 WHERE id = $1`,
    [leadId, categoria]
  )
  emitCrmChange()
}

/** Lista os leads em onboarding de uma categoria. */
export async function getOnboardingLeads(categoria: string) {
  const res = await pool.query(
    `SELECT id, nome, whatsapp, email, interesse, classificacao, onboarding_etapa, criado_em
       FROM leads
      WHERE em_onboarding = true AND onboarding_categoria = $1
      ORDER BY criado_em DESC`,
    [categoria]
  )
  return res.rows
}

/** Quantos leads estão na Etapa 1 do onboarding (para o badge "Novo"). */
export async function countOnboardingEtapa1(): Promise<number> {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS n FROM leads WHERE em_onboarding = true AND onboarding_etapa = 1`
  )
  return r.rows[0]?.n ?? 0
}

/** Contagem de leads na Etapa 1 por categoria (legado — não mais usado no menu). */
export async function countOnboardingEtapa1PorCategoria(): Promise<Record<string, number>> {
  const r = await pool.query(
    `SELECT onboarding_categoria AS cat, COUNT(*)::int AS n
       FROM leads
      WHERE em_onboarding = true AND onboarding_etapa = 1 AND onboarding_categoria IS NOT NULL
      GROUP BY onboarding_categoria`
  )
  const out: Record<string, number> = {}
  for (const row of r.rows) out[row.cat] = row.n
  return out
}

// ─── ONBOARDING (checklist) ──────────────────────────────────────────────

export interface OnboardingCliente {
  id: string
  nome: string
  whatsapp: string
  email: string
  interesse: string
  valor_honorario: number | string | null
  onboarding_categoria: string | null
  cliente_id: string | null
  cadastro_completo: boolean
  checks: string[]
}

/** Clientes no onboarding (não concluídos) com os itens já marcados. */
export async function getOnboardingBoard(): Promise<OnboardingCliente[]> {
  const res = await pool.query(
    `SELECT l.* FROM leads l
      WHERE l.em_onboarding = true AND COALESCE(l.onboarding_concluido, false) = false
      ORDER BY l.criado_em ASC`
  )
  const leads = res.rows
  const ids = leads.map(r => r.id)
  if (ids.length === 0) return []

  // Itens já marcados
  const checksByLead: Record<string, string[]> = {}
  const ch = await pool.query(`SELECT lead_id, item_key FROM onboarding_checks WHERE lead_id = ANY($1)`, [ids])
  for (const r of ch.rows) (checksByLead[r.lead_id] ||= []).push(r.item_key)

  // Cadastro do cliente (id + completude)
  const cli = await pool.query(`SELECT * FROM clientes WHERE lead_id = ANY($1)`, [ids])
  const soc = await pool.query(`SELECT * FROM cliente_socios`)
  const sociosByCliente: Record<string, unknown[]> = {}
  for (const s of soc.rows) (sociosByCliente[s.cliente_id] ||= []).push(s)
  const cliByLead: Record<string, Record<string, unknown>> = {}
  for (const c of cli.rows) cliByLead[c.lead_id] = { ...c, socios: sociosByCliente[c.id] || [] }

  return leads.map(l => {
    const c = cliByLead[l.id]
    return {
      id: l.id,
      nome: l.nome,
      whatsapp: l.whatsapp,
      email: l.email,
      interesse: l.interesse,
      valor_honorario: l.valor_honorario ?? null,
      onboarding_categoria: l.onboarding_categoria,
      cliente_id: c ? (c.id as string) : null,
      emp_nome: c ? ((c.emp_nome as string) ?? null) : null,
      emp_cnpj: c ? ((c.emp_cnpj as string) ?? null) : null,
      cadastro_completo: isContratoPronto(c, l),
      checks: checksByLead[l.id] || [],
    }
  })
}

export async function setOnboardingCheck(leadId: string, itemKey: string, done: boolean, byUser: string | null) {
  if (done) {
    await pool.query(
      `INSERT INTO onboarding_checks (lead_id, item_key, done_by) VALUES ($1, $2, $3)
       ON CONFLICT (lead_id, item_key) DO UPDATE SET done_by = $3, done_at = NOW()`,
      [leadId, itemKey, byUser]
    )
  } else {
    await pool.query(`DELETE FROM onboarding_checks WHERE lead_id = $1 AND item_key = $2`, [leadId, itemKey])
  }
  emitCrmChange()
}

export async function concluirOnboarding(leadId: string, valor?: number | null, vencimento?: string | null) {
  await pool.query(
    `UPDATE leads
        SET onboarding_concluido = true,
            financeiro_ativo = true,
            financeiro_status = 'em_aberto',
            valor_honorario = COALESCE($2, valor_honorario),
            honorario_vencimento = $3
      WHERE id = $1`,
    [leadId, valor ?? null, vencimento ?? null]
  )
  emitCrmChange()
}

// ─── FINANCEIRO ──────────────────────────────────────────────────────────

export async function listFinanceiro() {
  const res = await pool.query(
    `SELECT
        l.id AS lead_id, l.nome AS lead_nome, l.whatsapp, l.email,
        l.valor_honorario, l.honorario_vencimento,
        l.origem AS lead_origem, l.interesse AS lead_interesse,
        c.id AS cliente_id, c.emp_nome, c.emp_telefone, c.emp_cidade_estado, c.emp_regime,
        COALESCE(
          (SELECT s.nome_completo FROM cliente_socios s WHERE s.cliente_id = c.id ORDER BY s.ordem ASC LIMIT 1),
          c.cli_nome_completo, l.nome
        ) AS responsavel
     FROM leads l
     LEFT JOIN clientes c ON c.lead_id = l.id
     WHERE l.financeiro_ativo = true`
  )
  const rows = res.rows
  const ids = rows.map(r => r.lead_id)
  if (ids.length === 0) return []

  // Meses pagos por lead
  const pag = await pool.query(`SELECT lead_id, to_char(competencia, 'YYYY-MM') AS comp FROM financeiro_pagamentos WHERE lead_id = ANY($1)`, [ids])
  const pagosByLead: Record<string, Set<string>> = {}
  for (const p of pag.rows) (pagosByLead[p.lead_id] ||= new Set()).add(p.comp)

  // Prazo prometido mais recente (futuro) por lead
  const ev = await pool.query(
    `SELECT DISTINCT ON (lead_id) lead_id, prazo_pagamento
       FROM financeiro_eventos
      WHERE lead_id = ANY($1) AND prazo_pagamento IS NOT NULL AND prazo_pagamento >= CURRENT_DATE
      ORDER BY lead_id, prazo_pagamento ASC`, [ids]
  )
  const prazoByLead: Record<string, string> = {}
  for (const e of ev.rows) prazoByLead[e.lead_id] = e.prazo_pagamento

  return rows.map(r => {
    const calc = calcStatusFinanceiro(r.honorario_vencimento, pagosByLead[r.lead_id] ?? new Set())
    return {
      ...r,
      financeiro_status: calc.status,
      meses_atraso: calc.mesesAtraso,
      proximo_vencimento: calc.proximoVencimento ? calc.proximoVencimento.toISOString().slice(0, 10) : null,
      prazo_prometido: prazoByLead[r.lead_id] ?? null,
    }
  })
}

export async function listPagamentos(leadId: string) {
  const res = await pool.query(
    `SELECT id, to_char(competencia, 'YYYY-MM') AS competencia, valor, pago_em, criado_em
       FROM financeiro_pagamentos WHERE lead_id = $1 ORDER BY competencia DESC`, [leadId]
  )
  return res.rows
}

export async function addPagamento(leadId: string, competencia: string, valor: number | null, pagoEm: string | null) {
  // competencia 'YYYY-MM' -> primeiro dia do mês
  const res = await pool.query(
    `INSERT INTO financeiro_pagamentos (lead_id, competencia, valor, pago_em)
     VALUES ($1, ($2 || '-01')::date, $3, $4) RETURNING id, to_char(competencia,'YYYY-MM') AS competencia, valor, pago_em, criado_em`,
    [leadId, competencia, valor, pagoEm]
  )
  emitCrmChange()
  return res.rows[0]
}

export async function deletePagamento(id: string) {
  await pool.query(`DELETE FROM financeiro_pagamentos WHERE id = $1`, [id])
  emitCrmChange()
}

export async function listEventos(leadId: string) {
  const res = await pool.query(
    `SELECT id, tipo, descricao, prazo_pagamento, autor, criado_em
       FROM financeiro_eventos WHERE lead_id = $1 ORDER BY criado_em DESC`, [leadId]
  )
  return res.rows
}

export async function addEvento(leadId: string, tipo: string, descricao: string, prazo: string | null, autor: string | null) {
  const res = await pool.query(
    `INSERT INTO financeiro_eventos (lead_id, tipo, descricao, prazo_pagamento, autor)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, tipo, descricao, prazo_pagamento, autor, criado_em`,
    [leadId, tipo, descricao, prazo, autor]
  )
  emitCrmChange()
  return res.rows[0]
}

// ─── ATIVIDADES ──────────────────────────────────────────────────────────

export async function addAtividade(leadId: string, descricao: string, autor: string | null) {
  const res = await pool.query(
    `INSERT INTO lead_atividades (lead_id, descricao, autor) VALUES ($1, $2, $3) RETURNING *`,
    [leadId, descricao, autor]
  )
  emitCrmChange()
  return res.rows[0]
}

// ─── LEMBRETES ─────────────────────────────────────────────────────────────

export async function addLembrete(leadId: string, descricao: string, data: string, hora?: string | null) {
  const res = await pool.query(
    `INSERT INTO lead_lembretes (lead_id, descricao, data, hora) VALUES ($1, $2, $3, $4) RETURNING *`,
    [leadId, descricao, data, hora || null]
  )
  emitCrmChange()
  return res.rows[0]
}

export async function toggleLembrete(id: string, concluido: boolean) {
  await pool.query(`UPDATE lead_lembretes SET concluido = $1 WHERE id = $2`, [concluido, id])
  emitCrmChange()
}

export async function deleteLembrete(id: string) {
  await pool.query(`DELETE FROM lead_lembretes WHERE id = $1`, [id])
  emitCrmChange()
}

/** Lembretes pendentes (não concluídos) com nome do lead, p/ notificações. */
export async function getPendingLembretes() {
  const res = await pool.query(
    `SELECT ll.id, ll.lead_id, ll.descricao, ll.data, ll.hora, l.nome AS lead_nome
     FROM lead_lembretes ll
     JOIN leads l ON l.id = ll.lead_id
     WHERE ll.concluido = false
     ORDER BY ll.data ASC`
  )
  return res.rows
}
