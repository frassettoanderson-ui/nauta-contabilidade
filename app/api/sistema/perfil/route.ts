import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

function userId(session: unknown): string | undefined {
  return ((session as { user?: { id?: string } })?.user)?.id
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const id = userId(session)
  if (!id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const r = await pool.query(
    `SELECT id, username, email, role, nome_completo, telefone, foto_url FROM admin_users WHERE id = $1`,
    [id]
  )
  return NextResponse.json(r.rows[0] ?? null)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const id = userId(session)
  if (!id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome_completo, telefone, email, foto_url } = await req.json()
  await pool.query(
    `UPDATE admin_users
        SET nome_completo = $1, telefone = $2, email = COALESCE($3, email), foto_url = $4
      WHERE id = $5`,
    [nome_completo ?? null, telefone ?? null, email ?? null, foto_url ?? null, id]
  )
  return NextResponse.json({ ok: true })
}
