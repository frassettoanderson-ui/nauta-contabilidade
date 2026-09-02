import pool from './db'
import { calcStatusFinanceiro, vencimentoAjustado, contarDiasUteis } from './financeiro-calc'

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
  // Rótulos dos 3 meses (anterior / atual / seguinte), ex.: "ago" / "set" / "out"
  labels: { anterior: string; atual: string; seguinte: string }
  clientesNovos: {
    anterior: number; atual: number; projecao: number
    projecaoMaiorQueAnterior: boolean
    diasUteisDecorridos: number; diasUteisTotais: number
  }
  faturamento: { mesAtual: number; projecaoMesAtual: number; mesAnterior: number; projecaoMesSeguinte: number }
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
    `SELECT id, valor_honorario, honorario_vencimento FROM leads
      WHERE empresa_id = $1 AND valor_honorario > 0 AND honorario_vencimento IS NOT NULL`,
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
  const months: { key: string; label: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MES[d.getMonth()] })
  }

  const recebidoSerie: number[] = []
  const aReceberSerie: number[] = []
  const vencidosSerie: number[] = []

  for (const m of months) {
    const [yy, mm] = m.key.split('-').map(Number)
    const monthIdx = mm - 1
    const ehAtual = yy === now.getFullYear() && monthIdx === now.getMonth()
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
    vencidosSerie.push(vencidos)
  }

  // Snapshot atual (cards)
  let aVencerSum = 0
  let atrasadoCount = 0
  for (const l of leads) {
    const r = calcStatusFinanceiro(l.honorario_vencimento, paidByLead[l.id] ?? new Set<string>())
    if (r.status === 'a_vencer') aVencerSum += Number(l.valor_honorario || 0)
    if (r.status === 'atrasado') atrasadoCount++
  }

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

  const primAnterior = primeiroHonMes(ant.getFullYear(), ant.getMonth())
  const primAtualEsperado = primeiroHonMes(y, mi)
  const primAtualRealizado = primeiroHonMes(y, mi, true)
  const primSeguinte = primeiroHonMes(seg.getFullYear(), seg.getMonth())

  const R = RECORRENCIA_PCT
  const curKey = months[months.length - 1].key
  return {
    meses: months.map(m => m.label),
    resultadoMes: recebidoByMonth[curKey] || 0,
    recebidoSerie,
    aReceberMes: aVencerSum,
    aReceberSerie,
    vencidosCount: atrasadoCount,
    vencidosSerie,
    labels: { anterior: MES[ant.getMonth()], atual: MES[mi], seguinte: MES[seg.getMonth()] },
    clientesNovos: {
      anterior: novosAnterior, atual: novosAtual, projecao: projecaoNovos,
      projecaoMaiorQueAnterior: projecaoNovos > novosAnterior,
      diasUteisDecorridos, diasUteisTotais,
    },
    faturamento: { mesAtual: fatMesAtual, projecaoMesAtual: projFatAtual, mesAnterior: fatMesAnterior, projecaoMesSeguinte: projFatSeguinte },
    primeiroHonorario: { anterior: primAnterior, atualEsperado: primAtualEsperado, atualRealizado: primAtualRealizado, seguinte: primSeguinte },
    recorrencia: {
      anteriorRealizado: fatMesAnterior * R,
      atualEsperado: projFatAtual * R,
      atualRealizado: fatMesAtual * R,
      seguinteEsperado: projFatSeguinte * R,
    },
  }
}
