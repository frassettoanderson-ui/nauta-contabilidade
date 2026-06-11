import pool from './db'
import { emitCrmChange } from './realtime'

const CLI_COLS = [
  'cli_nome_completo', 'cli_rg', 'cli_cpf', 'cli_nascimento', 'cli_nome_pai', 'cli_nome_mae',
  'cli_estado_civil', 'cli_recibo_irpf', 'cli_titulo_eleitor', 'cli_email', 'cli_endereco', 'cli_bairro', 'cli_cidade_estado', 'cli_cep',
  'cli_doc_url', 'cli_cert_url', 'cli_cert_senha',
  'emp_nome', 'emp_fantasia', 'emp_cnpj', 'emp_regime', 'emp_endereco', 'emp_bairro', 'emp_cidade_estado', 'emp_cep',
  'emp_area_ocupada', 'emp_edificacao', 'emp_usa_glp',
  'emp_proprietario_nome', 'emp_proprietario_cpf', 'emp_atividade', 'emp_capital_social', 'emp_telefone', 'emp_email',
]

const SOCIO_COLS = [
  'nome_completo', 'rg', 'cpf', 'nascimento', 'nome_pai', 'nome_mae', 'participacao',
  'estado_civil', 'recibo_irpf', 'titulo_eleitor', 'doc_url', 'cert_url', 'cert_senha',
]

type AnyObj = Record<string, unknown>

export async function listClientes() {
  const res = await pool.query(
    `SELECT
        c.id, c.lead_id, c.emp_nome, c.emp_telefone, c.emp_cidade_estado, c.emp_regime, c.criado_em,
        COALESCE(
          (SELECT s.nome_completo FROM cliente_socios s
            WHERE s.cliente_id = c.id ORDER BY s.ordem ASC LIMIT 1),
          c.cli_nome_completo
        ) AS responsavel,
        l.origem    AS lead_origem,
        l.interesse AS lead_interesse
     FROM clientes c
     LEFT JOIN leads l ON l.id = c.lead_id
     ORDER BY c.criado_em DESC`
  )
  return res.rows
}

export async function getClienteByLead(leadId: string) {
  const res = await pool.query(`SELECT id FROM clientes WHERE lead_id = $1 LIMIT 1`, [leadId])
  if (!res.rows[0]) return null
  return getCliente(res.rows[0].id)
}

export async function getCliente(id: string) {
  const c = await pool.query(`SELECT * FROM clientes WHERE id = $1`, [id])
  if (!c.rows[0]) return null
  const s = await pool.query(`SELECT * FROM cliente_socios WHERE cliente_id = $1 ORDER BY ordem ASC`, [id])
  return { ...c.rows[0], socios: s.rows }
}

// Converte string vazia/undefined em null (evita erro em colunas numéricas/boolean)
const norm = (v: unknown) => (v === '' || v === undefined ? null : v)

export async function saveCliente(payload: AnyObj & { id?: string; lead_id?: string; socios?: AnyObj[] }) {
  const cliData = CLI_COLS.map(c => norm(payload[c]))
  let clienteId = payload.id as string | undefined

  if (clienteId) {
    const sets = CLI_COLS.map((c, i) => `${c} = $${i + 2}`).join(', ')
    await pool.query(`UPDATE clientes SET ${sets}, atualizado_em = NOW() WHERE id = $1`, [clienteId, ...cliData])
  } else {
    const cols = ['lead_id', ...CLI_COLS]
    const ph = cols.map((_, i) => `$${i + 1}`).join(', ')
    const res = await pool.query(
      `INSERT INTO clientes (${cols.join(', ')}) VALUES (${ph}) RETURNING id`,
      [payload.lead_id ?? null, ...cliData]
    )
    clienteId = res.rows[0].id
  }

  // Regrava sócios
  await pool.query(`DELETE FROM cliente_socios WHERE cliente_id = $1`, [clienteId])
  const socios = payload.socios ?? []
  for (let i = 0; i < socios.length; i++) {
    const s = socios[i]
    // pula sócio totalmente vazio
    if (!s.nome_completo && !s.cpf) continue
    const cols = ['cliente_id', 'ordem', ...SOCIO_COLS]
    const vals = [clienteId, i + 1, ...SOCIO_COLS.map(c => norm(s[c]))]
    const ph = cols.map((_, j) => `$${j + 1}`).join(', ')
    await pool.query(`INSERT INTO cliente_socios (${cols.join(', ')}) VALUES (${ph})`, vals)
  }

  emitCrmChange()
  return clienteId
}

export async function deleteCliente(id: string) {
  await pool.query(`DELETE FROM clientes WHERE id = $1`, [id])
  emitCrmChange()
}

export async function generateLinkToken(id: string): Promise<string> {
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
  await pool.query(`UPDATE clientes SET link_token = $1 WHERE id = $2`, [token, id])
  return token
}

export async function getClienteByToken(token: string) {
  const res = await pool.query(`SELECT id FROM clientes WHERE link_token = $1 LIMIT 1`, [token])
  if (!res.rows[0]) return null
  return getCliente(res.rows[0].id)
}
