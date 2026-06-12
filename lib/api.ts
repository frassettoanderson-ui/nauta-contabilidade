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

export async function saveLead(lead: { nome: string; whatsapp: string; email: string; interesse: string; mensagem?: string }) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...lead, origem: 'Site' }),
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
  origem?: string | null
  contrato_status?: string | null
  contrato_autentique_status?: string | null
}

export interface UsuarioRow { id: string; username: string; role: string }
export function listUsuarios(): Promise<UsuarioRow[]> {
  return fetch('/api/sistema/usuarios').then(r => json<UsuarioRow[]>(r))
}

export interface ContratoRow {
  id: string; lead_id: string; tipo: number; status: string
  pdf_url: string | null; assinado_url: string | null; criado_em: string
  autentique_id?: string | null; autentique_status?: string | null; autentique_url?: string | null
}
export function getContratoByLead(leadId: string): Promise<ContratoRow | null> {
  return fetch(`/api/contratos?lead=${leadId}`).then(r => json<ContratoRow | null>(r))
}
export function gerarContrato(leadId: string): Promise<ContratoRow> {
  return fetch('/api/contratos/gerar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId }),
  }).then(r => json<ContratoRow>(r))
}
export function enviarParaAssinatura(leadId: string): Promise<{ ok: boolean; autentique_id?: string }> {
  return fetch('/api/contratos/assinar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId }),
  }).then(r => json(r))
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

export interface ArquivoRow { id: string; nome: string; url: string; criado_em: string }
export function listArquivos(clienteId: string): Promise<ArquivoRow[]> {
  return fetch(`/api/clientes/${clienteId}/arquivos`).then(r => json<ArquivoRow[]>(r))
}
export function addArquivoCliente(clienteId: string, nome: string, url: string): Promise<ArquivoRow> {
  return fetch(`/api/clientes/${clienteId}/arquivos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, url }),
  }).then(r => json<ArquivoRow>(r))
}
export function deleteArquivoCliente(clienteId: string, arqId: string): Promise<void> {
  return fetch(`/api/clientes/${clienteId}/arquivos?arq=${arqId}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
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

export interface UsuarioFull {
  id: string; username: string; role: string
  must_change_password?: boolean; menu_perms?: string[] | null; criado_em?: string
}
export function listUsuariosFull(): Promise<UsuarioFull[]> {
  return fetch('/api/sistema/usuarios').then(r => json<UsuarioFull[]>(r))
}
export function updateUsuario(id: string, data: { role?: string; menu_perms?: string[] | null }): Promise<void> {
  return fetch(`/api/sistema/usuarios/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(r => json(r)).then(() => undefined)
}
export function deleteUsuario(id: string): Promise<void> {
  return fetch(`/api/sistema/usuarios/${id}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
}
export function resetSenhaUsuario(id: string): Promise<void> {
  return fetch(`/api/sistema/usuarios/${id}/reset-password`, { method: 'POST' }).then(r => json(r)).then(() => undefined)
}

export function getOnboardingStatus(): Promise<{ temNovos: boolean; total?: number }> {
  return fetch('/api/onboarding/status').then(r => json(r))
}

export interface OnboardingCliente {
  id: string; nome: string; whatsapp: string; email: string; interesse: string
  valor_honorario: number | string | null
  onboarding_categoria: string | null; cliente_id: string | null
  cadastro_completo: boolean; checks: string[]
}
export function getOnboardingBoard(): Promise<OnboardingCliente[]> {
  return fetch('/api/onboarding/board').then(r => json<OnboardingCliente[]>(r))
}
export function setOnboardingCheck(leadId: string, itemKey: string, done: boolean): Promise<void> {
  return fetch('/api/onboarding/check', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, itemKey, done }),
  }).then(r => json(r)).then(() => undefined)
}
export function concluirOnboarding(leadId: string, valor?: number | null, vencimento?: string | null): Promise<void> {
  return fetch('/api/onboarding/concluir', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, valor, vencimento }),
  }).then(r => json(r)).then(() => undefined)
}
export function listFinanceiro(): Promise<Record<string, unknown>[]> {
  return fetch('/api/financeiro/clientes').then(r => json<Record<string, unknown>[]>(r))
}

export interface DashboardData {
  meses: string[]
  resultadoMes: number; recebidoSerie: number[]
  aReceberMes: number; aReceberSerie: number[]
  vencidosCount: number; vencidosSerie: number[]
}
export function getDashboard(): Promise<DashboardData> {
  return fetch('/api/dashboard').then(r => json<DashboardData>(r))
}

// ─── CHAT INTERNO ────────────────────────────────────────────────────────────

