// ─── Mês de referência do honorário ─────────────────────────────────────────
// Regra do escritório: o boleto cobra os serviços do MÊS ANTERIOR ao vencimento
// (vence 10/10 → referente a setembro). Internamente a mensalidade é guardada pelo
// mês do VENCIMENTO ('competencia' = YYYY-MM-01 do vencimento); aqui só se calcula o rótulo.

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** Recebe o mês do vencimento ('YYYY-MM' ou 'YYYY-MM-DD') e devolve o mês dos serviços. */
export function referenciaDe(mesVencimento: string | null | undefined): { ym: string; curto: string; extenso: string } | null {
  const m = /^(\d{4})-(\d{2})/.exec(String(mesVencimento ?? ''))
  if (!m) return null
  let ano = Number(m[1]), mes = Number(m[2]) - 1 // 1..12 → mês anterior (1..12)
  if (mes === 0) { mes = 12; ano-- }
  const mm = String(mes).padStart(2, '0')
  return { ym: `${ano}-${mm}`, curto: `${mm}/${ano}`, extenso: `${MESES[mes - 1]}/${ano}` }
}
