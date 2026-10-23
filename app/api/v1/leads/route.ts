import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { comChave, erroApi } from '@/lib/api-publica'
import { montarLead } from '@/lib/integracoes'
import { insertLead } from '@/lib/leads'

export const dynamic = 'force-dynamic'

// Leads do perfil, mais novos primeiro. ?desde=<ISO> (criados depois), ?etapa=, ?limite= (até 200)
export async function GET(req: NextRequest) {
  const a = await comChave(req)
  if (a instanceof NextResponse) return a
  const sp = req.nextUrl.searchParams
  const cond = ['empresa_id = $1'], vals: unknown[] = [a.empresaId]
  const desde = sp.get('desde')
  if (desde) { if (isNaN(Date.parse(desde))) return erroApi(400, 'data_invalida', 'Use ?desde=2026-10-23T10:00:00Z'); vals.push(desde); cond.push(`criado_em > $${vals.length}`) }
  if (sp.get('etapa')) { vals.push(sp.get('etapa')); cond.push(`etapa = $${vals.length}`) }
  const limite = Math.min(200, Math.max(1, Number(sp.get('limite')) || 50))
  const r = await pool.query(`SELECT * FROM leads WHERE ${cond.join(' AND ')} ORDER BY criado_em DESC LIMIT ${limite}`, vals)
  return NextResponse.json({ dados: r.rows.map((l) => montarLead(l)), total: r.rows.length })
}

// Cria um lead (entra na coluna "Novo" do CRM e dispara o webhook lead.criado). Precisa de chave com escrita.
export async function POST(req: NextRequest) {
  const a = await comChave(req, true)
  if (a instanceof NextResponse) return a
  const b = await req.json().catch(() => ({}))
  const nome = String(b.nome ?? '').trim()
  const whatsapp = String(b.whatsapp ?? '').replace(/\D/g, '')
  const email = String(b.email ?? '').trim()
  if (!nome) return erroApi(422, 'nome_obrigatorio', 'Informe o nome.')
  if (!whatsapp && !email) return erroApi(422, 'contato_obrigatorio', 'Informe whatsapp ou email.')
  const lead = await insertLead({
    nome: nome.slice(0, 200), whatsapp, email: email.slice(0, 200), interesse: String(b.interesse ?? 'Outro').slice(0, 100),
    origem: String(b.origem ?? `API: ${a.nome}`).slice(0, 100), indicado_por: b.indicado_por ? String(b.indicado_por).slice(0, 200) : null,
    empresa_id: a.empresaId,
  })
  return NextResponse.json(montarLead(lead), { status: 201 })
}
