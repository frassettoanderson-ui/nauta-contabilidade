import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCliente, deleteCliente } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const c = await getCliente(params.id)
  if (!c) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(c)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (role !== 'admin' && role !== 'gerente') {
    return NextResponse.json({ error: 'Solicite ao seu Gestor para excluir esse cliente' }, { status: 403 })
  }
  await deleteCliente(params.id)
  return NextResponse.json({ ok: true })
}
