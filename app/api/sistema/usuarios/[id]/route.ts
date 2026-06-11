import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

const ROLES = ['admin', 'gerente', 'comercial', 'fiscal', 'pessoal', 'atendente']

async function ensureGestor() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session || (role !== 'admin' && role !== 'gerente')) return null
  return session
}

// Atualiza cargo e permissões de menu
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await ensureGestor()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, menu_perms } = await req.json()
  if (role && !ROLES.includes(role)) return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })

  // menu_perms: null = usa padrão do cargo; array = personalizado
  const perms: string[] | null = Array.isArray(menu_perms) ? menu_perms : null

  await pool.query(
    `UPDATE admin_users SET role = COALESCE($1, role), menu_perms = $2 WHERE id = $3`,
    [role ?? null, perms, params.id]
  )
  return NextResponse.json({ ok: true })
}

// Exclui usuário
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureGestor()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Não deixa excluir a si mesmo
  const selfId = (session.user as unknown as { id?: string })?.id
  if (selfId === params.id) return NextResponse.json({ error: 'Você não pode excluir o próprio usuário.' }, { status: 400 })

  await pool.query(`DELETE FROM admin_users WHERE id = $1`, [params.id])
  return NextResponse.json({ ok: true })
}
