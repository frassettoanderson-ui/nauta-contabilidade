import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listEventos, addEvento } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { leadId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listEventos(params.leadId))
}

export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const session = await getServerSession(authOptions)
  const nome = (session?.user as unknown as { name?: string })?.name ?? null
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { tipo, descricao, prazo_pagamento } = await req.json()
  if (!tipo) return NextResponse.json({ error: 'tipo faltando' }, { status: 400 })
  const ev = await addEvento(params.leadId, tipo, descricao ?? '', prazo_pagamento ?? null, nome)
  return NextResponse.json(ev)
}
