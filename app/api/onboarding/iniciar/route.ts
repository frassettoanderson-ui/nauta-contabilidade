import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { iniciarOnboarding } from '@/lib/leads'
import { categoriaFromInteresse } from '@/lib/onboarding'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId, categoria } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId faltando' }, { status: 400 })

  // Categoria: usa a enviada, ou deriva do interesse do lead
  let cat: string | null = categoria ?? null
  if (!cat) {
    const r = await pool.query(`SELECT interesse FROM leads WHERE id = $1`, [leadId])
    cat = categoriaFromInteresse(r.rows[0]?.interesse)
  }
  if (!cat) {
    return NextResponse.json({ error: 'sem_categoria', message: 'Interesse do lead não corresponde a uma categoria de onboarding. Ajuste o interesse (não pode ser "Outro").' }, { status: 422 })
  }

  await iniciarOnboarding(leadId, cat)
  return NextResponse.json({ ok: true, categoria: cat })
}
