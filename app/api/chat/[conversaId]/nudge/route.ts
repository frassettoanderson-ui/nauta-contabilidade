import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { nudge } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { conversaId: string } }) {
  const session = await getServerSession(authOptions)
  const su = session?.user as unknown as { id?: string; name?: string } | undefined
  if (!su?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  await nudge(params.conversaId, su.id, su.name ?? 'Alguém')
  return NextResponse.json({ ok: true })
}
