import { supabase } from './supabase'
import type { PostWithRelations, PaginatedPosts, Categoria, Tag } from '@/types/blog'

const PER_PAGE = 10

/* ─── Helpers ─────────────────────────────────── */

/** Busca tags de um array de posts de uma vez (N+1 free) */
async function attachTags(posts: PostWithRelations[]): Promise<PostWithRelations[]> {
  if (!posts.length) return posts
  const ids = posts.map(p => p.id)
  const { data } = await supabase
    .from('posts_tags')
    .select('post_id, tags(id, nome, slug)')
    .in('post_id', ids)
  const map: Record<string, Tag[]> = {}
  ;(data ?? []).forEach((row: { post_id: string; tags: Tag | Tag[] | null }) => {
    if (!map[row.post_id]) map[row.post_id] = []
    const t = row.tags
    if (t) {
      if (Array.isArray(t)) map[row.post_id].push(...t)
      else map[row.post_id].push(t)
    }
  })
  return posts.map(p => ({ ...p, tags: map[p.id] ?? [] }))
}

/* ─── Listagem pública ─────────────────────────── */

export async function getPosts({
  page = 1,
  categoria,
  busca,
}: {
  page?: number
  categoria?: string
  busca?: string
} = {}): Promise<PaginatedPosts> {
  const from = (page - 1) * PER_PAGE
  const to   = from + PER_PAGE - 1

  let query = supabase
    .from('posts')
    .select('*, categoria:categorias(id,nome,slug)', { count: 'exact' })
    .eq('status', 'publicado')
    .order('criado_em', { ascending: false })
    .range(from, to)

  if (categoria) {
    const { data: cat } = await supabase.from('categorias').select('id').eq('slug', categoria).single()
    if (cat) query = query.eq('categoria_id', cat.id)
  }

  if (busca) {
    query = query.or(`titulo.ilike.%${busca}%,resumo.ilike.%${busca}%`)
  }

  const { data, count, error } = await query
  if (error) throw error

  const posts = await attachTags((data ?? []) as PostWithRelations[])
  return {
    posts,
    total: count ?? 0,
    page,
    perPage: PER_PAGE,
    totalPages: Math.ceil((count ?? 0) / PER_PAGE),
  }
}

export async function getPostBySlug(slug: string): Promise<PostWithRelations | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, categoria:categorias(id,nome,slug)')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .single()
  if (error || !data) return null
  const [post] = await attachTags([data as PostWithRelations])
  return post
}

export async function getRelatedPosts(categoriaId: string, excludeId: string): Promise<PostWithRelations[]> {
  const { data } = await supabase
    .from('posts')
    .select('*, categoria:categorias(id,nome,slug)')
    .eq('status', 'publicado')
    .eq('categoria_id', categoriaId)
    .neq('id', excludeId)
    .order('criado_em', { ascending: false })
    .limit(3)
  return await attachTags((data ?? []) as PostWithRelations[])
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  const { data } = await supabase.from('posts').select('slug').eq('status', 'publicado')
  return (data ?? []).map(p => p.slug)
}

/* ─── Categorias ───────────────────────────────── */

export async function getCategorias(): Promise<Categoria[]> {
  const { data } = await supabase.from('categorias').select('*').order('nome')
  return (data ?? []) as Categoria[]
}

/* ─── Admin — CRUD completo (autenticado) ────────── */

export async function adminGetPosts(status?: 'rascunho' | 'publicado') {
  let q = supabase
    .from('posts')
    .select('*, categoria:categorias(id,nome,slug)')
    .order('criado_em', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as PostWithRelations[]
}

export async function adminGetPost(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, categoria:categorias(id,nome,slug)')
    .eq('id', id)
    .single()
  if (error || !data) return null
  // Tags
  const { data: pt } = await supabase
    .from('posts_tags')
    .select('tags(id,nome,slug)')
    .eq('post_id', id)
  const tags = (pt ?? []).map((r: { tags: Tag | Tag[] | null }) => {
    const t = r.tags
    if (!t) return null
    return Array.isArray(t) ? t[0] : t
  }).filter(Boolean) as Tag[]
  return { ...(data as PostWithRelations), tags }
}

export async function adminSavePost(post: Partial<PostWithRelations> & { tagIds?: string[] }) {
  const { tagIds, tags, categoria, ...fields } = post

  if (post.id) {
    // UPDATE
    const { data, error } = await supabase
      .from('posts')
      .update({ ...fields, atualizado_em: new Date().toISOString() })
      .eq('id', post.id)
      .select()
      .single()
    if (error) throw error
    // Sync tags
    if (tagIds !== undefined) {
      await supabase.from('posts_tags').delete().eq('post_id', post.id)
      if (tagIds.length) {
        await supabase.from('posts_tags').insert(tagIds.map(tid => ({ post_id: post.id, tag_id: tid })))
      }
    }
    return data
  } else {
    // INSERT
    const { data, error } = await supabase
      .from('posts')
      .insert([fields])
      .select()
      .single()
    if (error) throw error
    if (tagIds?.length) {
      await supabase.from('posts_tags').insert(tagIds.map(tid => ({ post_id: data.id, tag_id: tid })))
    }
    return data
  }
}

export async function adminDeletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

export async function adminToggleStatus(id: string, current: 'rascunho' | 'publicado') {
  const next = current === 'publicado' ? 'rascunho' : 'publicado'
  const { error } = await supabase.from('posts').update({ status: next }).eq('id', id)
  if (error) throw error
  return next
}

/* ─── Tags ─────────────────────────────────────── */

export async function getTags(): Promise<Tag[]> {
  const { data } = await supabase.from('tags').select('*').order('nome')
  return (data ?? []) as Tag[]
}

export async function adminSaveTag(tag: Partial<Tag>) {
  if (tag.id) {
    const { data, error } = await supabase.from('tags').update(tag).eq('id', tag.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('tags').insert([tag]).select().single()
  if (error) throw error
  return data
}

export async function adminDeleteTag(id: string) {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw error
}

export async function adminSaveCategoria(cat: Partial<Categoria>) {
  if (cat.id) {
    const { data, error } = await supabase.from('categorias').update(cat).eq('id', cat.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('categorias').insert([cat]).select().single()
  if (error) throw error
  return data
}

export async function adminDeleteCategoria(id: string) {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}
