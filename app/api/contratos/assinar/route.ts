import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarContratoParaAssinatura } from '@/lib/contrato-envio'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId faltando' }, { status: 400 })

  try {
    return NextResponse.json(await enviarContratoParaAssinatura(leadId))
  } catch (e) {
    console.error('[ASSINAR]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao enviar para assinatura' }, { status: 500 })
  }
}
