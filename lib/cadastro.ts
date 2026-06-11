// Definições de campos do cadastro e regra de completude — client-safe (sem pg)

// span = largura em colunas de 12 (controla o grid do cadastro). Padrão 4.
export type Field = [key: string, label: string, type?: string, span?: number]

export const CLI_FIELDS: Field[] = [
  ['cli_nome_completo', 'Nome completo',       'nome', 4],
  ['cli_rg',           'RG',                   'numero', 2],
  ['cli_cpf',          'CPF',                  'cpf', 3],
  ['cli_nascimento',   'Data de nascimento',   'date', 3],
  ['cli_nome_pai',     'Nome do pai',          'nome', 4],
  ['cli_nome_mae',     'Nome da mãe',          'nome', 4],
  ['cli_estado_civil', 'Estado civil',         'estado_civil', 4],
  ['cli_recibo_irpf',  'Nº recibo de IRPF',    'numero', 3],
  ['cli_titulo_eleitor','Nº título de eleitor','numero', 3],
  ['cli_email',        'E-mail',               'text', 6],
  ['cli_cep',          'CEP',                  'cep', 2],
  ['cli_endereco',     'Endereço',             'text', 6],
  ['cli_bairro',       'Bairro',               'text', 4],
  ['cli_cidade_estado','Cidade / Estado',      'cidade_estado', 6],
]

// Campos da empresa. O proprietário do imóvel agora é separado em nome + CPF;
// a tela de cadastro adiciona um flag "é o Sócio 1" que preenche esses dois campos.
export const EMP_FIELDS: Field[] = [
  ['emp_nome',         'Nome da empresa',      'text', 4],
  ['emp_fantasia',     'Nome fantasia',        'text', 4],
  ['emp_cnpj',         'CNPJ',                 'cnpj', 4],
  ['emp_regime',       'Tipo de empresa (regime)', 'regime', 3],
  ['emp_cep',          'CEP',                  'cep', 2],
  ['emp_endereco',     'Endereço da empresa',  'text', 4],
  ['emp_bairro',       'Bairro',               'text', 3],
  ['emp_cidade_estado','Cidade / Estado',      'cidade_estado', 6],
  ['emp_inscricao_imobiliaria', 'Inscrição imobiliária', 'numero', 3],
  ['emp_area_ocupada', 'Área ocupada (m²)',    'numero', 3],
  ['emp_edificacao',   'Área total da edificação (m²)', 'numero', 3],
  ['emp_proprietario_nome', 'Nome do proprietário do imóvel', 'nome', 4],
  ['emp_proprietario_cpf',  'CPF do proprietário do imóvel',  'cpf', 2],
  ['emp_atividade',    'Atividade da empresa', 'text', 3],
  ['emp_capital_social','Valor do capital social', 'dinheiro', 3],
  ['emp_telefone',     'Telefone para contato','phone', 3],
  ['emp_email',        'E-mail para contato',  'text', 6],
]

export const SOCIO_FIELDS: Field[] = [
  ['nome_completo', 'Nome completo',       'nome', 4],
  ['rg',            'RG',                  'numero', 2],
  ['cpf',           'CPF',                 'cpf', 3],
  ['nascimento',    'Data de nascimento',  'date', 3],
  ['nome_pai',      'Nome do pai',         'nome', 4],
  ['nome_mae',      'Nome da mãe',         'nome', 4],
  ['participacao',  'Participação (%)',    'number', 4],
  ['estado_civil',  'Estado civil',        'estado_civil', 4],
  ['recibo_irpf',   'Nº recibo de IRPF',   'numero', 4],
  ['titulo_eleitor','Nº título de eleitor','numero', 4],
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
