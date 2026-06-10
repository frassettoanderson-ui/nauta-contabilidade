// Definições de campos do cadastro e regra de completude — client-safe (sem pg)

export type Field = [key: string, label: string, type?: string]

export const CLI_FIELDS: Field[] = [
  ['cli_nome_completo', 'Nome completo',       'nome'],
  ['cli_rg',           'RG',                   'numero'],
  ['cli_cpf',          'CPF',                  'cpf'],
  ['cli_nascimento',   'Data de nascimento',   'date'],
  ['cli_nome_pai',     'Nome do pai',          'nome'],
  ['cli_nome_mae',     'Nome da mãe',          'nome'],
  ['cli_estado_civil', 'Estado civil',         'estado_civil'],
  ['cli_recibo_irpf',  'Nº recibo de IRPF',    'numero'],
  ['cli_titulo_eleitor','Nº título de eleitor','numero'],
  ['cli_email',        'E-mail'],
  ['cli_cep',          'CEP',                  'cep'],
  ['cli_endereco',     'Endereço'],
  ['cli_bairro',       'Bairro'],
  ['cli_cidade_estado','Cidade / Estado',      'cidade_estado'],
]

// Campos da empresa. O proprietário do imóvel agora é separado em nome + CPF;
// a tela de cadastro adiciona um flag "é o Sócio 1" que preenche esses dois campos.
export const EMP_FIELDS: Field[] = [
  ['emp_nome',         'Nome da empresa'],
  ['emp_fantasia',     'Nome fantasia'],
  ['emp_cnpj',         'CNPJ',                 'cnpj'],
  ['emp_cep',          'CEP',                  'cep'],
  ['emp_endereco',     'Endereço da empresa'],
  ['emp_bairro',       'Bairro'],
  ['emp_cidade_estado','Cidade / Estado',      'cidade_estado'],
  ['emp_area_ocupada', 'Área ocupada (m²)',    'numero'],
  ['emp_edificacao',   'Área total da edificação (m²)', 'numero'],
  ['emp_proprietario_nome', 'Nome do proprietário do imóvel', 'nome'],
  ['emp_proprietario_cpf',  'CPF do proprietário do imóvel',  'cpf'],
  ['emp_atividade',    'Atividade da empresa'],
  ['emp_capital_social','Valor do capital social', 'dinheiro'],
  ['emp_telefone',     'Telefone para contato','phone'],
  ['emp_email',        'E-mail para contato'],
]

export const SOCIO_FIELDS: Field[] = [
  ['nome_completo', 'Nome completo',       'nome'],
  ['rg',            'RG',                  'numero'],
  ['cpf',           'CPF',                 'cpf'],
  ['nascimento',    'Data de nascimento',  'date'],
  ['nome_pai',      'Nome do pai',         'nome'],
  ['nome_mae',      'Nome da mãe',         'nome'],
  ['participacao',  'Participação (%)',    'number'],
  ['estado_civil',  'Estado civil',        'estado_civil'],
  ['recibo_irpf',   'Nº recibo de IRPF',   'numero'],
  ['titulo_eleitor','Nº título de eleitor','numero'],
]

export const CLI_TO_SOCIO: [string, string][] = [
  ['cli_nome_completo', 'nome_completo'], ['cli_rg', 'rg'], ['cli_cpf', 'cpf'], ['cli_nascimento', 'nascimento'],
  ['cli_nome_pai', 'nome_pai'], ['cli_nome_mae', 'nome_mae'], ['cli_estado_civil', 'estado_civil'],
  ['cli_recibo_irpf', 'recibo_irpf'], ['cli_titulo_eleitor', 'titulo_eleitor'],
]

const CLI_REQ = CLI_FIELDS.map(f => f[0])
const EMP_REQ = EMP_FIELDS.map(f => f[0])
const SOCIO_REQ = SOCIO_FIELDS.map(f => f[0])

type Obj = Record<string, unknown>
const filled = (v: unknown) => String(v ?? '').trim() !== ''

/** Regra de "cadastro completo" — NÃO exige documentos/certificado/senha. */
export function isCadastroCompleto(c: Obj | null | undefined): boolean {
  if (!c) return false
  for (const k of CLI_REQ) if (!filled(c[k])) return false
  for (const k of EMP_REQ) if (!filled(c[k])) return false
  const socios = ((c.socios as Obj[]) || []).filter(s => s && (filled(s.nome_completo) || filled(s.cpf)))
  if (socios.length === 0) return false // Sócio 1 obrigatório
  let soma = 0
  for (const s of socios) {
    for (const k of SOCIO_REQ) if (!filled(s[k])) return false
    soma += Number(s.participacao) || 0
  }
  if (Math.round(soma) !== 100) return false
  return true
}
