import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addAtividade } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { descricao } = await req.json()
  if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição vazia' }, { status: 400 })
  const autor = session.user?.name || session.user?.email || null
  const at = await addAtividade(params.id, descricao.trim(), autor)
  return NextResponse.json(at)
}
