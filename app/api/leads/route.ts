import { NextRequest, NextResponse } from 'next/server'
import { insertLead } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.nome || !body.whatsapp || !body.email) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }
    const lead = await insertLead({
      nome: body.nome,
      whatsapp: body.whatsapp,
      email: body.email,
      interesse: body.interesse ?? 'Não informado',
    })
    return NextResponse.json(lead)
  } catch (e) {
    console.error('[LEADS] ERRO:', e)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
