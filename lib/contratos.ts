// Config dos tipos de contrato — client-safe (sem pg)

export const TIPO_LABEL: Record<number, string> = {
  1: 'Abertura de empresa',
  2: 'Migração de regime (deixar de ser MEI)',
  3: 'Troca de contador',
  4: 'BPO Financeiro',
}

/** Determina o tipo de contrato pelo interesse do lead. */
export function tipoFromInteresse(interesse?: string | null): number | null {
  switch ((interesse || '').trim().toLowerCase()) {
    case 'abrir minha empresa': return 1
    case 'deixar de ser mei':   return 2
    case 'trocar de contador':  return 3
    case 'bpo financeiro':      return 4
    default: return null
  }
}

/** Texto do objeto (Cláusula 1) por tipo — RASCUNHO, sujeito a revisão jurídica. */
export const OBJETO: Record<number, string> = {
  1: 'A constituição e abertura da empresa do CONTRATANTE perante os órgãos competentes (Junta Comercial, Receita Federal, Estado e Município), bem como a prestação pela CONTRATADA dos serviços profissionais de contabilidade descritos no "Anexo 1".',
  2: 'O desenquadramento do CONTRATANTE da condição de Microempreendedor Individual (MEI) e a migração para o regime tributário adequado, bem como a prestação pela CONTRATADA dos serviços profissionais de contabilidade descritos no "Anexo 1".',
  3: 'A prestação pela CONTRATADA dos serviços profissionais de contabilidade descritos no "Anexo 1", com a transferência da responsabilidade técnica contábil para a CONTRATADA.',
  4: 'A prestação pela CONTRATADA de serviços de BPO Financeiro (terceirização da gestão financeira), incluindo contas a pagar e a receber, fluxo de caixa e conciliação bancária, bem como os serviços profissionais de contabilidade descritos no "Anexo 1".',
}

/** Tipos que usam dados da empresa (todos menos o 1 – abertura). */
export const usaEmpresa = (tipo: number) => tipo !== 1
/** Tipos que usam valor de abertura (todos menos o 3 – troca de contador). */
export const usaAbertura = (tipo: number) => tipo !== 3

type Obj = Record<string, unknown>
const filled = (v: unknown) => String(v ?? '').trim() !== ''

const REQ_PESSOA_T1 = ['cli_nome_completo', 'cli_cpf', 'cli_rg', 'cli_endereco', 'cli_bairro', 'cli_cidade_estado', 'cli_cep']
const REQ_EMPRESA = ['emp_nome', 'emp_cnpj', 'emp_endereco', 'emp_bairro', 'emp_cidade_estado', 'emp_cep', 'emp_email', 'emp_telefone']
const REQ_PESSOA_EMP = ['cli_nome_completo', 'cli_cpf']

/** Verifica se o cadastro tem o mínimo para gerar o contrato do tipo do lead. */
export function isContratoPronto(cliente: Obj | null | undefined, lead: Obj | null | undefined): boolean {
  const tipo = tipoFromInteresse(lead?.interesse as string)
  if (!tipo || !cliente) return false
  if (!(Number(lead?.valor_honorario) > 0)) return false // honorário definido no fechamento

  if (tipo === 1) {
    for (const k of REQ_PESSOA_T1) if (!filled(cliente[k])) return false
  } else {
    for (const k of REQ_EMPRESA) if (!filled(cliente[k])) return false
    for (const k of REQ_PESSOA_EMP) if (!filled(cliente[k])) return false
  }

  // sócios preenchidos (fiadores) precisam de nome + CPF
  const socios = ((cliente.socios as Obj[]) || []).filter(s => s && (filled(s.nome_completo) || filled(s.cpf)))
  for (const s of socios) if (!filled(s.nome_completo) || !filled(s.cpf)) return false

  return true
}