export interface ChatContato { id: string; username: string; nome_completo: string | null; role: string; foto_url: string | null; online: boolean }
export interface ChatConversa {
  id: string; tipo: string; setor: string | null; visitante_nome: string | null; atualizado_em: string
  outro_id: string | null; outro_nome: string | null; outro_role: string | null; outro_foto: string | null; outro_online: boolean
  ultima_msg: string | null; ultima_arq: string | null; nao_lidas: number | string
}
export interface ChatMensagem { id: string; autor_id: string | null; autor_tipo: string; autor_nome: string | null; texto: string | null; arquivo_url: string | null; arquivo_nome: string | null; criado_em: string }

export function chatContatos(): Promise<ChatContato[]> {
  return fetch('/api/chat/contatos').then(r => json<ChatContato[]>(r))
}
export function chatConversas(): Promise<ChatConversa[]> {
  return fetch('/api/chat/conversas').then(r => json<ChatConversa[]>(r))
}
export interface ChatConversaSite { id: string; setor: string | null; visitante_nome: string | null; visitante_contato: string | null; atualizado_em: string; ultima_msg: string | null; nao_lidas: number | string }
export function chatSite(): Promise<ChatConversaSite[]> {
  return fetch('/api/chat/site').then(r => json<ChatConversaSite[]>(r))
}
export function chatAbrirDM(outroId: string): Promise<{ conversaId: string }> {
  return fetch('/api/chat/conversas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outroId }) }).then(r => json(r))
}
export function chatMensagens(conversaId: string): Promise<ChatMensagem[]> {
  return fetch(`/api/chat/${conversaId}/mensagens`).then(r => json<ChatMensagem[]>(r))
}
export function chatEnviar(conversaId: string, texto: string, arquivo_url?: string | null, arquivo_nome?: string | null): Promise<ChatMensagem> {
  return fetch(`/api/chat/${conversaId}/mensagens`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto, arquivo_url, arquivo_nome }) }).then(r => json(r))
}
export function chatMarcarLido(conversaId: string): Promise<void> {
  return fetch(`/api/chat/${conversaId}/lido`, { method: 'POST' }).then(r => json(r)).then(() => undefined)
}

export interface PagamentoRow { id: string; competencia: string; valor: number | string | null; pago_em: string | null; criado_em: string }
export function listPagamentos(leadId: string): Promise<PagamentoRow[]> {
  return fetch(`/api/financeiro/${leadId}/pagamentos`).then(r => json<PagamentoRow[]>(r))
}
export function addPagamento(leadId: string, competencia: string, valor: number | null, pago_em: string | null): Promise<PagamentoRow> {
  return fetch(`/api/financeiro/${leadId}/pagamentos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competencia, valor, pago_em }),
  }).then(r => json<PagamentoRow>(r))
}
export function deletePagamento(leadId: string, id: string): Promise<void> {
  return fetch(`/api/financeiro/${leadId}/pagamentos?id=${id}`, { method: 'DELETE' }).then(r => json(r)).then(() => undefined)
}

export interface EventoRow { id: string; tipo: string; descricao: string; prazo_pagamento: string | null; autor: string | null; criado_em: string }
export function listEventos(leadId: string): Promise<EventoRow[]> {
  return fetch(`/api/financeiro/${leadId}/eventos`).then(r => json<EventoRow[]>(r))
}
export function addEvento(leadId: string, tipo: string, descricao: string, prazo_pagamento: string | null): Promise<EventoRow> {
  return fetch(`/api/financeiro/${leadId}/eventos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo, descricao, prazo_pagamento }),
  }).then(r => json<EventoRow>(r))
}

export interface OnboardingLead {
  id: string; nome: string; whatsapp: string; email: string
  interesse: string; classificacao: number; onboarding_etapa: number; criado_em: string
}
export function getOnboardingLeads(categoria: string): Promise<OnboardingLead[]> {
  return fetch(`/api/onboarding/leads?categoria=${encodeURIComponent(categoria)}`).then(r => json<OnboardingLead[]>(r))
}
export function iniciarOnboarding(leadId: string, categoria?: string): Promise<{ ok: boolean; categoria?: string }> {
  return fetch('/api/onboarding/iniciar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, categoria }),
  }).then(r => json(r))
}

// ─── PERFIL ──────────────────────────────────────────────────────────────────

export interface PerfilRow {
  id: string; username: string; email: string | null; role: string
  nome_completo: string | null; telefone: string | null; foto_url: string | null
}
export function getPerfil(): Promise<PerfilRow | null> {
  return fetch('/api/sistema/perfil').then(r => json<PerfilRow | null>(r))
}
export function updatePerfil(data: { nome_completo?: string; telefone?: string; email?: string; foto_url?: string | null }): Promise<void> {
  return fetch('/api/sistema/perfil', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
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
