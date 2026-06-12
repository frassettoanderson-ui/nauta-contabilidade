import { NextRequest, NextResponse } from 'next/server'
import { enviarVisitante } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { conversaId, nome, texto } = await req.json()
    if (!conversaId || !texto?.trim()) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    const msg = await enviarVisitante(conversaId, nome ? String(nome).slice(0, 120) : 'Visitante', String(texto).slice(0, 2000))
    return NextResponse.json(msg)
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })
  }
}
