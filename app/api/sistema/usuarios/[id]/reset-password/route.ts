import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

// Reseta a senha para 123456 e força troca no próximo acesso
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session || (role !== 'admin' && role !== 'gerente')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const hash = await bcrypt.hash('123456', 12)
  await pool.query(
    `UPDATE admin_users SET password_hash = $1, must_change_password = true WHERE id = $2`,
    [hash, params.id]
  )
  return NextResponse.json({ ok: true })
}
