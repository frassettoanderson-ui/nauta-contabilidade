import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insertLead, getLeads } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const leads = await getLeads()
  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    const lead = await insertLead({
      nome: body.nome,
      whatsapp: body.whatsapp ?? '',
      email: body.email ?? '',
      interesse: body.interesse ?? 'Não informado',
      etapa: body.etapa,
      classificacao: body.classificacao,
    })
    return NextResponse.json(lead)
  } catch (e) {
    console.error('[LEADS] ERRO:', e)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
