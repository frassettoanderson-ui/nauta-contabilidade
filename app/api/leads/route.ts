import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insertLead, getLeads, addAtividade } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const u = session.user as unknown as { id?: string; role?: string }
  const leads = await getLeads({ userId: u.id, role: u.role })
  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const u = session?.user as unknown as { id?: string; name?: string } | undefined
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
      // criado manualmente (logado) -> atribui ao criador; vindo do site -> sem responsável
      responsavel_id: u?.id ?? null,
      responsavel_nome: u?.name ?? null,
      origem: body.origem ?? null,
    })

    // Mensagem enviada pelo formulário de contato → registrada como atividade
    if (body.mensagem?.trim()) {
      await addAtividade(lead.id, `Mensagem do site: ${body.mensagem.trim()}`, 'Site')
    }

    return NextResponse.json(lead)
  } catch (e) {
    console.error('[LEADS] ERRO:', e)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
