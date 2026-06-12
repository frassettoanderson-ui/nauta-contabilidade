import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { encerrarConversa } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { conversaId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  await encerrarConversa(params.conversaId, 'atendente')
  return NextResponse.json({ ok: true })
}
