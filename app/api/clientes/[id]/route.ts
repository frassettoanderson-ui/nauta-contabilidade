import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCliente } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const c = await getCliente(params.id)
  if (!c) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(c)
}
