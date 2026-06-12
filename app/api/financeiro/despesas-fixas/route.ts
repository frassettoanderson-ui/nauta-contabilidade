import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listDespesasFixas, addDespesaFixa, toggleDespesaFixa, deleteDespesaFixa } from '@/lib/financeiro-mov'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listDespesasFixas())
}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json()
  if (!b.descricao?.trim()) return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 })
  return NextResponse.json(await addDespesaFixa(b))
}
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id, ativo } = await req.json()
  if (!id) return NextResponse.json({ error: 'id faltando' }, { status: 400 })
  await toggleDespesaFixa(id, !!ativo)
  return NextResponse.json({ ok: true })
}
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id faltando' }, { status: 400 })
  await deleteDespesaFixa(id)
  return NextResponse.json({ ok: true })
}
