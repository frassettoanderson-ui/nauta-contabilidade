import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { EVENTOS } from '@/lib/integracoes'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

// Visão da tela: chaves, webhooks (com contadores) e o catálogo de eventos do perfil ativo
export async function GET() {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  const [chaves, hooks, perfil] = await Promise.all([
    pool.query(`SELECT id, nome, prefixo, escrita, criado_por, criado_em, ultimo_uso, revogada_em FROM integracao_chaves WHERE empresa_id = $1 ORDER BY revogada_em NULLS FIRST, criado_em DESC`, [g.empresaId]),
    pool.query(
      `SELECT w.id, w.nome, w.url, w.eventos, w.segredo, w.ativo, w.falhas_seguidas, w.criado_por, w.criado_em,
              (SELECT COUNT(*)::int FROM integracao_entregas e WHERE e.webhook_id = w.id AND e.status = 'entregue' AND e.criado_em > now() - interval '30 days') AS entregues_30d,
              (SELECT COUNT(*)::int FROM integracao_entregas e WHERE e.webhook_id = w.id AND e.status = 'pendente') AS pendentes,
              (SELECT COUNT(*)::int FROM integracao_entregas e WHERE e.webhook_id = w.id AND e.status = 'falhou' AND e.criado_em > now() - interval '30 days') AS falhas_30d,
              (SELECT MAX(e.criado_em) FROM integracao_entregas e WHERE e.webhook_id = w.id) AS ultimo_aviso
         FROM integracao_webhooks w WHERE w.empresa_id = $1 ORDER BY w.criado_em DESC`, [g.empresaId]),
    pool.query(`SELECT slug, nome FROM empresas WHERE id = $1`, [g.empresaId]),
  ])
  return NextResponse.json({ perfil: perfil.rows[0] ?? null, chaves: chaves.rows, webhooks: hooks.rows, eventos: EVENTOS })
}
