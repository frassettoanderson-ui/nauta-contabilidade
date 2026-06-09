import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gerarContrato } from '@/lib/contrato-gen'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId faltando' }, { status: 400 })
  try {
    const contrato = await gerarContrato(leadId)
    return NextResponse.json(contrato)
  } catch (e) {
    console.error('[CONTRATO] ERRO:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao gerar contrato' }, { status: 500 })
  }
}
