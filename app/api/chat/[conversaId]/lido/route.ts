import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { marcarLido } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { conversaId: string } }) {
  const session = await getServerSession(authOptions)
  const id = ((session as unknown as { user?: { id?: string } })?.user)?.id
  if (!id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  await marcarLido(params.conversaId, id)
  return NextResponse.json({ ok: true })
}
