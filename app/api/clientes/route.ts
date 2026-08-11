import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listClientes, getClienteByLead, saveCliente } from '@/lib/clientes'
import { empresaAtivaId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json({ error: 'Sem empresa ativa' }, { status: 403 })
  const lead = req.nextUrl.searchParams.get('lead')
  if (lead) {
    const c = await getClienteByLead(lead, empresaId)
    return NextResponse.json(c)
  }
  const list = await listClientes(empresaId)
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json({ error: 'Sem empresa ativa' }, { status: 403 })
  const body = await req.json()
  const id = await saveCliente(body, empresaId)
  return NextResponse.json({ id })
}
