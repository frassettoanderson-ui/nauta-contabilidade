import { NextRequest, NextResponse } from 'next/server'
import { criarConversaSite } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// Público: cria a conversa do site após a triagem do bot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.nome || !body?.setor) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    const conversaId = await criarConversaSite({
      ehCliente: !!body.ehCliente,
      nome: String(body.nome).slice(0, 120),
      setor: String(body.setor),
      empresa: body.empresa ? String(body.empresa).slice(0, 120) : undefined,
      telefone: body.telefone ? String(body.telefone).slice(0, 40) : undefined,
      email: body.email ? String(body.email).slice(0, 120) : undefined,
      interesse: body.interesse ? String(body.interesse) : undefined,
    })
    return NextResponse.json({ conversaId })
  } catch {
    return NextResponse.json({ error: 'Erro ao iniciar atendimento' }, { status: 500 })
  }
}
