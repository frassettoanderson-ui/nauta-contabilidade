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

// Atividades comuns às categorias Abertura / Troca de contador / Deixar de ser MEI.
const BASE: Record<SetorId, ChecklistItem[]> = {
  gerente: [
    { key: ITEM_CADASTRO,         label: 'Preencher cadastro completo' },
    { key: 'gerente:pagamento',   label: 'Conferir pagamento' },
    { key: 'gerente:pendencias',  label: 'Verificar pendências fiscais, estaduais, municipais e trabalhistas' },
    { key: 'gerente:alinhamento', label: 'Reunião de alinhamento fiscal, contábil e trabalhista' },
  ],
  pessoal: [
    { key: 'pessoal:procuracao',    label: 'Procuração e-CAC PJ e CPF dos sócios' },
    { key: 'pessoal:dctfweb',       label: 'Declarar DCTFWeb' },
    { key: 'pessoal:fichas',        label: 'Enviar fichas de registro (se houver empregados)' },
    { key: 'pessoal:fgts',          label: 'Cadastro no FGTS Digital' },
    { key: 'pessoal:det',           label: 'Cadastro no DET (Domicílio Eletrônico Trabalhista)' },
    { key: 'pessoal:esocial',       label: 'Conferir eventos do eSocial' },
    { key: 'pessoal:afastamentos',  label: 'Verificar afastamentos, férias e rescisões pendentes' },
  ],
  fiscal: [
    { key: 'fiscal:prefeitura',       label: 'Acesso à prefeitura' },
    { key: 'fiscal:estado',           label: 'Vinculação no Estado' },
    { key: 'fiscal:simples',          label: 'Cadastro Simples Nacional' },
    { key: 'fiscal:livro',            label: 'Livro eletrônico' },
    { key: 'fiscal:particularidades', label: 'Confirmar particularidades da atividade no Estado' },
    { key: 'fiscal:detec',            label: 'Cadastrar DETEC' },
    { key: 'fiscal:calendario',       label: 'Definir calendário de envio de documentos' },
  ],
  atendente: [
    { key: 'atendente:alvara',     label: 'Emitir as guias de alvará municipal' },
    { key: 'atendente:vigilancia', label: 'Cadastro na vigilância e bombeiros' },
    { key: 'atendente:dominio',    label: 'Cadastro Domínio' },
    { key: 'atendente:acessorias', label: 'Cadastro Acessórias e encaminhar orientações pré-preparadas' },
    { key: 'atendente:rotinas',    label: 'Incluir nas planilhas de rotinas mensais' },
  ],
}

// Atividades por categoria. BPO e Eleitoral ainda não definidas.
const POR_CATEGORIA: Record<string, Partial<Record<SetorId, ChecklistItem[]>>> = {
  'abrir-empresa': BASE,
  'deixar-mei': BASE,
  'trocar-de-contador': {
    ...BASE,
    gerente: [
      ...BASE.gerente,
      { key: 'gerente:contador-antigo', label: 'Dados do contador antigo' },
    ],
  },
}

/** Itens de um setor para uma categoria. */
export function itensDoSetor(setor: SetorId, categoria: string): ChecklistItem[] {
  const cat = POR_CATEGORIA[categoria]
  if (cat) return cat[setor] ?? []
  // Categorias ainda não definidas (BPO, Eleitoral): só o básico do gerente.
  if (setor === 'gerente') return [
    { key: ITEM_CADASTRO,       label: 'Preencher cadastro completo' },
    { key: 'gerente:pagamento', label: 'Conferir pagamento' },
  ]
  return []
}

export function todosItens(categoria: string): ChecklistItem[] {
  return SETORES.flatMap(s => itensDoSetor(s.id, categoria))
}

/** Inclui o item de cadastro automaticamente quando o cadastro está completo. */
export function checksEfetivos(checks: string[], cadastroCompleto: boolean): string[] {
  if (cadastroCompleto && !checks.includes(ITEM_CADASTRO)) return [...checks, ITEM_CADASTRO]
  return checks
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
