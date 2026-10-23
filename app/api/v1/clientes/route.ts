import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { comChave, montarCliente } from '@/lib/api-publica'

export const dynamic = 'force-dynamic'

// Clientes (cadastro das empresas) do perfil. ?busca= (razão social / fantasia), ?cnpj=, ?limite= (até 200)
export async function GET(req: NextRequest) {
  const a = await comChave(req)
  if (a instanceof NextResponse) return a
  const sp = req.nextUrl.searchParams
  const cond = ['empresa_id = $1'], vals: unknown[] = [a.empresaId]
  const busca = (sp.get('busca') ?? '').trim()
  if (busca) { vals.push(`%${busca}%`); cond.push(`(emp_nome ILIKE $${vals.length} OR emp_fantasia ILIKE $${vals.length})`) }
  const cnpj = (sp.get('cnpj') ?? '').replace(/\D/g, '')
  if (cnpj) { vals.push(cnpj); cond.push(`regexp_replace(COALESCE(emp_cnpj,''), '\\D', '', 'g') = $${vals.length}`) }
  const limite = Math.min(200, Math.max(1, Number(sp.get('limite')) || 50))
  const r = await pool.query(`SELECT * FROM clientes WHERE ${cond.join(' AND ')} ORDER BY criado_em DESC LIMIT ${limite}`, vals)
  return NextResponse.json({ dados: r.rows.map(montarCliente), total: r.rows.length })
}
