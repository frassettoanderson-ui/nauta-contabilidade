import pool from './db'
import { calcStatusFinanceiro, vencimentoAjustado, contarDiasUteis } from './financeiro-calc'
import { getMeta } from './metas'

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// 10% de recorrência sobre o honorário (o que a Nauta ganha).
export const RECORRENCIA_PCT = 0.10

export interface DashboardData {
  meses: string[]
  resultadoMes: number
  recebidoSerie: number[]
  aReceberMes: number
  aReceberSerie: number[]
  vencidosCount: number
  vencidosSerie: number[]
  clientesAtivos: number
  valorEmAberto: number
  // CNPJs = matrizes (clientes não inativos) + filiais cadastradas
  cnpjsAtivos: number
  // CNPJs perdidos no mês atual (clientes marcados como inativos no mês) — métrica mensal, não acumulativa
  cnpjsPerdidosMes: number
  // Clientes (só matrizes) inativados no mês — para o saldo líquido "novos − perdidos"
  clientesPerdidosMes: number
  // Índice do mês atual dentro de `meses` (a série vai até o mês seguinte)
  mesAtualIdx: number
  // Rótulos dos 3 meses (anterior / atual / seguinte), ex.: "ago" / "set" / "out"
  labels: { anterior: string; atual: string; seguinte: string }
  clientesNovos: {
    anterior: number; atual: number; projecao: number
    projecaoMaiorQueAnterior: boolean
    diasUteisDecorridos: number; diasUteisTotais: number
  }
  faturamento: { mesAtual: number; projecaoMesAtual: number; mesAnterior: number; projecaoMesSeguinte: number }
  // Faturamento (honorário mensal) trazido pelos clientes novos do mês atual
  faturamentoNovosClientes: number
  // Meta de clientes do mês (cadastrada em Comercial → Cadastrar meta)
  metaClientes: number
  primeiroHonorario: { anterior: number; atualEsperado: number; atualRealizado: number; seguinte: number }
  recorrencia: { anteriorRealizado: number; atualEsperado: number; atualRealizado: number; seguinteEsperado: number }
}

