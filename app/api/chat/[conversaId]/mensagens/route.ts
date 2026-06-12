import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listMensagens, enviarMensagem } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { conversaId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listMensagens(params.conversaId))
}

export async function POST(req: NextRequest, { params }: { params: { conversaId: string } }) {
  const session = await getServerSession(authOptions)
  const su = session?.user as unknown as { id?: string; name?: string } | undefined
  if (!su?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { texto, arquivo_url, arquivo_nome } = await req.json()
  if (!texto?.trim() && !arquivo_url) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  const msg = await enviarMensagem(params.conversaId, su.id, su.name ?? '', texto ?? '', arquivo_url, arquivo_nome)
  return NextResponse.json(msg)
}
