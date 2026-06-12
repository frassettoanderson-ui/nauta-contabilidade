import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listPagamentos, addPagamento, deletePagamento } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { leadId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listPagamentos(params.leadId))
}

export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { competencia, valor, pago_em } = await req.json()
  if (!competencia) return NextResponse.json({ error: 'competência faltando' }, { status: 400 })
  const p = await addPagamento(params.leadId, competencia, valor ?? null, pago_em ?? null)
  return NextResponse.json(p)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id faltando' }, { status: 400 })
  await deletePagamento(id)
  return NextResponse.json({ ok: true })
}
