import pool from './db'

// Regra de comissionamento do setor comercial (definida em 04/09/2026):
//  - 10% de recorrência sobre os honorários pagos dentro do mês (pelo pago_em), a partir do 2º honorário;
//  - 100% do PRIMEIRO honorário pago de cada cliente (a 1ª competência do lead) — SEM os 10% (senão pagaria 2x);
//  - apuração sempre do mês anterior: o que foi pago em M é pago ao comercial em M+1.
// Não há vendedor individual — a comissão é do setor comercial como um todo.
export const RECORRENCIA_COMISSAO = 0.10

const MES_LONGO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export interface ComissaoItem {
  id: string; lead_id: string; cliente: string; empresa: string
  competencia: string; pago_em: string; valor: number
  primeiro: boolean; recorrencia: number; primeiro_valor: number; comissao: number
}
export interface ComissaoTotais { honorarios: number; recorrencia: number; primeiros: number; total: number; qtd: number; qtdPrimeiros: number }
export interface ComissaoEsperadoItem { lead_id: string; cliente: string; empresa: string; vencimento: string; valor: number; primeiro: boolean }
export interface ComissoesData {
  ano: number; mes: number; label: string; pagarEm: string
  // Realizado: honorários efetivamente pagos no mês
  totais: ComissaoTotais
  itens: ComissaoItem[]
  // Expectativa: honorários que VENCEM no mês (clientes ativos), com o 1º honorário identificado
  esperado: ComissaoTotais
  esperadoItens: ComissaoEsperadoItem[]
}

const zero = (): ComissaoTotais => ({ honorarios: 0, recorrencia: 0, primeiros: 0, total: 0, qtd: 0, qtdPrimeiros: 0 })
const r2 = (n: number) => +n.toFixed(2)

export async function getComissoes(empresaId: string, ano: number, mes: number): Promise<ComissoesData> {
  const ini = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 1)

  // ── Realizado (pago_em dentro do mês) ──────────────────────────────────────
  const r = await pool.query(
    `SELECT p.id, p.lead_id, l.nome AS cliente, COALESCE(c.emp_nome, '') AS empresa,
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
    const recorrencia = primeiro ? 0 : r2(valor * RECORRENCIA_COMISSAO) // 1º honorário não gera os 10%
    const primeiro_valor = primeiro ? valor : 0
    return {
      id: String(row.id), lead_id: String(row.lead_id), cliente: String(row.cliente || ''), empresa: String(row.empresa || ''),
      competencia: String(row.competencia), pago_em: String(row.pago_em), valor,
      primeiro, recorrencia, primeiro_valor, comissao: r2(recorrencia + primeiro_valor),
    }
  })
  const totais = zero()
  for (const it of itens) {
    totais.honorarios += it.valor; totais.recorrencia += it.recorrencia; totais.primeiros += it.primeiro_valor; totais.total += it.comissao
    totais.qtd++; if (it.primeiro) totais.qtdPrimeiros++
  }

  // ── Expectativa (vencimentos do mês) ───────────────────────────────────────
  // Clientes com honorário e 1º vencimento definido, ativos (contrato não cancelado),
  // cujo 1º vencimento é até o mês consultado. O 1º honorário é o lead cujo 1º vencimento cai NO mês.
  const e = await pool.query(
    `SELECT l.id AS lead_id, l.nome AS cliente, COALESCE(c.emp_nome, '') AS empresa,
            l.valor_honorario AS valor, l.honorario_vencimento,
            (date_trunc('month', l.honorario_vencimento) = $2::date) AS primeiro
       FROM leads l
       LEFT JOIN clientes c ON c.lead_id = l.id
      WHERE l.empresa_id = $1 AND l.valor_honorario > 0 AND l.honorario_vencimento IS NOT NULL
        AND date_trunc('month', l.honorario_vencimento) <= $2::date
        AND COALESCE(c.situacao, 'ativo') <> 'inativo'
      ORDER BY primeiro DESC, l.nome ASC`,
    [empresaId, ini]
  )
  const esperadoItens: ComissaoEsperadoItem[] = e.rows.map(row => {
    const v = new Date(row.honorario_vencimento)
    const dia = String(v.getDate()).padStart(2, '0')
    return {
      lead_id: String(row.lead_id), cliente: String(row.cliente || ''), empresa: String(row.empresa || ''),
      vencimento: `${dia}/${String(mes).padStart(2, '0')}/${ano}`,
      valor: Number(row.valor || 0), primeiro: !!row.primeiro,
    }
  })
  const esperado = zero()
  for (const it of esperadoItens) {
    esperado.honorarios += it.valor
    if (!it.primeiro) esperado.recorrencia += it.valor * RECORRENCIA_COMISSAO
    if (it.primeiro) { esperado.primeiros += it.valor; esperado.qtdPrimeiros++ }
    esperado.qtd++
  }
  esperado.recorrencia = r2(esperado.recorrencia)
  esperado.total = r2(esperado.recorrencia + esperado.primeiros)

  const pag = new Date(ano, mes, 1) // mês seguinte
  return {
    ano, mes, label: `${MES_LONGO[mes - 1]} / ${ano}`,
    pagarEm: `${MES_LONGO[pag.getMonth()]} / ${pag.getFullYear()}`,
    totais: { ...totais, recorrencia: r2(totais.recorrencia), total: r2(totais.total) },
    itens, esperado, esperadoItens,
  }
}
