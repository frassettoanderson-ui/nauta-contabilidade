import pool from './db'

// ─── Categorias de serviço avulso (para Lançar Entrada) ──────────────────────
export async function listCategoriasServico() {
  const r = await pool.query(`SELECT id, nome FROM fin_categorias_servico ORDER BY nome ASC`)
  return r.rows
}
export async function addCategoriaServico(nome: string) {
  const r = await pool.query(`INSERT INTO fin_categorias_servico (nome) VALUES ($1) RETURNING id, nome`, [nome])
  return r.rows[0]
}
export async function deleteCategoriaServico(id: string) {
  await pool.query(`DELETE FROM fin_categorias_servico WHERE id = $1`, [id])
}

// ─── Lançamentos (entrada/despesa) ───────────────────────────────────────────
export async function listLancamentos(tipo: string) {
  const r = await pool.query(
    `SELECT id, tipo, categoria, descricao, cliente_nome, valor, data, autor, criado_em
       FROM fin_lancamentos WHERE tipo = $1 ORDER BY data DESC NULLS LAST, criado_em DESC`,
    [tipo]
  )
  return r.rows
}
export async function addLancamento(l: { tipo: string; categoria?: string; descricao?: string; cliente_nome?: string; valor?: number | null; data?: string | null; autor?: string | null }) {
  const r = await pool.query(
    `INSERT INTO fin_lancamentos (tipo, categoria, descricao, cliente_nome, valor, data, autor)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [l.tipo, l.categoria ?? null, l.descricao ?? null, l.cliente_nome ?? null, l.valor ?? null, l.data ?? null, l.autor ?? null]
  )
  return r.rows[0]
}
export async function deleteLancamento(id: string) {
  await pool.query(`DELETE FROM fin_lancamentos WHERE id = $1`, [id])
}

// ─── Despesas fixas ──────────────────────────────────────────────────────────
export async function listDespesasFixas() {
  const r = await pool.query(`SELECT id, descricao, categoria, valor, dia_vencimento, ativo FROM fin_despesas_fixas ORDER BY dia_vencimento ASC NULLS LAST, descricao ASC`)
  return r.rows
}
export async function addDespesaFixa(d: { descricao: string; categoria?: string; valor?: number | null; dia_vencimento?: number | null }) {
  const r = await pool.query(
    `INSERT INTO fin_despesas_fixas (descricao, categoria, valor, dia_vencimento) VALUES ($1, $2, $3, $4) RETURNING *`,
    [d.descricao, d.categoria ?? null, d.valor ?? null, d.dia_vencimento ?? null]
  )
  return r.rows[0]
}
export async function toggleDespesaFixa(id: string, ativo: boolean) {
  await pool.query(`UPDATE fin_despesas_fixas SET ativo = $2 WHERE id = $1`, [id, ativo])
}
export async function deleteDespesaFixa(id: string) {
  await pool.query(`DELETE FROM fin_despesas_fixas WHERE id = $1`, [id])
}
