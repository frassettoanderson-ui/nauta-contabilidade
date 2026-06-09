import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addLembrete, toggleLembrete, deleteLembrete } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { descricao, data, hora } = await req.json()
  if (!descricao?.trim() || !data) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  const lembrete = await addLembrete(params.id, descricao.trim(), data, hora)
  return NextResponse.json(lembrete)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { lembreteId, concluido } = await req.json()
  await toggleLembrete(lembreteId, concluido)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lembreteId = req.nextUrl.searchParams.get('lembreteId')
  if (!lembreteId) return NextResponse.json({ error: 'ID faltando' }, { status: 400 })
  await deleteLembrete(lembreteId)
  return NextResponse.json({ ok: true })
}
