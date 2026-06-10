import { tipoFromInteresse, OBJETO, usaEmpresa, usaAbertura, TIPO_LABEL } from './contratos'

type Obj = Record<string, any>

export interface ContratoLogos {
  header?: string  // data URI da logo horizontal
  marca?: string   // data URI da logo p/ marca d'água
}

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const val = (v: unknown) => { const s = String(v ?? '').trim(); return s || '—' }
const brl = (v: unknown) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dataExtenso = () => {
  const d = new Date()
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `Imbituba/SC, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

const linha = (label: string, value: unknown) =>
  `<tr><th>${label}</th><td>${esc(val(value))}</td></tr>`

/** HTML do contrato (papel timbrado Nauta), conforme o tipo derivado do interesse. */
export function buildContratoHtml(cliente: Obj, lead: Obj, logos: ContratoLogos = {}): string {
  const tipo = tipoFromInteresse(lead?.interesse) || 3
  const comEmpresa = usaEmpresa(tipo)
  const comAbertura = usaAbertura(tipo) && Number(lead?.valor_abertura) > 0
  const socios: Obj[] = (cliente.socios || []).filter((s: Obj) => s && (s.nome_completo || s.cpf))

  const nomeContratante = comEmpresa ? esc(val(cliente.emp_nome)) : esc(val(cliente.cli_nome_completo))

  const blocoContratante = comEmpresa
    ? `${linha('Razão Social', cliente.emp_nome)}
       ${linha('CNPJ', cliente.emp_cnpj)}
       ${linha('Endereço', cliente.emp_endereco)}
       ${linha('Bairro', cliente.emp_bairro)}
       ${linha('Cidade / Estado', cliente.emp_cidade_estado)}
       ${linha('CEP', cliente.emp_cep)}
       ${linha('E-mail', cliente.emp_email)}
       ${linha('Telefone', cliente.emp_telefone)}
       ${linha('Sócio Administrador', cliente.cli_nome_completo)}
       ${linha('CPF do Sócio', cliente.cli_cpf)}`
    : `${linha('Responsável Legal', cliente.cli_nome_completo)}
       ${linha('CPF', cliente.cli_cpf)}
       ${linha('RG', cliente.cli_rg)}
       ${linha('Endereço', cliente.cli_endereco)}
       ${linha('Bairro', cliente.cli_bairro)}
       ${linha('Cidade / Estado', cliente.cli_cidade_estado)}
       ${linha('CEP', cliente.cli_cep)}`

  const aberturaLinha = comAbertura
    ? `<p><b>5.2.</b> Pela ${tipo === 1 ? 'constituição/abertura da empresa' : 'execução dos serviços iniciais de implantação'}, a CONTRATANTE pagará à CONTRATADA o valor único de <b>R$ ${brl(lead?.valor_abertura)}</b>, devido no ato da contratação.</p>`
    : ''

  const fiadores = socios.map(s => `
    <td class="sig">
      <div class="sig-line"></div>
      <div class="sig-name">${esc(val(s.nome_completo))}</div>
      <div class="sig-role">CPF: ${esc(val(s.cpf))} — Sócio Fiador</div>
    </td>`).join('')
  const fiadoresRows = socios.length
    ? `<table class="sigs"><tr>${fiadores}${socios.length === 1 ? '<td class="sig"></td>' : ''}</tr></table>`
    : ''

  const Cl = (n: number, titulo: string, corpo: string) =>
    `<h2><span class="cl-num">CLÁUSULA ${n}</span> ${titulo}</h2>${corpo}`

  const masthead = logos.header
    ? `<table class="mast"><tr>
         <td class="mast-logo"><img src="${logos.header}" alt="Nauta Contabilidade"/></td>
         <td class="mast-info">Contabilidade Digital<br/>CNPJ 19.361.966/0001-82<br/>Imbituba/SC · nautacontabilidade.com.br</td>
       </tr></table>`
    : `<div class="brand">NAUTA <span>CONTABILIDADE</span></div>
       <div class="brand-sub">Contabilidade Digital · Imbituba/SC · CNPJ 19.361.966/0001-82</div>`

  const marcaDagua = logos.marca
    ? `<div class="marca-dagua"><img src="${logos.marca}" alt=""/></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Liberation Serif','Times New Roman',serif; font-size: 10.8pt; color: #1d1d22; line-height: 1.55; margin: 0; }

  /* Papel timbrado: marca d'água em todas as páginas */
  .marca-dagua { position: fixed; top: 50%; left: 0; width: 100%; margin-top: -170px; text-align: center; }
  .marca-dagua img { width: 340px; opacity: 0.05; }

  .conteudo { position: relative; }

  .masthead { border-bottom: 2.5pt solid #0BBCD4; padding-bottom: 8pt; margin-bottom: 4pt; }
  table.mast { width: 100%; border-collapse: collapse; }
  td.mast-logo img { height: 44px; }
  td.mast-info { text-align: right; vertical-align: bottom; font-family:'Liberation Sans',Arial,sans-serif; font-size: 7.5pt; color: #6b7280; letter-spacing: .5pt; line-height: 1.5; }
  .brand { font-family:'Liberation Sans',Arial,sans-serif; font-size: 17pt; font-weight: bold; color: #11103a; letter-spacing: .5pt; }
  .brand span { color: #0BBCD4; }
  .brand-sub { font-family:'Liberation Sans',Arial,sans-serif; font-size: 8pt; color: #6b7280; letter-spacing: 2pt; text-transform: uppercase; margin-top: 2pt; }

  .doc-title { text-align:center; margin: 22pt 0 4pt; }
  .doc-title h1 { font-family:'Liberation Sans',Arial,sans-serif; font-size: 14pt; color:#11103a; letter-spacing:.5pt; margin:0; }
  .doc-badge { display:inline-block; margin-top:6pt; font-family:'Liberation Sans',Arial,sans-serif; font-size:8.5pt; font-weight:bold;
    color:#0BBCD4; border:1pt solid #0BBCD4; border-radius:10pt; padding:2pt 10pt; text-transform:uppercase; letter-spacing:1pt; }

  h2 { font-family:'Liberation Sans',Arial,sans-serif; font-size: 11pt; color:#11103a; margin: 16pt 0 4pt; padding-bottom:2pt; border-bottom:.5pt solid #d8dde6; }
  .cl-num { color:#0BBCD4; font-weight:bold; }
  p { margin: 5pt 0; text-align: justify; }

  .parte-titulo { font-family:'Liberation Sans',Arial,sans-serif; font-size:9pt; font-weight:bold; text-transform:uppercase; letter-spacing:1.5pt;
    color:#0BBCD4; margin: 14pt 0 4pt; }
  table.dados { width:100%; border-collapse:collapse; margin-bottom:4pt; }
  table.dados th, table.dados td { border:.5pt solid #cfd6e0; padding:4pt 8pt; font-size:10pt; vertical-align:top; }
  table.dados th { width:34%; background:#f4f6f9; text-align:left; font-weight:bold; color:#374151; }

  .preambulo { margin-top:14pt; font-style:italic; color:#33333a; }

  table.sigs { width:100%; border-collapse:collapse; margin-top:30pt; }
  table.sigs td { width:50%; text-align:center; padding: 24pt 14pt 0; vertical-align:top; }
  .sig-line { border-top:.7pt solid #1d1d22; width:80%; margin: 0 auto 4pt; }
  .sig-name { font-weight:bold; font-size:10pt; }
  .sig-role { font-size:8.5pt; color:#6b7280; }

  .foot { margin-top:18pt; border-top:.5pt solid #d8dde6; padding-top:6pt; font-family:'Liberation Sans',Arial,sans-serif; font-size:7.5pt; color:#9aa1ad; text-align:center; }
</style></head>
<body>
  ${marcaDagua}
  <div class="conteudo">
    <div class="masthead">${masthead}</div>

    <div class="doc-title">
      <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS</h1>
      <div class="doc-badge">${TIPO_LABEL[tipo]}</div>
    </div>

    <div class="parte-titulo">Contratante</div>
    <table class="dados">${blocoContratante}</table>

    <div class="parte-titulo">Contratada</div>
    <table class="dados">
      ${linha('Razão Social', 'NAUTA CONTABILIDADE LTDA')}
      ${linha('CNPJ', '19.361.966/0001-82')}
      ${linha('Endereço', 'Avenida Santa Catarina — Centro, Imbituba/SC')}
      ${linha('Responsável Técnico', 'Guilherme Dias Ronchi — CRC 041514/O')}
    </table>

    <p class="preambulo">Pelo presente instrumento particular, as partes acima devidamente qualificadas, doravante denominadas simplesmente CONTRATADA e CONTRATANTE, na melhor forma de direito, ajustam e contratam a prestação de serviços profissionais de contabilidade, segundo as cláusulas e condições adiante listadas.</p>

    ${Cl(1, '– DO OBJETO', `<p>${OBJETO[tipo]}</p>`)}

    ${Cl(2, '– DAS OBRIGAÇÕES DA CONTRATANTE', `
      <p><b>2.1.</b> A CONTRATANTE se obriga a remeter à CONTRATADA, mediante protocolo, todos os arquivos digitais e documentos necessários e indispensáveis ao desempenho dos serviços contratados.</p>
      <p><b>2.2.</b> O recolhimento de impostos e encargos referentes à movimentação econômica da CONTRATANTE é de sua exclusiva responsabilidade, arcando com eventuais multas e juros por atraso ou falta de pagamento.</p>
      <p><b>2.3.</b> A CONTRATANTE se obriga a cumprir as orientações da CONTRATADA (normas trabalhistas, previdenciárias e fiscais), eximindo-se esta das consequências da sua inobservância.</p>
      <p><b>2.4.</b> A CONTRATANTE indicará os colaboradores autorizados às tratativas junto à CONTRATADA.</p>`)}

    ${Cl(3, '– DAS OBRIGAÇÕES DA CONTRATADA', `
      <p>A CONTRATADA se obriga a cumprir a legislação Federal, Estadual e Municipal, desempenhando os serviços com zelo, diligência e honestidade, sujeitando-se ao Código de Ética Profissional do Contabilista.</p>
      <p><b>3.1.</b> A CONTRATADA não se responsabilizará por multas, juros ou correções decorrentes da falta de recolhimento de obrigações, que correm por conta exclusiva da CONTRATANTE.</p>
      <p><b>3.2.</b> A CONTRATADA entregará as guias de recolhimento com antecedência mínima de 02 (dois) dias do vencimento, desde que fornecidas as bases pela CONTRATANTE.</p>`)}

    ${Cl(4, '– DA PROTEÇÃO DE DADOS', `
      <p>O tratamento de dados pessoais observará a Lei Geral de Proteção de Dados (Lei 13.709/2018), mantendo-se sigilo e confidencialidade, com adoção de medidas técnicas e administrativas de segurança e notificação à outra parte em caso de incidentes.</p>`)}

    ${Cl(5, '– DOS HONORÁRIOS', `
      <p><b>5.1.</b> Pela execução dos serviços, a CONTRATANTE pagará à CONTRATADA, mensalmente, honorários no valor de <b>R$ ${brl(lead?.valor_honorario)}</b>, até o dia 10 (dez) do mês subsequente aos serviços prestados.</p>
      ${aberturaLinha}
      <p><b>5.3.</b> Além da mensalidade, será devido um adicional anual (13ª parcela), equivalente a uma mensalidade, até 10 de dezembro de cada exercício.</p>
      <p><b>5.4.</b> Os honorários em atraso sofrerão multa de 2% e juros de 1% ao mês, além de correção monetária, e serão reajustados anualmente pelo IPCA.</p>`)}

    ${Cl(6, '– DA VIGÊNCIA E RESCISÃO', `
      <p>O contrato vigora por prazo indeterminado. A rescisão deverá ser comunicada por escrito, com antecedência mínima de 30 (trinta) dias, permanecendo as cláusulas em vigor durante esse período.</p>`)}

    ${Cl(7, '– DO VÍNCULO E RESPONSABILIDADE DOS SÓCIOS', `
      <p>O presente contrato não gera vínculo empregatício entre as partes. Os sócios da CONTRATANTE assinam na condição de fiadores solidários e principais pagadores de todas as obrigações contratuais decorrentes.</p>`)}

    ${Cl(8, '– DO FORO', `
      <p>Fica eleito o foro da comarca de Imbituba/SC para dirimir as questões oriundas deste instrumento, renunciando as partes a qualquer outro, por mais privilegiado que seja.</p>`)}

    <p style="margin-top:14pt">E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor.</p>
    <p style="text-align:center; margin-top:10pt">${dataExtenso()}</p>

    <table class="sigs">
      <tr>
        <td class="sig">
          <div class="sig-line"></div>
          <div class="sig-name">NAUTA CONTABILIDADE LTDA</div>
          <div class="sig-role">CONTRATADA</div>
        </td>
        <td class="sig">
          <div class="sig-line"></div>
          <div class="sig-name">${nomeContratante}</div>
          <div class="sig-role">CONTRATANTE</div>
        </td>
      </tr>
    </table>
    ${fiadoresRows}

    <div class="foot">NAUTA CONTABILIDADE LTDA · CNPJ 19.361.966/0001-82 · Avenida Santa Catarina, Centro — Imbituba/SC · nautacontabilidade.com.br</div>
  </div>
</body></html>`
}
