import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { eventoValido, novoSegredo, urlValida } from '@/lib/integracoes'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  const b = await req.json().catch(() => ({}))
  const nome = String(b.nome ?? '').trim(), url = String(b.url ?? '').trim()
  const eventos: string[] = Array.isArray(b.eventos) ? b.eventos.filter((e: string) => e === '*' || eventoValido(e)) : []
  if (!nome) return NextResponse.json({ error: 'Dê um nome para o webhook' }, { status: 400 })
  if (!urlValida(url)) return NextResponse.json({ error: 'URL inválida (use https://...)' }, { status: 400 })
  if (!eventos.length) return NextResponse.json({ error: 'Escolha ao menos um evento' }, { status: 400 })
  const r = await pool.query(
    `INSERT INTO integracao_webhooks (empresa_id, nome, url, eventos, segredo, criado_por) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [g.empresaId, nome.slice(0, 80), url, eventos, novoSegredo(), g.nome],
  )
  return NextResponse.json(r.rows[0])
}
