// Cadastro de autores do blog (colaboradores Nauta por setor).
// Byline enxuto: foto (ou iniciais) + nome + setor. Foto entra quando o arquivo
// existir em /public/equipe/<key>.jpg — até lá, cai no avatar de iniciais.

export interface Autor {
  key: string
  nome: string
  setor: string   // rótulo curto exibido no byline (ex.: 'Comercial')
  cargo: string   // usado como jobTitle no schema (ex.: 'Setor Comercial')
  foto?: string   // ex.: '/equipe/anderson.jpg' — só definir quando o arquivo existir
}

export const AUTORES: Record<string, Autor> = {
  anderson:  { key: 'anderson',  nome: 'Anderson',  setor: 'Comercial',  cargo: 'Setor Comercial',      foto: '/equipe/anderson.jpg' },
  bruno:     { key: 'bruno',     nome: 'Bruno',     setor: 'Pessoal',    cargo: 'Departamento Pessoal', foto: '/equipe/bruno.jpg' },
  erivelton: { key: 'erivelton', nome: 'Erivelton', setor: 'Fiscal',     cargo: 'Setor Fiscal',         foto: '/equipe/erivelton.jpg' },
  izadora:   { key: 'izadora',   nome: 'Izadora',   setor: 'Societário', cargo: 'Setor Societário',     foto: '/equipe/izadora.jpg' },
  guilherme: { key: 'guilherme', nome: 'Guilherme', setor: 'Financeiro', cargo: 'Setor Financeiro',     foto: '/equipe/guilherme.jpg' },
  // ⚠️ confirmar grafia: usuário informou "Erviton" para o Contábil e "Erivelton" para o Fiscal.
  contabil:  { key: 'contabil',  nome: 'Erviton',   setor: 'Contábil',   cargo: 'Setor Contábil',       foto: '/equipe/contabil.jpg' },
}

// Cada categoria do blog puxa o autor do setor correspondente.
export const CATEGORIA_AUTOR: Record<string, string> = {
  'simples-e-mei':            'erivelton',
  'tributacao':               'erivelton',
  'abertura-de-empresa':      'izadora',
  'clt-x-pj':                 'bruno',
  'rh-e-folha':               'bruno',
  'gestao-financeira':        'guilherme',
  'empreendedorismo':         'anderson',
  'contabilidade-eleitoral':  'contabil',
  'setores-e-profissoes':     'anderson',
  'cnae':                     'erivelton',
}

export function autorPorCategoria(slug?: string | null): Autor {
  const key = (slug && CATEGORIA_AUTOR[slug]) || 'guilherme'
  return AUTORES[key] ?? AUTORES.guilherme
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}
