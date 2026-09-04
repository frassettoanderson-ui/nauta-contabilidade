import pool from './db'

// Regra de comissionamento do comercial (definida em 04/09/2026):
//  - 10% de recorrência sobre TODOS os honorários pagos dentro do mês (pelo pago_em);
//  - + 100% do PRIMEIRO honorário pago de cada cliente (a 1ª competência do lead);
//  - apuração sempre do mês anterior: o que foi pago em M é pago ao comercial em M+1.
export const RECORRENCIA_COMISSAO = 0.10

const MES_LONGO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export interface ComissaoItem {
  id: string; lead_id: string; cliente: string; empresa: string; vendedor: string
  competencia: string; pago_em: string; valor: number
  primeiro: boolean; recorrencia: number; primeiro_valor: number; comissao: number
}
export interface ComissaoVendedor {
  vendedor: string; qtd: number; honorarios: number; recorrencia: number; primeiros: number; total: number
}
export interface ComissoesData {
  ano: number; mes: number; label: string; pagarEm: string
  totais: { honorarios: number; recorrencia: number; primeiros: number; total: number; qtd: number; qtdPrimeiros: number }
  porVendedor: ComissaoVendedor[]
  itens: ComissaoItem[]
}

export async function getComissoes(empresaId: string, ano: number, mes: number): Promise<ComissoesData> {
  const ini = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 1)
  const r = await pool.query(
    `SELECT p.id, p.lead_id, l.nome AS cliente, COALESCE(c.emp_nome, '') AS empresa,
            COALESCE(NULLIF(l.responsavel_nome, ''), 'Comercial') AS vendedor,
            to_char(p.competencia, 'YYYY-MM') AS competencia,
            to_char(p.pago_em, 'YYYY-MM-DD') AS pago_em,
            p.valor,
            (p.competencia = (SELECT MIN(x.competencia) FROM financeiro_pagamentos x WHERE x.lead_id = p.lead_id)) AS primeiro
       FROM financeiro_pagamentos p
       JOIN leads l ON l.id = p.lead_id
       LEFT JOIN clientes c ON c.lead_id = l.id
      WHERE p.empresa_id = $1 AND p.pago_em >= $2 AND p.pago_em < $3
      ORDER BY p.pago_em ASC, l.nome ASC`,
    [empresaId, ini, fim]
  )
  const itens: ComissaoItem[] = r.rows.map(row => {
    const valor = Number(row.valor || 0)
    const primeiro = !!row.primeiro
    const recorrencia = +(valor * RECORRENCIA_COMISSAO).toFixed(2)
    const primeiro_valor = primeiro ? valor : 0
    return {
      id: String(row.id), lead_id: String(row.lead_id), cliente: String(row.cliente || ''), empresa: String(row.empresa || ''),
      vendedor: String(row.vendedor), competencia: String(row.competencia), pago_em: String(row.pago_em), valor,
      primeiro, recorrencia, primeiro_valor, comissao: +(recorrencia + primeiro_valor).toFixed(2),
    }
  })
  const totais = { honorarios: 0, recorrencia: 0, primeiros: 0, total: 0, qtd: itens.length, qtdPrimeiros: 0 }
  const porMap = new Map<string, ComissaoVendedor>()
  for (const it of itens) {
    totais.honorarios += it.valor; totais.recorrencia += it.recorrencia; totais.primeiros += it.primeiro_valor; totais.total += it.comissao
    if (it.primeiro) totais.qtdPrimeiros++
    const v = porMap.get(it.vendedor) ?? { vendedor: it.vendedor, qtd: 0, honorarios: 0, recorrencia: 0, primeiros: 0, total: 0 }
    v.qtd++; v.honorarios += it.valor; v.recorrencia += it.recorrencia; v.primeiros += it.primeiro_valor; v.total += it.comissao
    porMap.set(it.vendedor, v)
  }
  const pag = new Date(ano, mes, 1) // mês seguinte
  return {
    ano, mes, label: `${MES_LONGO[mes - 1]} / ${ano}`,
    pagarEm: `${MES_LONGO[pag.getMonth()]} / ${pag.getFullYear()}`,
    totais, porVendedor: Array.from(porMap.values()).sort((a, b) => b.total - a.total), itens,
  }
}
