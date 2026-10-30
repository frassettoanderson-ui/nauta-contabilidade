import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { obterLink, excluirLink } from '@/lib/cadastro-links'

export const dynamic = 'force-dynamic'

// Dados preenchidos. A senha gov.br só vai para admin/gerente (coordenação).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const role = (session.user as unknown as { role?: string })?.role
  const l = await obterLink(params.id, await empresaAtivaId(), role === 'admin' || role === 'gerente')
  if (!l) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
  return NextResponse.json(l)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  await excluirLink(params.id, await empresaAtivaId())
  return NextResponse.json({ ok: true })
}
