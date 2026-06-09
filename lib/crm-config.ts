// Config do CRM — sem imports de servidor (seguro p/ client e server)

export const ETAPAS = [
  { id: 'novo',       label: 'Novo',          color: '#0BBCD4' },
  { id: 'contato',    label: 'Em contato',    color: '#7c6fff' },
  { id: 'negociacao', label: 'Em negociação', color: '#f59e0b' },
  { id: 'fechado',    label: 'Fechado',       color: '#22c55e' },
] as const

export type EtapaId = typeof ETAPAS[number]['id']

export const ETAPA_LABEL: Record<string, string> = {
  novo: 'Novo',
  contato: 'Em contato',
  negociacao: 'Em negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

// Opções de interesse (iguais às do site)
export const INTERESSES = [
  'Trocar de contador',
  'Abrir minha empresa',
  'Deixar de ser MEI',
  'BPO Financeiro',
  'Contabilidade Eleitoral',
  'Outro',
]

/** Cor da classificação 0→5: vermelho (0) → verde (5). */
export function classColor(n: number): string {
  const v = Math.max(0, Math.min(5, n))
  const hue = (v / 5) * 120 // 0 = vermelho, 120 = verde
  return `hsl(${hue}, 75%, 48%)`
}

/** Emoji do nível de interesse: ❄️ (0) → 🔥 (5). */
export function classEmoji(n: number): string {
  const e = ['❄️', '🥶', '😐', '🙂', '😍', '🔥']
  return e[Math.max(0, Math.min(5, n))]
}
