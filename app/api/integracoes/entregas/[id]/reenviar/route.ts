import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { reenviar } from '@/lib/integracoes'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  if (!(await reenviar(g.empresaId, params.id))) return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 })
  const r = await pool.query(`SELECT id, status, tentativas, ultimo_codigo, ultima_resposta, ultimo_erro, entregue_em FROM integracao_entregas WHERE id = $1`, [params.id])
  return NextResponse.json(r.rows[0])
}
