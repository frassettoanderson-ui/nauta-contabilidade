import pool from './db'
import { calcStatusFinanceiro, vencimentoAjustado } from './financeiro-calc'

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface DashboardData {
  meses: string[]
  resultadoMes: number
  recebidoSerie: number[]
  aReceberMes: number
  aReceberSerie: number[]
  vencidosCount: number
  vencidosSerie: number[]
}

export async function getDashboard(): Promise<DashboardData> {
  const leads = (await pool.query(
    `SELECT id, valor_honorario, honorario_vencimento FROM leads WHERE financeiro_ativo = true`
  )).rows

  const pagamentos = (await pool.query(
    `SELECT lead_id, to_char(competencia,'YYYY-MM') AS comp, valor, to_char(pago_em,'YYYY-MM') AS pago_mes
       FROM financeiro_pagamentos`
  )).rows

  const paidByLead: Record<string, Set<string>> = {}
  const recebidoByMonth: Record<string, number> = {}
  for (const p of pagamentos) {
    (paidByLead[p.lead_id] ||= new Set()).add(p.comp)
    if (p.pago_mes) recebidoByMonth[p.pago_mes] = (recebidoByMonth[p.pago_mes] || 0) + Number(p.valor || 0)
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

  const curKey = months[months.length - 1].key
  return {
    meses: months.map(m => m.label),
    resultadoMes: recebidoByMonth[curKey] || 0,
    recebidoSerie,
    aReceberMes: aVencerSum,
    aReceberSerie,
    vencidosCount: atrasadoCount,
    vencidosSerie,
  }
}
