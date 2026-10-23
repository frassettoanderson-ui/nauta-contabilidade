import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { comChave, erroApi, montarCliente } from '@/lib/api-publica'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const a = await comChave(req)
  if (a instanceof NextResponse) return a
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return erroApi(400, 'id_invalido', 'id inválido.')
  const c = (await pool.query(`SELECT * FROM clientes WHERE id = $1 AND empresa_id = $2`, [params.id, a.empresaId])).rows[0]
  if (!c) return erroApi(404, 'nao_encontrado', 'Cliente não encontrado neste perfil.')
  return NextResponse.json(montarCliente(c))
}
