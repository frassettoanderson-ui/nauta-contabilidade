import { CLI_FIELDS, EMP_FIELDS, SOCIO_FIELDS, type Field } from './cadastro'

type Obj = Record<string, any>

export interface CadastroLogos { header?: string }

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function fmt(value: unknown, type?: string): string {
  const s = String(value ?? '').trim()
  if (!s) return '—'
  if (type === 'date') {
    // ISO (YYYY-MM-DD...) -> dd/mm/aaaa
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
  }
  if (type === 'dinheiro') {
    const n = Number(s)
    if (!isNaN(n)) return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return esc(s)
}

/** Tabela de pares rótulo/valor a partir de uma lista de campos. */
function tabela(dados: Obj, campos: Field[], extras: [string, string][] = []): string {
  const linhas = campos
    .map(([key, label, type]) => `<tr><th>${esc(label)}</th><td>${fmt(dados[key], type)}</td></tr>`)
    .concat(extras.map(([label, val]) => `<tr><th>${esc(label)}</th><td>${val ? esc(val) : '—'}</td></tr>`))
    .join('')
  return `<table class="dados">${linhas}</table>`
}

/** Ficha de cadastro completa (cliente + empresa + sócios) — pronta para impressão A4. */
export function buildCadastroHtml(cliente: Obj, opts: { interesseLabel?: string; logos?: CadastroLogos } = {}): string {
  const logos = opts.logos ?? {}
  const socios: Obj[] = (cliente.socios || []).filter((s: Obj) => s && (s.nome_completo || s.cpf))

  const masthead = logos.header
    ? `<table class="mast"><tr>
         <td class="mast-logo"><img src="${logos.header}" alt="Nauta Contabilidade"/></td>
         <td class="mast-info">Contabilidade Digital<br/>CNPJ 19.361.966/0001-82<br/>Imbituba/SC · nautacontabilidade.com.br</td>
       </tr></table>`
    : `<div class="brand">NAUTA <span>CONTABILIDADE</span></div>`

  const empExtras: [string, string][] = [
    ['Usa gás GLP?', cliente.emp_usa_glp === true || cliente.emp_usa_glp === 'true' ? 'Sim' : (cliente.emp_usa_glp === false || cliente.emp_usa_glp === 'false' ? 'Não' : '')],
  ]
  const cliExtras: [string, string][] = [
    ['Senha do certificado digital', String(cliente.cli_cert_senha ?? '')],
  ]

  const blocoSocios = socios.length
    ? socios.map((s, i) => `
        <div class="secao">
          <h2>Sócio ${i + 1}</h2>
          ${tabela(s, SOCIO_FIELDS, [['Senha do certificado digital', String(s.cert_senha ?? '')]])}
        </div>`).join('')
    : `<div class="secao"><h2>Sócios</h2><p class="vazio">Nenhum sócio cadastrado.</p></div>`

  const dataExtenso = () => {
    const d = new Date()
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    return `Imbituba/SC, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
  }

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Liberation Sans','Arial',sans-serif; font-size: 9.5pt; color: #1d1d22; margin: 0; }

  .masthead { border-bottom: 2.5pt solid #0BBCD4; padding-bottom: 7pt; margin-bottom: 10pt; }
  table.mast { width: 100%; border-collapse: collapse; }
  td.mast-logo img { height: 40px; }
  td.mast-info { text-align: right; vertical-align: bottom; font-size: 7.5pt; color: #6b7280; letter-spacing: .5pt; line-height: 1.5; }
  .brand { font-size: 16pt; font-weight: bold; color: #11103a; letter-spacing: .5pt; }
  .brand span { color: #0BBCD4; }

  .doc-title { text-align:center; margin: 2pt 0 12pt; }
  .doc-title h1 { font-size: 13pt; color:#11103a; margin:0; letter-spacing:.3pt; }
  .doc-title .sub { font-size: 8.5pt; color:#6b7280; margin-top:3pt; }

  .secao { margin-bottom: 11pt; page-break-inside: avoid; }
  h2 { font-size: 10pt; color:#fff; background:#11103a; margin: 0 0 5pt; padding:4pt 8pt; border-radius:3pt; letter-spacing:.4pt; }

  table.dados { width:100%; border-collapse:collapse; }
  table.dados th, table.dados td { border:.5pt solid #cfd6e0; padding:3.5pt 7pt; font-size:9pt; vertical-align:top; text-align:left; }
  table.dados th { width:30%; background:#f4f6f9; font-weight:bold; color:#374151; }
  .vazio { font-size:9pt; color:#6b7280; }

  .assinatura { margin-top: 22pt; page-break-inside: avoid; }
  .sig-line { border-top:.7pt solid #1d1d22; width:60%; margin: 26pt auto 4pt; }
  .sig-name { text-align:center; font-size:9pt; color:#374151; }
  .data { text-align:center; font-size:9pt; color:#374151; margin-top:14pt; }

  .foot { margin-top:14pt; border-top:.5pt solid #d8dde6; padding-top:6pt; font-size:7.5pt; color:#9aa1ad; text-align:center; }
</style></head>
<body>
  <div class="masthead">${masthead}</div>

  <div class="doc-title">
    <h1>FICHA DE CADASTRO</h1>
    ${opts.interesseLabel ? `<div class="sub">${esc(opts.interesseLabel)}</div>` : ''}
  </div>

  <div class="secao">
    <h2>Dados do Cliente (Responsável)</h2>
    ${tabela(cliente, CLI_FIELDS, cliExtras)}
  </div>

  <div class="secao">
    <h2>Dados da Empresa</h2>
    ${tabela(cliente, EMP_FIELDS, empExtras)}
  </div>

  ${blocoSocios}

  <div class="assinatura">
    <div class="data">${dataExtenso()}</div>
    <div class="sig-line"></div>
    <div class="sig-name">Assinatura do responsável</div>
  </div>

  <div class="foot">NAUTA CONTABILIDADE LTDA · CNPJ 19.361.966/0001-82 · Imbituba/SC · nautacontabilidade.com.br — Documento interno</div>
</body></html>`
}
