import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listClientes, getClienteByLead, saveCliente } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lead = req.nextUrl.searchParams.get('lead')
  if (lead) {
    const c = await getClienteByLead(lead)
    return NextResponse.json(c)
  }
  const list = await listClientes()
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const id = await saveCliente(body)
  return NextResponse.json({ id })
}
