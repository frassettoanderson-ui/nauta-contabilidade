import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { comChave, erroApi } from '@/lib/api-publica'
import { montarLead } from '@/lib/integracoes'

export const dynamic = 'force-dynamic'

// Um lead, com a empresa (cadastro) e a situação dos contratos
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const a = await comChave(req)
  if (a instanceof NextResponse) return a
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return erroApi(400, 'id_invalido', 'id inválido.')
  const l = (await pool.query(`SELECT * FROM leads WHERE id = $1 AND empresa_id = $2`, [params.id, a.empresaId])).rows[0]
  if (!l) return erroApi(404, 'nao_encontrado', 'Lead não encontrado neste perfil.')
  const c = (await pool.query(`SELECT * FROM clientes WHERE lead_id = $1 LIMIT 1`, [l.id])).rows[0] ?? null
  const contratos = (await pool.query(`SELECT id, tipo, status, criado_em, atualizado_em FROM contratos WHERE lead_id = $1 ORDER BY criado_em DESC`, [l.id])).rows
  return NextResponse.json({ ...montarLead(l, c), contratos: contratos.map((x) => ({ id: x.id, tipo: x.tipo, status: x.status, criado_em: x.criado_em, atualizado_em: x.atualizado_em })) })
}
