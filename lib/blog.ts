import pool from './db'
import type { Categoria, Tag, Post, PostWithRelations, PaginatedPosts } from '@/types/blog'

// ─── PUBLIC ────────────────────────────────────────────────────────────────

export async function getPosts({
  page = 1,
  perPage = 9,
  categoria,
  search,
}: {
  page?: number
  perPage?: number
  categoria?: string
  search?: string
} = {}): Promise<PaginatedPosts> {
  const offset = (page - 1) * perPage
  const params: any[] = ['publicado']
  let where = 'p.status = $1'
  let idx = 2

  if (categoria) {
    where += ` AND c.slug = $${idx++}`
    params.push(categoria)
  }
  if (search) {
    where += ` AND (p.titulo ILIKE $${idx} OR p.resumo ILIKE $${idx})`
    params.push(`%${search}%`)
    idx++
  }

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM posts p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE ${where}`,
    params
  )
  const total = parseInt(countRes.rows[0].count)

  const res = await pool.query(
    `SELECT p.*, c.id as cat_id, c.nome as cat_nome, c.slug as cat_slug
     FROM posts p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     WHERE ${where}
     ORDER BY p.criado_em DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, perPage, offset]
  )

  const posts = await Promise.all(res.rows.map(async (row) => {
    const tagsRes = await pool.query(
      `SELECT t.* FROM tags t JOIN posts_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1`,
      [row.id]
    )
    return rowToPost(row, tagsRes.rows)
  }))

  return { posts, total, page, perPage, totalPages: Math.ceil(total / perPage) }
}

export async function getPostBySlug(slug: string): Promise<PostWithRelations | null> {
  const res = await pool.query(
    `SELECT p.*, c.id as cat_id, c.nome as cat_nome, c.slug as cat_slug
     FROM posts p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     WHERE p.slug = $1 AND p.status = 'publicado'`,
    [slug]
  )
  if (!res.rows[0]) return null
  const tagsRes = await pool.query(
    `SELECT t.* FROM tags t JOIN posts_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1`,
    [res.rows[0].id]
  )
  return rowToPost(res.rows[0], tagsRes.rows)
}

export async function getRelatedPosts(postId: string, categoriaId: string | null): Promise<PostWithRelations[]> {
  const res = await pool.query(
    `SELECT p.*, c.id as cat_id, c.nome as cat_nome, c.slug as cat_slug
     FROM posts p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     WHERE p.status = 'publicado' AND p.id != $1 AND p.categoria_id = $2
     ORDER BY p.criado_em DESC LIMIT 3`,
    [postId, categoriaId]
  )
  return Promise.all(res.rows.map(async (row) => {
    const tagsRes = await pool.query(
      `SELECT t.* FROM tags t JOIN posts_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1`,
      [row.id]
    )
    return rowToPost(row, tagsRes.rows)
  }))
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  const res = await pool.query(`SELECT slug FROM posts WHERE status = 'publicado'`)
  return res.rows.map((r) => r.slug)
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await pool.query(`SELECT * FROM categorias ORDER BY nome`)
  return res.rows
}

export async function getTags(): Promise<Tag[]> {
  const res = await pool.query(`SELECT * FROM tags ORDER BY nome`)
  return res.rows
}

// ─── ADMIN ─────────────────────────────────────────────────────────────────

export async function adminGetPosts(): Promise<PostWithRelations[]> {
  const res = await pool.query(
    `SELECT p.*, c.id as cat_id, c.nome as cat_nome, c.slug as cat_slug
     FROM posts p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     ORDER BY p.criado_em DESC`
  )
  return Promise.all(res.rows.map(async (row) => {
    const tagsRes = await pool.query(
      `SELECT t.* FROM tags t JOIN posts_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1`,
      [row.id]
    )
    return rowToPost(row, tagsRes.rows)
  }))
}

export async function adminGetPost(id: string): Promise<PostWithRelations | null> {
  const res = await pool.query(
    `SELECT p.*, c.id as cat_id, c.nome as cat_nome, c.slug as cat_slug
     FROM posts p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     WHERE p.id = $1`,
    [id]
  )
  if (!res.rows[0]) return null
  const tagsRes = await pool.query(
    `SELECT t.* FROM tags t JOIN posts_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1`,
    [id]
  )
  return rowToPost(res.rows[0], tagsRes.rows)
}

