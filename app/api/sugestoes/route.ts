import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listSugestoes, addSugestao, resolverSugestao, deleteSugestao, type StatusSugestao } from '@/lib/sugestoes'

export const dynamic = 'force-dynamic'

async function usuario() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const u = session.user as { id?: string; role?: string; name?: string | null; email?: string | null }
  return { id: String(u.id ?? ''), nome: u.name || u.email || 'Usuário', admin: u.role === 'admin' }
}

export async function GET() {
  const u = await usuario()
  if (!u) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listSugestoes())
}

// POST { titulo, area?, descricao } → nova solicitação (qualquer usuário)
export async function POST(req: NextRequest) {
  const u = await usuario()
  if (!u) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (!String(b.titulo || '').trim()) return NextResponse.json({ error: 'Informe o título' }, { status: 400 })
  if (!String(b.descricao || '').trim()) return NextResponse.json({ error: 'Descreva a alteração' }, { status: 400 })
  return NextResponse.json(await addSugestao({ titulo: String(b.titulo), area: b.area ? String(b.area) : undefined, descricao: String(b.descricao), autorId: u.id, autorNome: u.nome }))
}

// PATCH { id, status: concluida | nao_aprovada | pendente, resposta? } → só admin
export async function PATCH(req: NextRequest) {
  const u = await usuario()
  if (!u) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!u.admin) return NextResponse.json({ error: 'Somente o administrador pode finalizar sugestões' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const status = String(b.status) as StatusSugestao
  if (!b.id || !['pendente', 'concluida', 'nao_aprovada'].includes(status)) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const s = await resolverSugestao(String(b.id), status, b.resposta ? String(b.resposta) : null, u.nome)
  if (!s) return NextResponse.json({ error: 'Sugestão não encontrada' }, { status: 404 })
  return NextResponse.json(s)
}

// DELETE ?id= → autor (ou admin) exclui uma sugestão ainda pendente
export async function DELETE(req: NextRequest) {
  const u = await usuario()
  if (!u) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id faltando' }, { status: 400 })
  const ok = await deleteSugestao(id, u.id, u.admin)
  if (!ok) return NextResponse.json({ error: 'Só é possível excluir sugestões pendentes que você abriu' }, { status: 403 })
  return NextResponse.json({ ok: true })
}
