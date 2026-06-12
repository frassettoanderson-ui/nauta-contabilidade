import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listContatos, heartbeat } from '@/lib/chat'

export const dynamic = 'force-dynamic'

function uid(session: unknown) { return ((session as { user?: { id?: string } })?.user)?.id }

export async function GET() {
  const session = await getServerSession(authOptions)
  const me = uid(session)
  if (!me) return NextResponse.json([], { status: 401 })
  await heartbeat(me) // marca presença ao buscar contatos (polling)
  return NextResponse.json(await listContatos(me))
}
