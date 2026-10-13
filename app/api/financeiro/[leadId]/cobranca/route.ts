import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'
import { alterarDiaVencimento, excluirCobrancaMes } from '@/lib/asaas'
import { syncEmpresaFromLead } from '@/lib/obrigo-sync'

export const dynamic = 'force-dynamic'

// Configuração de cobrança do cliente (seção Financeiro da ficha):
//  GET  → responsável pelo financeiro + dia de vencimento
//  PUT  { nome, email, whatsapp } → salva o responsável (para quem vão boleto, WhatsApp e e-mail)
//  POST { dia } → muda o dia de vencimento (cadastro + boletos em aberto + assinatura Asaas)
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function autorizado() { return !!(await getServerSession(authOptions)) }

export async function GET(_req: NextRequest, { params }: { params: { leadId: string } }) {
  if (!(await autorizado())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const r = await pool.query(
    `SELECT fin_resp_nome, fin_resp_email, fin_resp_whatsapp, to_char(honorario_vencimento,'YYYY-MM-DD') AS venc FROM leads WHERE id = $1`,
    [params.leadId]
  )
  const l = r.rows[0]
  if (!l) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  return NextResponse.json({
    responsavel: { nome: l.fin_resp_nome ?? '', email: l.fin_resp_email ?? '', whatsapp: l.fin_resp_whatsapp ?? '' },
    diaVencimento: l.venc ? Number(l.venc.slice(8, 10)) : null,
    primeiroVencimento: l.venc ?? null,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { leadId: string } }) {
  if (!(await autorizado())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const nome = String(b.nome ?? '').trim()
  const email = String(b.email ?? '').trim()
  const whats = String(b.whatsapp ?? '').trim()
  const dig = whats.replace(/\D/g, '')
  if (email && !EMAIL_OK.test(email)) return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  if (whats && dig.length !== 10 && dig.length !== 11) return NextResponse.json({ error: 'WhatsApp inválido — use DDD + número' }, { status: 400 })
  await pool.query(
    `UPDATE leads SET fin_resp_nome = $2, fin_resp_email = $3, fin_resp_whatsapp = $4 WHERE id = $1`,
    [params.leadId, nome || null, email || null, whats || null]
  )
  return NextResponse.json({ ok: true })
}

// DELETE ?competencia=YYYY-MM → exclui a cobrança do mês (apaga no Asaas + mês dispensado). Só se não paga.
export async function DELETE(req: NextRequest, { params }: { params: { leadId: string } }) {
  if (!(await autorizado())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    return NextResponse.json(await excluirCobrancaMes(params.leadId, req.nextUrl.searchParams.get('competencia') || ''))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  if (!(await autorizado())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  try {
    const res = await alterarDiaVencimento(params.leadId, Number(b.dia))
    await syncEmpresaFromLead(params.leadId) // Obrigô: dia/1º vencimento da ficha
    return NextResponse.json(res)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
