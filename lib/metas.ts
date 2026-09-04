import pool from './db'

// Competência = 1º dia do mês (YYYY-MM-01). Guardamos a meta de clientes por mês/empresa.
function mkCompetencia(competencia?: string): string {
  if (competencia && /^\d{4}-\d{2}/.test(competencia)) return `${competencia.slice(0, 7)}-01`
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export async function getMeta(empresaId: string, competencia?: string): Promise<{ competencia: string; metaClientes: number }> {
  const comp = mkCompetencia(competencia)
  const r = await pool.query(
    `SELECT to_char(competencia,'YYYY-MM') AS comp, meta_clientes FROM metas WHERE empresa_id = $1 AND competencia = $2 LIMIT 1`,
    [empresaId, comp]
  )
  return { competencia: comp.slice(0, 7), metaClientes: Number(r.rows[0]?.meta_clientes ?? 0) }
}

export async function setMeta(empresaId: string, competencia: string, metaClientes: number): Promise<{ ok: true }> {
  const comp = mkCompetencia(competencia)
  await pool.query(
    `INSERT INTO metas (empresa_id, competencia, meta_clientes)
       VALUES ($1, $2, $3)
     ON CONFLICT (empresa_id, competencia)
       DO UPDATE SET meta_clientes = EXCLUDED.meta_clientes, atualizado_em = now()`,
    [empresaId, comp, Math.max(0, Math.round(Number(metaClientes) || 0))]
  )
  return { ok: true }
}
