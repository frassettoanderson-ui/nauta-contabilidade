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
  etapa: string
  classificacao: number
  criado_em: string
  lembretes_pendentes?: number | string
  cliente_id?: string | null
  cadastro_completo?: boolean
  valor_honorario?: number | string | null
  valor_abertura?: number | string | null
  responsavel_id?: string | null
  responsavel_nome?: string | null
}

export interface UsuarioRow { id: string; username: string; role: string }
export function listUsuarios(): Promise<UsuarioRow[]> {
  return fetch('/api/sistema/usuarios').then(r => json<UsuarioRow[]>(r))
}

export interface AtividadeRow {
  id: string
  lead_id: string
  descricao: string
  autor: string | null
  criado_em: string
}

export interface LembreteRow {
  id: string
  lead_id: string
  descricao: string
  data: string
  hora: string | null
  concluido: boolean
  criado_em: string
}

export interface LeadDetail extends LeadRow {
  atividades: AtividadeRow[]
  lembretes: LembreteRow[]
}

export function getLeads(): Promise<LeadRow[]> {
  return fetch('/api/leads').then(r => json<LeadRow[]>(r))
}

export function getLeadDetail(id: string): Promise<LeadDetail> {
  return fetch(`/api/leads/${id}`).then(r => json<LeadDetail>(r))
}

export function createLead(data: Partial<LeadRow>): Promise<LeadRow> {
  return fetch('/api/leads', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(r => json<LeadRow>(r))
}

export function updateLead(id: string, fields: Partial<LeadRow>): Promise<void> {
  return fetch(`/api/leads/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
  }).then(r => json(r)).then(() => undefined)
}

export function deleteLead(id: string): Promise<void> {
  return fetch(`/api/leads/${id}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
}

export function addAtividade(leadId: string, descricao: string): Promise<AtividadeRow> {
  return fetch(`/api/leads/${leadId}/atividades`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ descricao }),
  }).then(r => json<AtividadeRow>(r))
}

export function addLembrete(leadId: string, descricao: string, data: string, hora?: string): Promise<LembreteRow> {
  return fetch(`/api/leads/${leadId}/lembretes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ descricao, data, hora }),
  }).then(r => json<LembreteRow>(r))
}

export function toggleLembrete(leadId: string, lembreteId: string, concluido: boolean): Promise<void> {
  return fetch(`/api/leads/${leadId}/lembretes`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lembreteId, concluido }),
  }).then(r => json(r)).then(() => undefined)
}

export function deleteLembrete(leadId: string, lembreteId: string): Promise<void> {
  return fetch(`/api/leads/${leadId}/lembretes?lembreteId=${lembreteId}`, { method: 'DELETE' })
    .then(r => json(r)).then(() => undefined)
}

export interface PendingLembrete {
  id: string; lead_id: string; descricao: string; data: string; hora: string | null; lead_nome: string
}
export function getPendingLembretes(): Promise<PendingLembrete[]> {
  return fetch('/api/sistema/lembretes').then(r => json<PendingLembrete[]>(r))
}

// ─── CLIENTES (cadastro completo) ───────────────────────────────────────────

export function uploadDoc(file: File): Promise<{ url: string; nome: string }> {
  const fd = new FormData(); fd.append('file', file)
  return fetch('/api/sistema/upload', { method: 'POST', body: fd }).then(r => json<{ url: string; nome: string }>(r))
}

export function saveCliente(payload: Record<string, unknown>): Promise<{ id: string }> {
  return fetch('/api/clientes', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }).then(r => json<{ id: string }>(r))
}

export function getClienteByLead(leadId: string): Promise<Record<string, unknown> | null> {
  return fetch(`/api/clientes?lead=${leadId}`).then(r => json<Record<string, unknown> | null>(r))
}

export function getCliente(id: string): Promise<Record<string, unknown>> {
  return fetch(`/api/clientes/${id}`).then(r => json<Record<string, unknown>>(r))
}

export function listClientes(): Promise<Record<string, unknown>[]> {
  return fetch('/api/clientes').then(r => json<Record<string, unknown>[]>(r))
}

export function deleteCliente(id: string): Promise<void> {
  return fetch(`/api/clientes/${id}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
}

export function gerarLinkCadastro(id: string): Promise<{ token: string; url: string }> {
  return fetch(`/api/clientes/${id}/link`, { method: 'POST' }).then(r => json<{ token: string; url: string }>(r))
}

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────

export function createUsuario(username: string, password: string, role: string): Promise<void> {
  return fetch('/api/sistema/usuarios', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, role }),
  }).then(r => json(r)).then(() => undefined)
}

// ─── UPLOAD ────────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/blog/upload', { method: 'POST', body: fd })
  const data = await json<{ url: string }>(res)
  return data.url
}
