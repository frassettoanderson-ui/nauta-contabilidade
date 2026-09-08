import pool from './db'

// Contas a pagar: boletos de fornecedores e contas com vencimento. Ao marcar como paga,
// gera automaticamente uma DESPESA no fluxo de caixa (fin_lancamentos).

export interface ContaPagar {
  id: string; descricao: string; fornecedor: string | null; categoria: string | null
  valor: number; vencimento: string | null; pago: boolean; pago_em: string | null
  observacao: string | null; lancamento_id: string | null
}

export async function listContasPagar(empresaId: string): Promise<ContaPagar[]> {
  const r = await pool.query(
    `SELECT id, descricao, fornecedor, categoria, valor,
            to_char(vencimento,'YYYY-MM-DD') AS vencimento, pago,
            to_char(pago_em,'YYYY-MM-DD') AS pago_em, observacao, lancamento_id
       FROM fin_contas_pagar
      WHERE empresa_id = $1 OR empresa_id IS NULL
      ORDER BY pago ASC, vencimento ASC NULLS LAST, criado_em DESC`,
    [empresaId]
  )
  return r.rows.map(x => ({ ...x, valor: Number(x.valor) }))
}

export async function addContaPagar(empresaId: string, c: {
  descricao: string; fornecedor?: string; categoria?: string; valor: number; vencimento?: string | null; observacao?: string
}): Promise<ContaPagar> {
  const r = await pool.query(
    `INSERT INTO fin_contas_pagar (empresa_id, descricao, fornecedor, categoria, valor, vencimento, observacao)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [empresaId, c.descricao, c.fornecedor ?? null, c.categoria ?? null, Number(c.valor) || 0, c.vencimento || null, c.observacao ?? null]
  )
  return (await listContasPagar(empresaId)).find(x => x.id === r.rows[0].id)!
}

export async function updateContaPagar(empresaId: string, id: string, c: {
  descricao?: string; fornecedor?: string; categoria?: string; valor?: number; vencimento?: string | null; observacao?: string
}) {
  const campos: string[] = []; const vals: unknown[] = [id, empresaId]
  const set = (col: string, v: unknown) => { vals.push(v); campos.push(`${col} = $${vals.length}`) }
  if (c.descricao !== undefined) set('descricao', c.descricao)
  if (c.fornecedor !== undefined) set('fornecedor', c.fornecedor)
  if (c.categoria !== undefined) set('categoria', c.categoria)
  if (c.valor !== undefined) set('valor', Number(c.valor) || 0)
  if (c.vencimento !== undefined) set('vencimento', c.vencimento || null)
  if (c.observacao !== undefined) set('observacao', c.observacao)
  if (!campos.length) return { ok: true }
  await pool.query(`UPDATE fin_contas_pagar SET ${campos.join(', ')}, atualizado_em = now() WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)`, vals)
  return { ok: true }
}

// Marca como paga → cria a despesa no fluxo de caixa
export async function pagarContaPagar(empresaId: string, id: string, pagoEm: string) {
  const c = (await pool.query(`SELECT * FROM fin_contas_pagar WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)`, [id, empresaId])).rows[0]
  if (!c) throw new Error('Conta não encontrada')
  if (c.pago) return { ok: true }
  const desc = c.fornecedor ? `${c.descricao} — ${c.fornecedor}` : c.descricao
  const lanc = await pool.query(
    `INSERT INTO fin_lancamentos (tipo, categoria, descricao, cliente_nome, valor, data, autor, empresa_id, origem, origem_ref)
     VALUES ('despesa', $1, $2, $3, $4, $5, 'Contas a pagar', COALESCE($6,(SELECT id FROM empresas WHERE slug='nauta')), 'conta_pagar', $7) RETURNING id`,
    [c.categoria || 'Contas a pagar', desc, c.fornecedor ?? null, Number(c.valor) || 0, pagoEm, c.empresa_id, id]
  )
  await pool.query(`UPDATE fin_contas_pagar SET pago = true, pago_em = $2, lancamento_id = $3, atualizado_em = now() WHERE id = $1`, [id, pagoEm, lanc.rows[0].id])
  return { ok: true }
}

// Desfaz o pagamento → remove a despesa gerada
export async function desmarcarContaPagar(empresaId: string, id: string) {
  const c = (await pool.query(`SELECT lancamento_id FROM fin_contas_pagar WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)`, [id, empresaId])).rows[0]
  if (!c) throw new Error('Conta não encontrada')
  if (c.lancamento_id) await pool.query(`DELETE FROM fin_lancamentos WHERE id = $1`, [c.lancamento_id])
  await pool.query(`UPDATE fin_contas_pagar SET pago = false, pago_em = NULL, lancamento_id = NULL, atualizado_em = now() WHERE id = $1`, [id])
  return { ok: true }
}

export async function deleteContaPagar(empresaId: string, id: string) {
  const c = (await pool.query(`SELECT lancamento_id FROM fin_contas_pagar WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)`, [id, empresaId])).rows[0]
  if (c?.lancamento_id) await pool.query(`DELETE FROM fin_lancamentos WHERE id = $1`, [c.lancamento_id])
  await pool.query(`DELETE FROM fin_contas_pagar WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)`, [id, empresaId])
  return { ok: true }
}