export async function getDashboard(empresaId: string): Promise<DashboardData> {
  const leads = (await pool.query(
    `SELECT id, valor_honorario, honorario_vencimento FROM leads WHERE financeiro_ativo = true AND empresa_id = $1`,
    [empresaId]
  )).rows

  // Base ampla p/ métricas de honorário/vencimento: inclui clientes já fechados
  // (com vencimento definido) mesmo antes de virarem financeiro_ativo (senão o
  // "1º honorário" e as projeções escondem quem fechou e ainda está no onboarding).
  const leadsBilling = (await pool.query(
    `SELECT l.id, l.valor_honorario, l.honorario_vencimento FROM leads l
      WHERE l.empresa_id = $1 AND l.valor_honorario > 0 AND l.honorario_vencimento IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM clientes c WHERE c.lead_id = l.id AND c.situacao = 'inativo')`,
    [empresaId]
  )).rows

  const pagamentos = (await pool.query(
    `SELECT lead_id, to_char(competencia,'YYYY-MM') AS comp, valor, to_char(pago_em,'YYYY-MM') AS pago_mes
       FROM financeiro_pagamentos WHERE empresa_id = $1`,
    [empresaId]
  )).rows

  const paidByLead: Record<string, Set<string>> = {}
  const recebidoByMonth: Record<string, number> = {}
  for (const p of pagamentos) {
    (paidByLead[p.lead_id] ||= new Set()).add(p.comp)
    if (p.pago_mes) recebidoByMonth[p.pago_mes] = (recebidoByMonth[p.pago_mes] || 0) + Number(p.valor || 0)
  }

  // Clientes novos = mês da PRIMEIRA assinatura de contrato de cada lead.
  const novosByMonth: Record<string, number> = {}
  for (const r of (await pool.query(
    `SELECT to_char(t.primeiro, 'YYYY-MM') AS mes, COUNT(*)::int AS n FROM (
        SELECT c.lead_id, MIN(c.atualizado_em) AS primeiro
        FROM contratos c JOIN leads l ON l.id = c.lead_id
        WHERE l.empresa_id = $1 AND c.autentique_status = 'assinado'
        GROUP BY c.lead_id
      ) t GROUP BY 1`,
    [empresaId]
  )).rows) {
    novosByMonth[r.mes] = Number(r.n || 0)
  }

  const now = new Date()
  // 12 meses: 10 anteriores + atual + seguinte (o painel mostra o esperado do próximo mês)
  const months: { key: string; label: string }[] = []
  for (let i = 10; i >= -1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MES[d.getMonth()] })
  }
  const mesAtualIdx = months.length - 2

  const recebidoSerie: number[] = []
  const aReceberSerie: number[] = []
  const vencidosSerie: number[] = []

  for (const m of months) {
    const [yy, mm] = m.key.split('-').map(Number)
    const monthIdx = mm - 1
    const ehAtual = yy === now.getFullYear() && monthIdx === now.getMonth()
    const ehFuturo = new Date(yy, monthIdx, 1) > new Date(now.getFullYear(), now.getMonth(), 1)
    const ref = ehAtual ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : new Date(yy, monthIdx + 1, 0)
    const fimMes = new Date(yy, monthIdx, 1)

    let faturado = 0
    let vencidos = 0
    for (const l of leads) {
      const venc0 = new Date(l.honorario_vencimento)
      if (isNaN(venc0.getTime())) continue
      const startM = new Date(venc0.getFullYear(), venc0.getMonth(), 1)
      if (startM > fimMes) continue // ainda não faturava neste mês

      faturado += Number(l.valor_honorario || 0)

      const paid = paidByLead[l.id] ?? new Set<string>()
      const dia = venc0.getDate()
      let overdue = false
      for (const cm = new Date(startM); cm <= fimMes; cm.setMonth(cm.getMonth() + 1)) {
        const comp = `${cm.getFullYear()}-${String(cm.getMonth() + 1).padStart(2, '0')}`
        if (paid.has(comp)) continue
        if (vencimentoAjustado(dia, cm.getFullYear(), cm.getMonth()) < ref) { overdue = true; break }
      }
      if (overdue) vencidos++
    }

    recebidoSerie.push(recebidoByMonth[m.key] || 0)
    aReceberSerie.push(faturado)
    vencidosSerie.push(ehFuturo ? 0 : vencidos) // mês futuro ainda não tem atraso
  }

  // Snapshot atual (cards)
  let aVencerSum = 0
  let atrasadoCount = 0
  let valorEmAberto = 0
  for (const l of leads) {
    const r = calcStatusFinanceiro(l.honorario_vencimento, paidByLead[l.id] ?? new Set<string>())
    if (r.status === 'a_vencer') aVencerSum += Number(l.valor_honorario || 0)
    if (r.status === 'atrasado') { atrasadoCount++; valorEmAberto += Number(l.valor_honorario || 0) }
  }
  const clientesAtivos = leads.length

  // ── Métricas dos 3 meses (anterior / atual / seguinte) ──────────────────
  const y = now.getFullYear(), mi = now.getMonth()
  const mkey = (yy: number, mm: number) => `${yy}-${String(mm + 1).padStart(2, '0')}`
  const ant = new Date(y, mi - 1, 1)
  const seg = new Date(y, mi + 1, 1)
  const kAnt = mkey(ant.getFullYear(), ant.getMonth())
  const kAtu = mkey(y, mi)

  // Soma dos honorários ATIVOS que vencem no mês (base recorrente do mês).
  const vencimentosNoMes = (yy: number, mm: number) => {
    const alvo = new Date(yy, mm, 1)
    let s = 0
    for (const l of leadsBilling) {
      const v = new Date(l.honorario_vencimento)
      if (isNaN(v.getTime())) continue
      if (new Date(v.getFullYear(), v.getMonth(), 1) <= alvo) s += Number(l.valor_honorario || 0)
    }
    return s
  }
  // Primeiros honorários = leads cujo 1º vencimento cai no mês.
  const primeiroHonMes = (yy: number, mm: number, apenasPagos = false) => {
    let s = 0
    for (const l of leadsBilling) {
      const v = new Date(l.honorario_vencimento)
      if (isNaN(v.getTime())) continue
      if (v.getFullYear() === yy && v.getMonth() === mm) {
        if (apenasPagos && !(paidByLead[l.id]?.has(mkey(yy, mm)))) continue
        s += Number(l.valor_honorario || 0)
      }
    }
    return s
  }

  const novosAnterior = novosByMonth[kAnt] || 0
  const novosAtual = novosByMonth[kAtu] || 0
  const hoje = new Date(y, mi, now.getDate())
  const diasUteisDecorridos = contarDiasUteis(new Date(y, mi, 1), hoje)
  const diasUteisTotais = contarDiasUteis(new Date(y, mi, 1), new Date(y, mi + 1, 0))
  const projecaoNovos = diasUteisDecorridos > 0
    ? Math.round((novosAtual / diasUteisDecorridos) * diasUteisTotais)
    : novosAtual

  const fatMesAtual = recebidoByMonth[kAtu] || 0
  const fatMesAnterior = recebidoByMonth[kAnt] || 0
  const projFatAtual = vencimentosNoMes(y, mi)
  const projFatSeguinte = vencimentosNoMes(seg.getFullYear(), seg.getMonth())

  // Faturamento (honorário mensal) trazido pelos clientes NOVOS do mês atual:
  // soma do honorário dos leads cuja PRIMEIRA assinatura de contrato caiu no mês.
  const fatNovosRow = await pool.query(
    `SELECT COALESCE(SUM(l.valor_honorario), 0) AS total FROM (
        SELECT c.lead_id, MIN(c.atualizado_em) AS primeiro
        FROM contratos c JOIN leads l0 ON l0.id = c.lead_id
        WHERE l0.empresa_id = $1 AND c.autentique_status = 'assinado'
        GROUP BY c.lead_id
      ) t
      JOIN leads l ON l.id = t.lead_id
      WHERE to_char(t.primeiro, 'YYYY-MM') = $2`,
    [empresaId, kAtu]
  )
  const faturamentoNovosClientes = Number(fatNovosRow.rows[0]?.total || 0)

  // Meta de clientes do mês (cadastrada em Comercial → Cadastrar meta)
  const { metaClientes } = await getMeta(empresaId, kAtu)

  // CNPJs ativos = matrizes (clientes não inativos) + filiais cadastradas (emp_filiais JSONB)
  const cnpjRow = await pool.query(
    `SELECT COUNT(*)::int AS matrizes,
            COALESCE(SUM(CASE WHEN jsonb_typeof(emp_filiais) = 'array' THEN jsonb_array_length(emp_filiais) ELSE 0 END), 0)::int AS filiais
       FROM clientes WHERE empresa_id = $1 AND COALESCE(situacao, 'ativo') <> 'inativo'`,
    [empresaId]
  )
  const cnpjsAtivos = Number(cnpjRow.rows[0]?.matrizes || 0) + Number(cnpjRow.rows[0]?.filiais || 0)
  // CNPJs perdidos no mês = clientes inativados dentro do mês atual (+ suas filiais)
  const perdRow = await pool.query(
    `SELECT COUNT(*)::int AS matrizes,
            COALESCE(SUM(CASE WHEN jsonb_typeof(emp_filiais) = 'array' THEN jsonb_array_length(emp_filiais) ELSE 0 END), 0)::int AS filiais
       FROM clientes
      WHERE empresa_id = $1 AND situacao = 'inativo'
        AND inativado_em >= date_trunc('month', NOW()) AND inativado_em < date_trunc('month', NOW()) + INTERVAL '1 month'`,
    [empresaId]
  )
  const clientesPerdidosMes = Number(perdRow.rows[0]?.matrizes || 0)
  const cnpjsPerdidosMes = clientesPerdidosMes + Number(perdRow.rows[0]?.filiais || 0)

  const primAnterior = primeiroHonMes(ant.getFullYear(), ant.getMonth())
  const primAtualEsperado = primeiroHonMes(y, mi)
  const primAtualRealizado = primeiroHonMes(y, mi, true)
  const primSeguinte = primeiroHonMes(seg.getFullYear(), seg.getMonth())

  const R = RECORRENCIA_PCT
  return {
    meses: months.map(m => m.label),
    mesAtualIdx,
    cnpjsAtivos,
    cnpjsPerdidosMes,
    clientesPerdidosMes,
    resultadoMes: recebidoByMonth[kAtu] || 0,
    recebidoSerie,
    aReceberMes: aVencerSum,
    aReceberSerie,
    vencidosCount: atrasadoCount,
    vencidosSerie,
    clientesAtivos,
    valorEmAberto,
    labels: { anterior: MES[ant.getMonth()], atual: MES[mi], seguinte: MES[seg.getMonth()] },
    clientesNovos: {
      anterior: novosAnterior, atual: novosAtual, projecao: projecaoNovos,
      projecaoMaiorQueAnterior: projecaoNovos > novosAnterior,
      diasUteisDecorridos, diasUteisTotais,
    },
    faturamento: { mesAtual: fatMesAtual, projecaoMesAtual: projFatAtual, mesAnterior: fatMesAnterior, projecaoMesSeguinte: projFatSeguinte },
    faturamentoNovosClientes,
    metaClientes,
    primeiroHonorario: { anterior: primAnterior, atualEsperado: primAtualEsperado, atualRealizado: primAtualRealizado, seguinte: primSeguinte },
    recorrencia: {
      anteriorRealizado: fatMesAnterior * R,
      atualEsperado: projFatAtual * R,
      atualRealizado: fatMesAtual * R,
      seguinteEsperado: projFatSeguinte * R,
    },
  }
}
