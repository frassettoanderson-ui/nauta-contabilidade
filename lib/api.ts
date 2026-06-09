import type { Categoria, Tag, Post, PostWithRelations, PaginatedPosts } from '@/types/blog'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erro na requisição')
  return res.json()
}

// ─── PUBLIC ────────────────────────────────────────────────────────────────

export function getPosts(opts: { page?: number; categoria?: string; busca?: string } = {}): Promise<PaginatedPosts> {
  const sp = new URLSearchParams()
  if (opts.page) sp.set('page', String(opts.page))
  if (opts.categoria) sp.set('categoria', opts.categoria)
  if (opts.busca) sp.set('busca', opts.busca)
  return fetch(`/api/blog/posts?${sp.toString()}`).then(r => json<PaginatedPosts>(r))
}

export function getCategorias(): Promise<Categoria[]> {
  return fetch('/api/blog/categorias').then(r => json<Categoria[]>(r))
}

export function getTags(): Promise<Tag[]> {
  return fetch('/api/blog/tags').then(r => json<Tag[]>(r))
}

// ─── ADMIN: POSTS ────────────────────────────────────────────────────────────

export function adminGetPosts(status?: 'rascunho' | 'publicado'): Promise<PostWithRelations[]> {
  const sp = new URLSearchParams({ admin: '1' })
  if (status) sp.set('status', status)
  return fetch(`/api/blog/posts?${sp.toString()}`).then(r => json<PostWithRelations[]>(r))
}

export function adminGetPost(id: string): Promise<PostWithRelations> {
  return fetch(`/api/blog/posts/${id}`).then(r => json<PostWithRelations>(r))
}

export function adminSavePost(data: Partial<Post> & { tagIds?: string[] }): Promise<Post> {
  return fetch('/api/blog/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<Post>(r))
}

export function adminDeletePost(id: string): Promise<void> {
  return fetch(`/api/blog/posts/${id}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
}

export function adminToggleStatus(id: string, currentStatus: 'rascunho' | 'publicado'): Promise<void> {
  const status = currentStatus === 'publicado' ? 'rascunho' : 'publicado'
  return fetch(`/api/blog/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(r => json(r)).then(() => undefined)
}

// ─── ADMIN: CATEGORIAS ─────────────────────────────────────────────────────

export function adminSaveCategoria(data: Partial<Categoria>): Promise<Categoria> {
  return fetch('/api/blog/categorias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<Categoria>(r))
}

export function adminDeleteCategoria(id: string): Promise<void> {
  return fetch(`/api/blog/categorias/${id}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
}

// ─── ADMIN: TAGS ───────────────────────────────────────────────────────────

export function adminSaveTag(data: Partial<Tag>): Promise<Tag> {
  return fetch('/api/blog/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<Tag>(r))
}

export function adminDeleteTag(id: string): Promise<void> {
  return fetch(`/api/blog/tags/${id}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
}

// ─── LEADS ─────────────────────────────────────────────────────────────────

export async function saveLead(lead: { nome: string; whatsapp: string; email: string; interesse: string }) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  })
  return json(res)
}

export interface LeadRow {
  id: string
  nome: string
  whatsapp: string
  email: string
  interesse: string
  criado_em: string
}

export function getLeads(): Promise<LeadRow[]> {
  return fetch('/api/leads').then(r => json<LeadRow[]>(r))
}

// ─── UPLOAD ────────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/blog/upload', { method: 'POST', body: fd })
  const data = await json<{ url: string }>(res)
  return data.url
}
