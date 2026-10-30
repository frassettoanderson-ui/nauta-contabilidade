import { randomBytes } from 'crypto'
import pool from './db'

// Links avulsos de cadastro: a pessoa preenche a mesma ficha do cliente novo e os dados ficam
// só aqui (Relatórios › Links de cadastro). Não cria cliente, lead nem onboarding.

export interface CadastroLink {
  id: string
  token: string
  destinatario: string
  observacao: string | null
  criado_por: string | null
  criado_em: string
  aberto_em: string | null
  preenchido_em: string | null
  atualizado_em: string | null
  dados?: Record<string, unknown> | null
  senha_gov?: string | null
}

// Senha gov.br dos sócios fica dentro de dados.socios — só sai para a coordenação
function semSenhasSocios(d: Record<string, unknown> | null) {
  if (!d || !Array.isArray(d.socios)) return d
  return { ...d, socios: (d.socios as Record<string, unknown>[]).map(s => { const c = { ...s }; delete c.senha_gov; return c }) }
}

const COLS = `id, token, destinatario, observacao, criado_por, criado_em, aberto_em, preenchido_em, atualizado_em`

export async function listarLinks(empresaId: string | null): Promise<CadastroLink[]> {
  const r = await pool.query(
    `SELECT ${COLS}, dados->>'emp_nome' AS emp_nome, dados->>'cli_nome_completo' AS cli_nome
       FROM cadastro_links WHERE ($1::uuid IS NULL OR empresa_id = $1) ORDER BY criado_em DESC`, [empresaId])
  return r.rows
}

export async function criarLink(empresaId: string | null, destinatario: string, observacao: string | null, criadoPor: string | null) {
  const token = randomBytes(12).toString('base64url')
  const r = await pool.query(
    `INSERT INTO cadastro_links (empresa_id, token, destinatario, observacao, criado_por) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
    [empresaId, token, destinatario, observacao, criadoPor])
  return r.rows[0] as CadastroLink
}

export async function obterLink(id: string, empresaId: string | null, comSenha: boolean) {
  const r = await pool.query(
    `SELECT ${COLS}, dados${comSenha ? ', senha_gov' : ''} FROM cadastro_links WHERE id = $1 AND ($2::uuid IS NULL OR empresa_id = $2)`, [id, empresaId])
  const l = (r.rows[0] ?? null) as CadastroLink | null
  if (l && !comSenha) l.dados = semSenhasSocios(l.dados ?? null)
  return l
}

export async function excluirLink(id: string, empresaId: string | null) {
  await pool.query(`DELETE FROM cadastro_links WHERE id = $1 AND ($2::uuid IS NULL OR empresa_id = $2)`, [id, empresaId])
}

// Público (pelo token): marca a 1ª abertura e devolve o que já foi preenchido (sem a senha gov.br)
export async function abrirPorToken(token: string) {
  const r = await pool.query(
    `UPDATE cadastro_links SET aberto_em = COALESCE(aberto_em, now()) WHERE token = $1 RETURNING dados`, [token])
  if (!r.rows[0]) return null
  return (semSenhasSocios(r.rows[0].dados) ?? {}) as Record<string, unknown>
}

export async function salvarPorToken(token: string, dados: Record<string, unknown>, senhaGov: string) {
  // Sócio que reenviar com a senha gov.br em branco mantém a que já estava salva
  const ant = (await pool.query(`SELECT dados FROM cadastro_links WHERE token = $1`, [token])).rows[0]?.dados as Record<string, unknown> | null
  if (Array.isArray(dados.socios) && Array.isArray(ant?.socios)) {
    const antigos = ant!.socios as Record<string, unknown>[]
    dados.socios = (dados.socios as Record<string, unknown>[]).map((s, i) => (s && !s.senha_gov && antigos[i]?.senha_gov) ? { ...s, senha_gov: antigos[i].senha_gov } : s)
  }
  const r = await pool.query(
    `UPDATE cadastro_links
        SET dados = $2, senha_gov = COALESCE(NULLIF($3, ''), senha_gov),
            preenchido_em = COALESCE(preenchido_em, now()), atualizado_em = now()
      WHERE token = $1 RETURNING id`, [token, JSON.stringify(dados), senhaGov])
  return !!r.rows[0]
}
