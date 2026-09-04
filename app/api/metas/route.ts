import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { getMeta, setMeta } from '@/lib/metas'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json(null, { status: 403 })
  const comp = req.nextUrl.searchParams.get('competencia') || undefined
  return NextResponse.json(await getMeta(empresaId, comp))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json(null, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const competencia = String(body.competencia || '')
  const metaClientes = Number(body.metaClientes)
  if (!competencia) return NextResponse.json({ error: 'Competência obrigatória' }, { status: 400 })
  return NextResponse.json(await setMeta(empresaId, competencia, metaClientes))
}
