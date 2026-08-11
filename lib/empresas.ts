import pool from './db'

export type Empresa = {
  id: string
  slug: string
  nome: string
  cor_accent: string
  logo_url: string | null
  logo_branca_url: string | null
}

/** Empresas que um usuário pode acessar (para o seletor e o escopo de dados). */
export async function getEmpresasDoUsuario(userId: string): Promise<Empresa[]> {
  const r = await pool.query(
    `SELECT e.id, e.slug, e.nome, e.cor_accent, e.logo_url, e.logo_branca_url
       FROM empresas e
       JOIN usuario_empresas ue ON ue.empresa_id = e.id
      WHERE ue.admin_user_id = $1 AND e.ativo = TRUE
      ORDER BY e.ordem, e.nome`,
    [userId]
  )
  return r.rows
}

/** Todas as empresas (para a tela de Usuários / administração). */
export async function getEmpresas(): Promise<Empresa[]> {
  const r = await pool.query(
    `SELECT id, slug, nome, cor_accent, logo_url, logo_branca_url
       FROM empresas WHERE ativo = TRUE ORDER BY ordem, nome`
  )
  return r.rows
}
