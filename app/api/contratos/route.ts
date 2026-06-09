import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getContratoByLead } from '@/lib/contrato-gen'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lead = req.nextUrl.searchParams.get('lead')
  if (!lead) return NextResponse.json(null)
  const contrato = await getContratoByLead(lead)
  return NextResponse.json(contrato)
}
