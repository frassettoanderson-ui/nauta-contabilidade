import pool from './db'

// ─── Data de abertura do CNPJ (início de atividade na Receita) ──────────────
// Buscada nas APIs públicas (minhareceita → BrasilAPI) e guardada em clientes.emp_data_abertura,
// junto com o CNPJ consultado (emp_data_abertura_cnpj): se o CNPJ mudar, consulta de novo.

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const tentados = new Set<string>() // evita reconsultar o mesmo CNPJ sem sucesso no mesmo processo

async function getJson(url: string) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'obrigo-erp' } })
    return r.ok ? await r.json() : null
  } catch { return null } finally { clearTimeout(t) }
}

export async function consultarDataAbertura(cnpj: string): Promise<string | null> {
  const d = digits(cnpj)
  if (d.length !== 14) return null
  for (const url of [`https://minhareceita.org/${d}`, `https://brasilapi.com.br/api/cnpj/v1/${d}`]) {
    const j = await getJson(url)
    const data = j?.data_inicio_atividade
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}/.test(data)) return data.slice(0, 10)
  }
  return null
}

/** Preenche em segundo plano a data de abertura dos clientes cujo CNPJ ainda não foi consultado. */
export function preencherDatasAbertura(clientes: { id: string; emp_cnpj: unknown; emp_data_abertura_cnpj?: unknown }[]) {
  const pendentes = clientes.filter(c => {
    const d = digits(c.emp_cnpj)
    return d.length === 14 && digits(c.emp_data_abertura_cnpj) !== d && !tentados.has(d)
  })
  if (!pendentes.length) return
  void (async () => {
    for (const c of pendentes) {
      const d = digits(c.emp_cnpj)
      tentados.add(d)
      const data = await consultarDataAbertura(d)
      if (data) await pool.query(`UPDATE clientes SET emp_data_abertura = $2, emp_data_abertura_cnpj = $3 WHERE id = $1`, [c.id, data, d]).catch(() => {})
      await new Promise(r => setTimeout(r, 1200)) // gentil com as APIs públicas
    }
  })()
}
