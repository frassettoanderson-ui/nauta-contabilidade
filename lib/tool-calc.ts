// Helpers de cálculo compartilhados pelas ferramentas (valores de referência 2024/2025).

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
export function parseNum(v: string): number {
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
}

// INSS empregado (CLT) — alíquotas progressivas por faixa.
export function inssCLT(salario: number): number {
  const faixas = [
    [1412.0, 0.075], [2666.68, 0.09], [4000.03, 0.12], [7786.02, 0.14],
  ] as const
  let imposto = 0, anterior = 0
  for (const [teto, aliq] of faixas) {
    if (salario > anterior) {
      const base = Math.min(salario, teto) - anterior
      imposto += base * aliq
      anterior = teto
    }
  }
  return imposto // já trava no teto (última faixa 7786.02)
}
export function tetoINSSCLT(): number {
  // valor do INSS no teto (7786.02)
  return 1412 * 0.075 + (2666.68 - 1412) * 0.09 + (4000.03 - 2666.68) * 0.12 + (7786.02 - 4000.03) * 0.14
}

// INSS contribuinte individual / autônomo (RPA) = 11% até o teto.
export function inssAutonomo(bruto: number): number {
  const teto = 7786.02
  return Math.min(bruto, teto) * 0.11
}

// IRRF — tabela progressiva mensal 2024 (base já com deduções aplicadas).
export function irrf(base: number): number {
  const t: [number, number, number][] = [
    [2259.20, 0, 0],
    [2826.65, 0.075, 169.44],
    [3751.05, 0.15, 381.44],
    [4664.68, 0.225, 662.77],
    [Infinity, 0.275, 896.00],
  ]
  for (const [teto, aliq, ded] of t) {
    if (base <= teto) return Math.max(0, base * aliq - ded)
  }
  return 0
}
