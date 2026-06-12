import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listLancamentos, addLancamento, deleteLancamento } from '@/lib/financeiro-mov'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  const tipo = req.nextUrl.searchParams.get('tipo') || 'entrada'
  return NextResponse.json(await listLancamentos(tipo))
}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const nome = (session?.user as unknown as { name?: string })?.name ?? null
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json()
  if (!b.tipo || !b.valor) return NextResponse.json({ error: 'Tipo e valor obrigatórios' }, { status: 400 })
  return NextResponse.json(await addLancamento({ ...b, autor: nome }))
}
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id faltando' }, { status: 400 })
  await deleteLancamento(id)
  return NextResponse.json({ ok: true })
}
