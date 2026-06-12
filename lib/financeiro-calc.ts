// Cálculo de status financeiro (dia útil, feriados nacionais, atraso) — client-safe.

function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}

// Páscoa (algoritmo de Meeus/Gregoriano)
function pascoa(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
    f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, month - 1, day)
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const cacheFeriados: Record<number, Set<string>> = {}
function feriadosDoAno(y: number): Set<string> {
  if (cacheFeriados[y]) return cacheFeriados[y]
  const s = new Set<string>()
  // Fixos nacionais
  for (const [mm, dd] of [[1, 1], [4, 21], [5, 1], [9, 7], [10, 12], [11, 2], [11, 15], [11, 20], [12, 25]]) {
    s.add(`${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`)
  }
  // Móveis (a partir da Páscoa)
  const p = pascoa(y)
  s.add(ymd(addDays(p, -48))) // Carnaval segunda
  s.add(ymd(addDays(p, -47))) // Carnaval terça
  s.add(ymd(addDays(p, -2)))  // Sexta-feira Santa
  s.add(ymd(addDays(p, 60)))  // Corpus Christi
  cacheFeriados[y] = s
  return s
}

export function isDiaUtil(d: Date): boolean {
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return false // domingo/sábado
  return !feriadosDoAno(d.getFullYear()).has(ymd(d))
}

/** Avança para o próximo dia útil se cair em fim de semana/feriado. */
export function proximoDiaUtil(d: Date): Date {
  const x = new Date(d)
  while (!isDiaUtil(x)) x.setDate(x.getDate() + 1)
  return x
}

const ultimoDia = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

/** Vencimento do mês ajustado para dia útil. */
export function vencimentoAjustado(dia: number, year: number, monthIndex: number): Date {
  const d = new Date(year, monthIndex, Math.min(dia, ultimoDia(year, monthIndex)))
  return proximoDiaUtil(d)
}

export type StatusFin = 'em_dia' | 'a_vencer' | 'atrasado'

export interface ResultadoFin {
  status: StatusFin
  mesesAtraso: number
  proximoVencimento: Date | null
}

const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/**
 * Calcula status a partir do 1º vencimento e dos meses pagos (Set de 'YYYY-MM').
 * Recorrência mensal no dia do 1º vencimento.
 */
export function calcStatusFinanceiro(primeiroVenc: string | Date, pagos: Set<string>, hoje = new Date()): ResultadoFin {
  const pv = new Date(primeiroVenc)
  if (isNaN(pv.getTime())) return { status: 'em_dia', mesesAtraso: 0, proximoVencimento: null }
  const dia = pv.getDate()
  const hoje0 = inicioDia(hoje)

  let mesesAtraso = 0
  let aVencer = false
  let primeiroNaoPago: Date | null = null

  const start = new Date(pv.getFullYear(), pv.getMonth(), 1)
  const cur = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  for (const m = new Date(start); m <= cur; m.setMonth(m.getMonth() + 1)) {
    const comp = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
    const venc = vencimentoAjustado(dia, m.getFullYear(), m.getMonth())
    if (pagos.has(comp)) continue
    if (!primeiroNaoPago) primeiroNaoPago = venc
    if (venc < hoje0) mesesAtraso++          // já venceu e não pagou
    else aVencer = true                       // vence neste mês, ainda no prazo
  }

  let status: StatusFin = 'em_dia'
  if (mesesAtraso > 0) status = 'atrasado'
  else if (aVencer) status = 'a_vencer'

  // Próximo vencimento relevante: 1º em aberto, ou o do próximo mês
  let proximoVencimento = primeiroNaoPago
  if (!proximoVencimento) {
    const nm = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    proximoVencimento = vencimentoAjustado(dia, nm.getFullYear(), nm.getMonth())
  }

  return { status, mesesAtraso, proximoVencimento }
}
