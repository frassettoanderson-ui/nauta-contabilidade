import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

// Histórico financeiro de um cliente (por lead do ERP), mês a mês. Combina:
//  1) cobranças Asaas (financeiro_cobrancas) — com linha do tempo de envios/pagamento;
//  2) pagamentos já lançados (financeiro_pagamentos) — baixas manuais/histórico;
//  3) meses "esperados" pelo honorário + dia de vencimento (inclui o mês atual a vencer/vencido).
// Usado pela seção "Financeiro" da ficha do Obrigô (chamada à Nauta por nautaLeadId).
const PAGO = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'])
const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const ultimoDia = (y: number, m: number) => new Date(y, m, 0).getDate()

interface Mes {
  competencia: string; vencimento: string; valor: number; status: string;
  pagoEm: string | null; invoiceUrl: string | null;
  envios: { tipo: string; canal: string; ok: boolean; em: string }[];
}

function statusPorPagamento(pagoEm: string | null, venc: string): string {
  if (!pagoEm) return '';
  const pd = new Date(pagoEm.slice(0, 10)); const vd = new Date(venc);
  return pd < vd ? 'pago_antes' : pd > vd ? 'pago_depois' : 'pago_dia';
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const leadId = req.nextUrl.searchParams.get('lead') || ''
  if (!leadId) return NextResponse.json({ error: 'lead ausente' }, { status: 400 })

  const lead = (await pool.query(
    `SELECT valor_honorario, to_char(honorario_vencimento,'YYYY-MM-DD') AS venc0 FROM leads WHERE id = $1`, [leadId]
  )).rows[0]
  const honorario = Number(lead?.valor_honorario ?? 0)
  const vencDia = lead?.venc0 ? Number(lead.venc0.slice(8, 10)) : 10

  const cobr = (await pool.query(
    `SELECT id, to_char(competencia,'YYYY-MM') AS comp, to_char(vencimento,'YYYY-MM-DD') AS venc,
            valor, status, to_char(pago_em,'YYYY-MM-DD"T"HH24:MI:SS') AS pago_em, invoice_url
       FROM financeiro_cobrancas WHERE lead_id = $1`, [leadId]
  )).rows
  const pagtos = (await pool.query(
    `SELECT to_char(competencia,'YYYY-MM') AS comp, valor, to_char(pago_em,'YYYY-MM-DD"T"HH24:MI:SS') AS pago_em
       FROM financeiro_pagamentos WHERE lead_id = $1`, [leadId]
  )).rows
  const envs = (await pool.query(
    `SELECT cobranca_id, tipo, canal, ok, to_char(criado_em,'YYYY-MM-DD"T"HH24:MI:SS') AS em
       FROM cobranca_envios WHERE lead_id = $1 ORDER BY criado_em ASC`, [leadId]
  )).rows
  const envByCob: Record<string, { tipo: string; canal: string; ok: boolean; em: string }[]> = {}
  for (const e of envs) (envByCob[e.cobranca_id] ??= []).push({ tipo: e.tipo, canal: e.canal, ok: e.ok, em: e.em })

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const vencDe = (comp: string) => { const y = +comp.slice(0, 4), m = +comp.slice(5, 7); return ymd(y, m, Math.min(vencDia, ultimoDia(y, m))) }
  const map = new Map<string, Mes>()

  // 1) cobranças Asaas (fonte mais rica)
  for (const c of cobr) {
    const pago = PAGO.has(c.status) || !!c.pago_em
    const status = pago ? (statusPorPagamento(c.pago_em, c.venc) || 'pago_dia') : (new Date(c.venc) < hoje ? 'vencido' : 'a_vencer')
    map.set(c.comp, { competencia: c.comp, vencimento: c.venc, valor: Number(c.valor), status, pagoEm: c.pago_em, invoiceUrl: c.invoice_url, envios: envByCob[c.id] ?? [] })
  }
  // 2) pagamentos lançados (histórico/manual) sem cobrança. Sem pago_em = ainda não pago.
  for (const p of pagtos) {
    if (!p.comp || map.has(p.comp)) continue
    const venc = vencDe(p.comp)
    const status = p.pago_em ? (statusPorPagamento(p.pago_em, venc) || 'pago_dia') : (new Date(venc) < hoje ? 'vencido' : 'a_vencer')
    map.set(p.comp, { competencia: p.comp, vencimento: venc, valor: Number(p.valor || honorario), status, pagoEm: p.pago_em, invoiceUrl: null, envios: [] })
  }
  // 3) meses esperados pelo honorário, do 1º vencimento até o mês atual (preenche buracos: a vencer/vencido)
  if (honorario > 0 && lead?.venc0) {
    const ini = new Date(+lead.venc0.slice(0, 4), +lead.venc0.slice(5, 7) - 1, 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    for (let d = new Date(ini); d <= fim; d.setMonth(d.getMonth() + 1)) {
      const comp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (map.has(comp)) continue
      const venc = vencDe(comp)
      map.set(comp, { competencia: comp, vencimento: venc, valor: honorario, status: new Date(venc) < hoje ? 'vencido' : 'a_vencer', pagoEm: null, invoiceUrl: null, envios: [] })
    }
  }

  const meses = [...map.values()].sort((a, b) => (a.vencimento < b.vencimento ? 1 : -1))
  return NextResponse.json({ meses, honorario })
}
