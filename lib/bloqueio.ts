import pool from './db'

// Contatos bloqueados no site (formulário de contato e chat): telefone (só dígitos, sem DDI) ou e-mail.
// O bloqueado não é avisado: o formulário responde como se tivesse enviado, mas nada é gravado.
// Tabela: supabase/crm32-contatos-bloqueados.sql
const fone = (v?: string | null) => {
  let d = String(v ?? '').replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  return d.length >= 10 ? d : ''
}
const email = (v?: string | null) => String(v ?? '').trim().toLowerCase()

export async function contatoBloqueado(c: { telefone?: string | null; email?: string | null; contato?: string | null }): Promise<boolean> {
  const fones = [fone(c.telefone), fone(c.contato)].filter(Boolean)
  const emails = [email(c.email), c.contato?.includes('@') ? email(c.contato) : ''].filter(Boolean)
  if (!fones.length && !emails.length) return false
  const r = await pool.query(
    `SELECT 1 FROM contatos_bloqueados WHERE (tipo = 'fone' AND valor = ANY($1)) OR (tipo = 'email' AND valor = ANY($2)) LIMIT 1`,
    [fones, emails]
  )
  return r.rowCount! > 0
}
