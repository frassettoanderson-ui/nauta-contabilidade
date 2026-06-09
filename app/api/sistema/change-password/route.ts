import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
  if (!/[A-Za-z]/.test(pw)) return 'A senha deve conter letras.'
  if (!/[0-9]/.test(pw)) return 'A senha deve conter números.'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'A senha deve conter pelo menos 1 caractere especial.'
  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const uid = (session?.user as unknown as { id?: string })?.id
  if (!session || !uid) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { password } = await req.json()
  if (typeof password !== 'string') return NextResponse.json({ error: 'Senha inválida' }, { status: 400 })

  const err = validatePassword(password)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const hash = await bcrypt.hash(password, 12)
  await pool.query(
    'UPDATE admin_users SET password_hash = $1, must_change_password = false WHERE id = $2',
    [hash, uid]
  )
  return NextResponse.json({ ok: true })
}