export async function adminSavePost(data: Partial<Post> & { tagIds?: string[] }): Promise<Post> {
  const { tagIds = [], ...post } = data
  const now = new Date().toISOString()

  if (post.id) {
    const res = await pool.query(
      `UPDATE posts SET titulo=$1, slug=$2, resumo=$3, conteudo=$4, imagem_destaque=$5,
       autor=$6, categoria_id=$7, status=$8, atualizado_em=$9 WHERE id=$10 RETURNING *`,
      [post.titulo, post.slug, post.resumo, post.conteudo, post.imagem_destaque,
       post.autor, post.categoria_id, post.status, now, post.id]
    )
    await syncTags(post.id, tagIds)
    return res.rows[0]
  } else {
    const res = await pool.query(
      `INSERT INTO posts (titulo, slug, resumo, conteudo, imagem_destaque, autor, categoria_id, status, criado_em, atualizado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *`,
      [post.titulo, post.slug, post.resumo, post.conteudo, post.imagem_destaque,
       post.autor || 'Equipe Nauta', post.categoria_id, post.status || 'rascunho', now]
    )
    await syncTags(res.rows[0].id, tagIds)
    return res.rows[0]
  }
}

export async function adminDeletePost(id: string): Promise<void> {
  await pool.query(`DELETE FROM posts WHERE id = $1`, [id])
}

export async function adminToggleStatus(id: string, status: 'rascunho' | 'publicado'): Promise<void> {
  await pool.query(`UPDATE posts SET status=$1, atualizado_em=$2 WHERE id=$3`, [status, new Date().toISOString(), id])
}

export async function adminSaveTag(data: Partial<Tag>): Promise<Tag> {
  if (data.id) {
    const res = await pool.query(`UPDATE tags SET nome=$1, slug=$2 WHERE id=$3 RETURNING *`, [data.nome, data.slug, data.id])
    return res.rows[0]
  }
  const res = await pool.query(`INSERT INTO tags (nome, slug) VALUES ($1,$2) RETURNING *`, [data.nome, data.slug])
  return res.rows[0]
}

export async function adminDeleteTag(id: string): Promise<void> {
  await pool.query(`DELETE FROM tags WHERE id = $1`, [id])
}

export async function adminSaveCategoria(data: Partial<Categoria>): Promise<Categoria> {
  if (data.id) {
    const res = await pool.query(`UPDATE categorias SET nome=$1, slug=$2 WHERE id=$3 RETURNING *`, [data.nome, data.slug, data.id])
    return res.rows[0]
  }
  const res = await pool.query(`INSERT INTO categorias (nome, slug) VALUES ($1,$2) RETURNING *`, [data.nome, data.slug])
  return res.rows[0]
}

export async function adminDeleteCategoria(id: string): Promise<void> {
  await pool.query(`DELETE FROM categorias WHERE id = $1`, [id])
}

// ─── HELPERS ───────────────────────────────────────────────────────────────

async function syncTags(postId: string, tagIds: string[]) {
  await pool.query(`DELETE FROM posts_tags WHERE post_id = $1`, [postId])
  for (const tagId of tagIds) {
    await pool.query(`INSERT INTO posts_tags (post_id, tag_id) VALUES ($1,$2)`, [postId, tagId])
  }
}

function rowToPost(row: any, tags: any[]): PostWithRelations {
  return {
    id: row.id,
    titulo: row.titulo,
    slug: row.slug,
    resumo: row.resumo,
    conteudo: row.conteudo,
    imagem_destaque: row.imagem_destaque,
    autor: row.autor,
    categoria_id: row.categoria_id,
    categoria: row.cat_id ? { id: row.cat_id, nome: row.cat_nome, slug: row.cat_slug } : null,
    tags: tags.map(t => ({ id: t.id, nome: t.nome, slug: t.slug })),
    status: row.status,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  }
}
