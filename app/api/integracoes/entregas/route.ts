import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

// Histórico de avisos do perfil (?webhookId=, ?status=pendente|entregue|falhou, ?antes=<ISO> p/ paginar)
export async function GET(req: NextRequest) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  const sp = req.nextUrl.searchParams
  const cond = ['e.empresa_id = $1'], vals: unknown[] = [g.empresaId]
  if (sp.get('webhookId')) { vals.push(sp.get('webhookId')); cond.push(`e.webhook_id = $${vals.length}`) }
  if (sp.get('status')) { vals.push(sp.get('status')); cond.push(`e.status = $${vals.length}`) }
  if (sp.get('antes')) { vals.push(sp.get('antes')); cond.push(`e.criado_em < $${vals.length}`) }
  const r = await pool.query(
    `SELECT e.id, e.webhook_id, w.nome AS webhook_nome, e.evento, e.status, e.tentativas, e.proxima_em, e.ultimo_codigo,
            e.ultima_resposta, e.ultimo_erro, e.criado_em, e.entregue_em, e.payload
       FROM integracao_entregas e JOIN integracao_webhooks w ON w.id = e.webhook_id
      WHERE ${cond.join(' AND ')} ORDER BY e.criado_em DESC LIMIT 50`, vals,
  )
  return NextResponse.json(r.rows)
}
