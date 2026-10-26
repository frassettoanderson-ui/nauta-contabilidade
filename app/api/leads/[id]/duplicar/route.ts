import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'
import { insertLead, updateLead } from '@/lib/leads'
import { empresaAtivaId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

// Duplica o card do CRM: mesmo contato, interesse, origem, responsável e negociação, na mesma
// coluna, com "(cópia)" no nome. Não copia contrato, cadastro da empresa nem onboarding.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const empresaId = await empresaAtivaId()
  const l = (await pool.query(`SELECT * FROM leads WHERE id = $1 AND ($2::uuid IS NULL OR empresa_id = $2)`, [params.id, empresaId])).rows[0]
  if (!l) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  const novo = await insertLead({
    nome: `${l.nome} (cópia)`, whatsapp: l.whatsapp ?? '', email: l.email ?? '', interesse: l.interesse ?? '',
    etapa: l.etapa ?? 'novo', classificacao: l.classificacao ?? 0,
    responsavel_id: l.responsavel_id ?? null, responsavel_nome: l.responsavel_nome ?? null,
    origem: l.origem ?? null, indicado_por: l.indicado_por ?? null, empresa_id: l.empresa_id ?? empresaId,
  })
  await updateLead(novo.id, {
    valor_honorario: l.valor_honorario, valor_abertura: l.valor_abertura,
    honorario_vencimento: l.honorario_vencimento, negociacao_obs: l.negociacao_obs,
  })
  if (l.contabilidade) await pool.query(`UPDATE leads SET contabilidade = $2 WHERE id = $1`, [novo.id, l.contabilidade])
  return NextResponse.json({ ok: true, id: novo.id })
}
