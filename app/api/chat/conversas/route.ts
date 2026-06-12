import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listConversas, getOrCreateDM } from '@/lib/chat'

export const dynamic = 'force-dynamic'

function uid(session: unknown) { return ((session as { user?: { id?: string } })?.user)?.id }

export async function GET() {
  const session = await getServerSession(authOptions)
  const me = uid(session)
  if (!me) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listConversas(me))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const me = uid(session)
  if (!me) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { outroId } = await req.json()
  if (!outroId) return NextResponse.json({ error: 'outroId faltando' }, { status: 400 })
  const id = await getOrCreateDM(me, outroId)
  return NextResponse.json({ conversaId: id })
}
