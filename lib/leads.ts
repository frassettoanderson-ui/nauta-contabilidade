import pool from './db'
import { isCadastroCompleto } from './cadastro'
import { emitCrmChange } from './realtime'

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
}) {
  const res = await pool.query(
    `INSERT INTO leads (nome, whatsapp, email, interesse, etapa, classificacao, responsavel_id, responsavel_nome)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [lead.nome, lead.whatsapp, lead.email, lead.interesse, lead.etapa ?? 'novo', lead.classificacao ?? 0,
     lead.responsavel_id ?? null, lead.responsavel_nome ?? null]
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
        WHERE ll.lead_id = l.id AND ll.concluido = false AND ll.data <= CURRENT_DATE) AS lembretes_pendentes
     FROM leads l
     ${verTodos ? '' : 'WHERE l.responsavel_id = $1'}
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
    l.cadastro_completo = isCadastroCompleto(c)
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

export async function updateLead(id: string, fields: Partial<{ nome: string; whatsapp: string; email: string; interesse: string; etapa: string; classificacao: number }>) {
  const keys = Object.keys(fields)
  if (keys.length === 0) return
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = keys.map(k => (fields as Record<string, unknown>)[k])
  await pool.query(`UPDATE leads SET ${sets} WHERE id = $1`, [id, ...values])
  emitCrmChange()
}

export async function deleteLead(id: string) {
  await pool.query(`DELETE FROM leads WHERE id = $1`, [id])
  emitCrmChange()
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
