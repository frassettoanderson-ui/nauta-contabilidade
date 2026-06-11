// Config do checklist de onboarding por setor/categoria — client-safe (sem pg).

export interface ChecklistItem { key: string; label: string }

export const SETORES = [
  { id: 'gerente',   label: 'Gerente' },
  { id: 'fiscal',    label: 'Fiscal' },
  { id: 'pessoal',   label: 'Pessoal' },
  { id: 'atendente', label: 'Atendente' },
] as const

export type SetorId = typeof SETORES[number]['id']

// Item automático: marca sozinho quando o cadastro do cliente está completo.
export const ITEM_CADASTRO = 'gerente:cadastro'

// Itens do GERENTE (iguais a todas as categorias por enquanto).
const GERENTE_ITENS: ChecklistItem[] = [
  { key: ITEM_CADASTRO,       label: 'Cadastro completo' },
  { key: 'gerente:pagamento', label: 'Pagamento confirmado' },
  { key: 'gerente:abertura',  label: 'Abertura da empresa' },
]

/** Inclui o item de cadastro automaticamente quando o cadastro está completo. */
export function checksEfetivos(checks: string[], cadastroCompleto: boolean): string[] {
  if (cadastroCompleto && !checks.includes(ITEM_CADASTRO)) return [...checks, ITEM_CADASTRO]
  return checks
}

/** Itens de um setor para uma categoria. Fiscal/Pessoal/Atendente: a definir. */
export function itensDoSetor(setor: SetorId, _categoria: string): ChecklistItem[] {
  if (setor === 'gerente') return GERENTE_ITENS
  return []
}

export function todosItens(categoria: string): ChecklistItem[] {
  return SETORES.flatMap(s => itensDoSetor(s.id, categoria))
}

/** Gerente concluiu sua parte? (libera os demais setores) */
export function gerenteConcluido(categoria: string, checks: string[]): boolean {
  const keys = itensDoSetor('gerente', categoria).map(i => i.key)
  return keys.length > 0 && keys.every(k => checks.includes(k))
}

/** O cargo pode editar este setor? gerente/admin = todos; demais = só o próprio. */
export function podeEditarSetor(role: string, setor: SetorId): boolean {
  if (role === 'admin' || role === 'gerente') return true
  return role === setor
}
