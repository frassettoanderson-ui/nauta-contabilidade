import pool from './db'

export type Lead = {
  id?: string
  nome: string
  whatsapp: string
  email: string
  interesse: string
  criado_em?: string
}

export async function insertLead(lead: Omit<Lead, 'id' | 'criado_em'>) {
  const res = await pool.query(
    `INSERT INTO leads (nome, whatsapp, email, interesse) VALUES ($1, $2, $3, $4) RETURNING *`,
    [lead.nome, lead.whatsapp, lead.email, lead.interesse]
  )
  return res.rows[0]
}

export async function getLeads(): Promise<Lead[]> {
  const res = await pool.query(`SELECT * FROM leads ORDER BY criado_em DESC`)
  return res.rows
}
