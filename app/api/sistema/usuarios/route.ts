import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

const ROLES = ['admin', 'gerente', 'comercial', 'fiscal', 'pessoal', 'secretaria']

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session || (role !== 'admin' && role !== 'gerente')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const res = await pool.query(`SELECT id, username, role, must_change_password, criado_em FROM admin_users ORDER BY criado_em DESC`)
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session || (role !== 'admin' && role !== 'gerente')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { username, password, role: novoRole } = await req.json()
  if (!username?.trim() || !password) return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
  if (!ROLES.includes(novoRole)) return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })

  const hash = await bcrypt.hash(password, 12)
  try {
    await pool.query(
      `INSERT INTO admin_users (username, password_hash, role, must_change_password) VALUES ($1, $2, $3, true)`,
      [username.trim(), hash, novoRole]
    )
  } catch {
    return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
