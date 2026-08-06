import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const email = (body?.email ?? '').toString().trim().toLowerCase()
  const origem = (body?.origem ?? 'blog').toString().slice(0, 60)

  if (!email || email.length > 160 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })

  try {
    await pool.query(
      `INSERT INTO newsletter (email, origem) VALUES ($1,$2) ON CONFLICT (email) DO NOTHING`,
      [email, origem]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não foi possível inscrever agora.' }, { status: 500 })
  }
}
