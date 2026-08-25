import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setSituacaoCliente } from '@/lib/clientes'
import { empresaAtivaId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json({ error: 'Sem empresa ativa' }, { status: 403 })

  const { situacao } = await req.json()
  if (!situacao) return NextResponse.json({ error: 'situacao faltando' }, { status: 400 })
  try {
    return NextResponse.json(await setSituacaoCliente(params.id, situacao, empresaId))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Erro' }, { status: 400 })
  }
}
