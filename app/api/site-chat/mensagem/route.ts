import { NextRequest, NextResponse } from 'next/server'
import { enviarVisitante } from '@/lib/chat'
import { contatoBloqueado } from '@/lib/bloqueio'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { conversaId, nome, texto } = await req.json()
    if (!conversaId || !texto?.trim()) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    const conv = (await pool.query(`SELECT visitante_contato FROM chat_conversas WHERE id = $1`, [conversaId])).rows[0]
    if (conv && await contatoBloqueado({ contato: conv.visitante_contato })) return NextResponse.json({ error: 'Erro ao enviar' }, { status: 403 })
    const msg = await enviarVisitante(conversaId, nome ? String(nome).slice(0, 120) : 'Visitante', String(texto).slice(0, 2000))
    return NextResponse.json(msg)
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })
  }
}
