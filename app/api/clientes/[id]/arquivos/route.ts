import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listArquivos, addArquivo, deleteArquivo } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listArquivos(params.id))
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { nome, url } = await req.json()
  if (!nome || !url) return NextResponse.json({ error: 'Dados faltando' }, { status: 400 })
  const arq = await addArquivo(params.id, nome, url)
  return NextResponse.json(arq)
}

export async function DELETE(req: NextRequest, { params: _params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const arqId = req.nextUrl.searchParams.get('arq')
  if (!arqId) return NextResponse.json({ error: 'arq faltando' }, { status: 400 })
  await deleteArquivo(arqId)
  return NextResponse.json({ ok: true })
}
