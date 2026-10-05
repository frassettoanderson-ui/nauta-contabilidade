import pool from './db'

// ─── Sugestões de alteração do sistema ───────────────────────────────────────
// Qualquer usuário abre uma solicitação (pendente); só o admin conclui, não aprova ou reabre.

export type StatusSugestao = 'pendente' | 'concluida' | 'nao_aprovada'

const COLS = `id, titulo, area, descricao, status, autor_id, autor_nome, resposta, resolvido_por,
  to_char(resolvido_em, 'YYYY-MM-DD"T"HH24:MI:SS') AS resolvido_em,
  to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SS') AS criado_em`

export async function listSugestoes() {
  const r = await pool.query(`SELECT ${COLS} FROM sugestoes ORDER BY criado_em DESC`)
  return r.rows
}

export async function addSugestao(d: { titulo: string; area?: string; descricao: string; autorId?: string; autorNome?: string }) {
  const r = await pool.query(
    `INSERT INTO sugestoes (titulo, area, descricao, autor_id, autor_nome) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
    [d.titulo.trim(), d.area?.trim() || null, d.descricao.trim(), d.autorId ?? null, d.autorNome ?? null]
  )
  return r.rows[0]
}

export async function resolverSugestao(id: string, status: StatusSugestao, resposta: string | null, por: string) {
  const r = await pool.query(
    status === 'pendente'
      ? `UPDATE sugestoes SET status = 'pendente', resposta = NULL, resolvido_por = NULL, resolvido_em = NULL WHERE id = $1 RETURNING ${COLS}`
      : `UPDATE sugestoes SET status = $2, resposta = $3, resolvido_por = $4, resolvido_em = now() WHERE id = $1 RETURNING ${COLS}`,
    status === 'pendente' ? [id] : [id, status, resposta?.trim() || null, por]
  )
  return r.rows[0] ?? null
}

/** Exclui uma sugestão pendente — o próprio autor ou o admin. */
export async function deleteSugestao(id: string, userId: string, admin: boolean) {
  const r = await pool.query(
    `DELETE FROM sugestoes WHERE id = $1 AND status = 'pendente' AND ($3 OR autor_id = $2)`,
    [id, userId, admin]
  )
  return (r.rowCount ?? 0) > 0
}
