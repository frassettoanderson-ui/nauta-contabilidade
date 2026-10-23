import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { eventoValido, novoSegredo, urlValida } from '@/lib/integracoes'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

// Editar: nome, url, eventos, ativo; { novoSegredo: true } gera outro segredo (o antigo para de valer)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  const b = await req.json().catch(() => ({}))
  const atual = (await pool.query(`SELECT * FROM integracao_webhooks WHERE id = $1 AND empresa_id = $2`, [params.id, g.empresaId])).rows[0]
  if (!atual) return NextResponse.json({ error: 'Webhook não encontrado' }, { status: 404 })
  const nome = b.nome !== undefined ? String(b.nome).trim().slice(0, 80) : atual.nome
  const url = b.url !== undefined ? String(b.url).trim() : atual.url
  const eventos: string[] = Array.isArray(b.eventos) ? b.eventos.filter((e: string) => e === '*' || eventoValido(e)) : atual.eventos
  if (!nome) return NextResponse.json({ error: 'Dê um nome para o webhook' }, { status: 400 })
  if (!urlValida(url)) return NextResponse.json({ error: 'URL inválida (use https://...)' }, { status: 400 })
  if (!eventos.length) return NextResponse.json({ error: 'Escolha ao menos um evento' }, { status: 400 })
  const ativo = b.ativo !== undefined ? !!b.ativo : atual.ativo
  const r = await pool.query(
    `UPDATE integracao_webhooks SET nome=$3, url=$4, eventos=$5, ativo=$6, segredo=$7, atualizado_em=now(),
            falhas_seguidas = CASE WHEN $6 AND NOT ativo THEN 0 ELSE falhas_seguidas END
      WHERE id=$1 AND empresa_id=$2 RETURNING *`,
    [params.id, g.empresaId, nome, url, eventos, ativo, b.novoSegredo ? novoSegredo() : atual.segredo],
  )
  return NextResponse.json(r.rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  await pool.query(`DELETE FROM integracao_webhooks WHERE id = $1 AND empresa_id = $2`, [params.id, g.empresaId])
  return NextResponse.json({ ok: true })
}
