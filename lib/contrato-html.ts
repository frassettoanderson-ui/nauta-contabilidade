import { tipoFromInteresse, OBJETO, usaEmpresa, usaAbertura, TIPO_LABEL } from './contratos'

type Obj = Record<string, any>

export interface ContratoLogos {
  header?: string  // data URI da logo horizontal
  marca?: string   // data URI da logo p/ marca d'água
}

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const val = (v: unknown) => { const s = String(v ?? '').trim(); return s || '—' }
const brl = (v: unknown) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nl2br = (v: unknown) => esc(v).replace(/\r?\n/g, '<br/>')
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

  // Espaço para observações de negociação (carência, honorário por período etc.)
  const obsNeg = String(lead?.negociacao_obs ?? '').trim()
  const blocoObs = obsNeg
    ? `<div class="obs-box">
         <div class="obs-titulo">Condições Especiais Negociadas</div>
         <p>${nl2br(obsNeg)}</p>
       </div>`
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
  ul { margin: 4pt 0 4pt 0; padding-left: 18pt; }
  ul li { margin: 2pt 0; text-align: justify; }

  .parte-titulo { font-family:'Liberation Sans',Arial,sans-serif; font-size:9pt; font-weight:bold; text-transform:uppercase; letter-spacing:1.5pt;
    color:#0BBCD4; margin: 14pt 0 4pt; }
  table.dados { width:100%; border-collapse:collapse; margin-bottom:4pt; }
  table.dados th, table.dados td { border:.5pt solid #cfd6e0; padding:4pt 8pt; font-size:10pt; vertical-align:top; }
  table.dados th { width:34%; background:#f4f6f9; text-align:left; font-weight:bold; color:#374151; }

  .preambulo { margin-top:14pt; font-style:italic; color:#33333a; }

  /* Caixa de observações da negociação */
  .obs-box { margin: 8pt 0; border:1pt solid #0BBCD4; border-left:3pt solid #0BBCD4; border-radius:6pt; background:#f2fbfd; padding:7pt 10pt; }
  .obs-titulo { font-family:'Liberation Sans',Arial,sans-serif; font-size:8.5pt; font-weight:bold; text-transform:uppercase; letter-spacing:1pt; color:#0a8aa0; margin-bottom:3pt; }
  .obs-box p { margin:0; }

  .pgto { margin:4pt 0; }
  .pgto span { display:inline-block; margin-right:16pt; }

  table.sigs { width:100%; border-collapse:collapse; margin-top:30pt; }
  table.sigs td { width:50%; text-align:center; padding: 24pt 14pt 0; vertical-align:top; }
  .sig-line { border-top:.7pt solid #1d1d22; width:80%; margin: 0 auto 4pt; }
  .sig-name { font-weight:bold; font-size:10pt; }
  .sig-role { font-size:8.5pt; color:#6b7280; }

  table.test { width:100%; border-collapse:collapse; margin-top:22pt; }
  table.test td { width:50%; padding: 14pt 14pt 0; vertical-align:top; font-size:9.5pt; }
  .test-line { border-top:.7pt solid #1d1d22; width:90%; margin-bottom:3pt; }

  .anexo-titulo { font-family:'Liberation Sans',Arial,sans-serif; font-size:11.5pt; font-weight:bold; color:#11103a; margin:18pt 0 6pt; text-align:center; }
  .anexo-sub { font-family:'Liberation Sans',Arial,sans-serif; font-size:9.5pt; font-weight:bold; color:#0a8aa0; margin:10pt 0 2pt; }

  .foot { margin-top:18pt; border-top:.5pt solid #d8dde6; padding-top:6pt; font-family:'Liberation Sans',Arial,sans-serif; font-size:7.5pt; color:#9aa1ad; text-align:center; }
  .pagebreak { page-break-before: always; }
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
      <p><b>2.1.</b> A CONTRATANTE se obriga a remeter à CONTRATADA, mediante protocolo, constando data e nome de quem os receber, todos os arquivos digitais e/ou documentos necessários e indispensáveis ao desempenho dos serviços contratados, entre os quais:</p>
      <ul>
        <li>Boletim de caixa e documentos nele constantes;</li>
        <li>Extratos de todas as contas bancárias, inclusive aplicações, e documentos relativos aos lançamentos (depósitos, cópias de cheques, borderôs, descontos, contratos de crédito, avisos de crédito/débito);</li>
        <li>Notas Fiscais de compras (entradas), vendas (saídas) e de serviços prestados e tomados, bem como eventual comunicação de cancelamento;</li>
        <li>Controle de frequência dos empregados e comunicação de férias, admissão, rescisão ou correções salariais.</li>
      </ul>
      <p><b>2.1.1.</b> Fica a CONTRATADA isenta de responsabilidade ou penalidades decorrentes da falta ou atraso na escrituração em razão de informações, documentos ou arquivos não enviados ou enviados em desconformidade, ou da inobservância das orientações prestadas, sendo tais ônus suportados exclusivamente pela CONTRATANTE.</p>
      <p><b>2.1.2.</b> Os documentos, caso existentes, serão entregues e devolvidos mediante protocolo, devidamente datado e assinado.</p>
      <p><b>2.1.3.</b> Todas as solicitações, envio de informações, arquivos e eventuais documentos deverão ser enviados ou protocolados à CONTRATADA dentro do seu horário de expediente — mesmo aqueles enviados pelas plataformas digitais —, de segunda a sexta-feira, nos horários de funcionamento do escritório.</p>
      <p><b>2.2.</b> O recolhimento de impostos e encargos referentes à movimentação econômica da CONTRATANTE é de sua exclusiva responsabilidade, arcando com eventuais multas e juros por atraso ou falta de pagamento. A CONTRATADA não assume a responsabilidade pelo recolhimento de qualquer tributo da CONTRATANTE.</p>
      <p><b>2.3.</b> A CONTRATANTE declara ciência da Lei nº 9.613/98 e da Resolução CFC nº 1.445/13 (prevenção à lavagem de dinheiro), estando ciente de que as Organizações Contábeis têm a obrigação legal de comunicar operações ao COAF, e autoriza a CONTRATADA a repassar informações aos órgãos fiscalizadores quando legalmente solicitada.</p>
      <p><b>2.4.</b> A CONTRATANTE se obriga a cumprir as orientações da CONTRATADA (normas trabalhistas, previdenciárias e fiscais), eximindo-se esta das consequências da sua inobservância.</p>
      <p><b>2.5.</b> A CONTRATANTE obriga-se a assinar, sempre que necessário, a Carta de Responsabilidade da Administração (Resolução CFC nº 987/03 e nº 1.418/12), ficando vinculada à sua entrega a assinatura das demonstrações contábeis, e declara ser de sua responsabilidade a adequação dos controles internos e a idoneidade dos documentos encaminhados.</p>
      <p><b>2.5.1.</b> A CONTRATANTE declara que não realizará operação que possa ser considerada ilegal e que não tem conhecimento de fatos, fraudes ou violações de leis e regulamentos — envolvendo a administração, empregados ou terceiros — que possam ter efeito relevante nas demonstrações contábeis ou afetar a continuidade das operações da empresa.</p>
      <p><b>2.6.</b> A CONTRATANTE deverá manter atualizados os programas de medicina e segurança do trabalho inerentes à sua atividade (PPRA, PCMSO, PPP, CIPA e outros).</p>
      <p><b>2.7.</b> A CONTRATANTE indicará seus colaboradores/supervisores autorizados às tratativas junto à CONTRATADA (solicitações, envio e recebimento de documentos e arquivos), não sendo repassadas informações a colaboradores não autorizados.</p>`)}

    ${Cl(3, '– DAS OBRIGAÇÕES DA CONTRATADA', `
      <p>A CONTRATADA se obriga a cumprir a legislação Federal, Estadual e Municipal, desempenhando os serviços com zelo, diligência e honestidade, resguardando os interesses da CONTRATANTE, sujeitando-se ao Código de Ética Profissional do Contabilista.</p>
      <p><b>3.1.</b> A CONTRATADA responsabiliza-se por todos os prepostos que atuarem nos serviços ora contratados, indenizando a CONTRATANTE em caso de culpa ou dolo.</p>
      <p><b>3.1.1.</b> A CONTRATADA não se responsabilizará por multas, juros ou correções decorrentes da falta de recolhimento de obrigações, que correm por conta exclusiva da CONTRATANTE, assim como aquelas ocasionadas por falta de entrega de documentos ou por falhas nos sistemas do governo.</p>
      <p><b>3.2.</b> A CONTRATADA fornecerá à CONTRATANTE, em seu escritório e dentro do horário normal de expediente, mediante agendamento prévio, todas as informações solicitadas relativas ao andamento dos serviços contratados.</p>
      <p><b>3.3.</b> A CONTRATADA responsabiliza-se pelos documentos e arquivos digitais a ela entregues enquanto permanecerem sob sua guarda, respondendo pelo mau uso, perda ou extravio, salvo comprovado caso fortuito ou força maior.</p>
      <p><b>3.3.1.</b> A CONTRATADA não assume responsabilidade pelas consequências de informações, declarações ou documentação inidôneas ou incompletas, nem por omissões da CONTRATANTE ou decorrentes do desrespeito à orientação prestada.</p>
      <p><b>3.4.</b> Os serviços terão por base o regime fiscal atual da CONTRATANTE (Simples Nacional, Lucro Presumido ou Lucro Real); havendo mudança de regime, as partes negociarão as alterações necessárias mediante termo aditivo próprio.</p>
      <p><b>3.4.1.</b> A CONTRATADA não se responsabilizará por obrigações acessórias vencidas ou vincendas no processo de transferência de responsabilidade técnica, as quais são de responsabilidade da empresa de contabilidade anterior.</p>
      <p><b>3.5.</b> As declarações de recebimento ou remessa para o exterior (SISCOSERV, DME e outras vinculadas ao Ministério da Fazenda/COAF), bem como licenças ambientais, registros junto à Marinha ou a entidades de classe ligadas ao ramo da atividade exercida, não são de responsabilidade da CONTRATADA, podendo esta auxiliar nesses assuntos por mera liberalidade.</p>
      <p><b>3.6.</b> A CONTRATADA compromete-se a cumprir os prazos da legislação, observando-se em especial:</p>
      <ul>
        <li>entrega das guias de recolhimento de tributos e encargos com antecedência mínima de 02 (dois) dias do vencimento, desde que fornecidas as bases pela CONTRATANTE;</li>
        <li>entrega de balancetes até o dia 20 do 1º mês subsequente ao semestre a que se referir;</li>
        <li>entrega do Balanço Anual em até 30 dias do mês de março, e das demais Demonstrações Contábeis obrigatórias em até 60 dias após a entrega de todos os documentos e informações necessários.</li>
      </ul>`)}

    ${Cl(4, '– DA PROTEÇÃO DOS DADOS PESSOAIS', `
      <p>Os termos “Dado Pessoal”, “Dado Pessoal Sensível”, “Titular” e “Tratamento” deverão ser interpretados conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).</p>
      <p><b>4.1.</b> As partes garantem que todas as operações com dados pessoais serão realizadas de acordo com a legislação aplicável e com as determinações dos órgãos reguladores, amparadas por base legal válida e adequada à prestação dos serviços contábeis, sendo vedada a utilização para finalidade distinta.</p>
      <p><b>4.2.</b> A CONTRATANTE deverá informar de maneira clara e transparente ao titular sobre o compartilhamento de seus dados, obtendo meio válido para tal operação, sob pena de arcar integralmente com as perdas e danos que causar.</p>
      <p><b>4.3.</b> A CONTRATADA manterá as informações compartilhadas em ambiente físico e/ou virtual protegido por medidas técnicas e administrativas adequadas, e manterá o mais absoluto sigilo e confidencialidade dos dados a que tiver acesso, durante a vigência do contrato e após o seu término.</p>
      <p><b>4.4.</b> Ocorrendo qualquer incidente de segurança (acesso não autorizado, perda, alteração ou tratamento inadequado), a parte ciente notificará a outra em prazo razoável, informando data e hora do incidente e da ciência, natureza dos dados afetados, riscos envolvidos e medidas adotadas para mitigar os efeitos.</p>
      <p><b>4.5.</b> A CONTRATADA não será responsável por perdas ou danos causados no âmbito do tratamento realizado pela CONTRATANTE, devendo esta indenizar terceiros e a CONTRATADA pelo valor integral dos prejuízos, incluindo sanções administrativas e condenações judiciais.</p>`)}

    ${Cl(5, '– DOS HONORÁRIOS PROFISSIONAIS', `
      <p><b>5.1.</b> Pela execução dos serviços constantes no “Anexo 1”, a CONTRATANTE pagará à CONTRATADA, mensalmente, honorários no valor de <b>R$ ${brl(lead?.valor_honorario)}</b>, até o dia 10 (dez) do mês subsequente aos serviços prestados, mediante:</p>
      <div class="pgto"><span>( ) Boleto Bancário</span><span>( ) Pagamento direto no Escritório</span><span>(x) Transferência Bancária</span></div>
      ${blocoObs}
      ${aberturaLinha}
      <p><b>5.3.</b> Além da mensalidade, será devido um adicional anual (13ª parcela), equivalente a uma mensalidade vigente, a ser pago até 10 de dezembro de cada exercício, destinado ao acréscimo de serviços do encerramento (demonstrações anuais, declaração de rendimentos PJ, DIRF e folha do 13º salário). No início ou rescisão no curso do exercício, esta parcela será devida proporcionalmente aos meses de vigência.</p>
      <p><b>5.4.</b> Os honorários não pagos na data sofrerão multa contratual de 2% (dois por cento), juros moratórios de 1% (um por cento) ao mês e correção monetária. O inadimplemento consecutivo de 2 (duas) mensalidades ensejará a suspensão imediata da prestação dos serviços, independentemente de notificação.</p>
      <p><b>5.5.</b> Os honorários serão corrigidos anualmente pelo índice IPCA, em comum acordo entre as partes, e poderão ser repactuados quando houver alteração na forma de tributação ou quando o número de registros de empregados ultrapassar a quantidade acordada no “Anexo 1”.</p>
      <p><b>5.6.</b> Serviços extras não previstos no “Anexo 1” — tais como alteração contratual, abertura/baixa de empresa, declaração de IRPF, certidões, parcelamento de débitos, cálculo de tributos em atraso, autenticação/registro de livros, entre outros — serão cobrados separadamente, conforme orçamento previamente aprovado pela CONTRATANTE. As retificações de obrigações acessórias decorrentes de informações inidôneas, incompletas ou intempestivas fornecidas pela CONTRATANTE também serão remuneradas em separado.</p>
      <p><b>5.6.1.</b> Os serviços extraordinários serão cobrados conforme a tabela de “Política de Preços” da CONTRATADA, dividida por tipo de serviço, revisada anualmente e disponível para consulta pela CONTRATANTE a qualquer tempo.</p>
      <p><b>5.7.</b> O valor dos honorários é fixado com base no volume de lançamentos contábeis/fiscais, no número de funcionários e na tabela profissional vigente, levando-se em conta o volume de informações e documentos fornecidos pela CONTRATANTE.</p>
      <p><b>5.8.</b> Os custos com livros fiscais, pastas, cópias reprográficas, autenticações, reconhecimento de firmas, custas, emolumentos e taxas exigidas pelos serviços públicos, entre outros, não estão incluídos nos honorários e deverão ser ressarcidos à CONTRATADA pela CONTRATANTE.</p>
      <p><b>5.9.</b> Os serviços não contratados no “Anexo 1” que venham a ser exigidos em eventual fiscalização, solicitação judicial ou pela própria CONTRATANTE serão executados mediante preço previamente ajustado entre as partes.</p>`)}

    ${Cl(6, '– DA PROPRIEDADE INTELECTUAL', `
      <p>Todos os documentos, materiais e informações fornecidos pela CONTRATADA gozam de direitos autorais (intelectuais) e somente poderão ser utilizados pela CONTRATANTE durante a vigência do contrato, obrigando-se esta a manter sigilo e a não revelar, reproduzir, repassar ou dar conhecimento a terceiros, bem como a não tomar qualquer medida visando obter, para si ou para terceiros, os direitos de propriedade intelectual relativos a tais informações.</p>
      <p><b>Parágrafo único.</b> O descumprimento acarretará multa, de forma cumulativa em caso de reincidência, no valor de 2 (duas) mensalidades vigentes ou, no caso de contrato já encerrado, do último valor pago à época da contratação.</p>`)}

    ${Cl(7, '– DA VIGÊNCIA, RESCISÃO E TRANSFERÊNCIA', `
      <p>O presente contrato vigora por prazo indeterminado. A parte que desejar rescindir deverá comunicar a outra, por escrito, com antecedência mínima de 30 (trinta) dias, período no qual todas as cláusulas permanecem em vigor.</p>
      <p><b>7.1.</b> No prazo do pré-aviso, a dispensa da execução de serviços pela CONTRATANTE não a desobriga do pagamento dos honorários integrais até o termo final do período.</p>
      <p><b>7.2.</b> A CONTRATANTE providenciará, em até 05 (cinco) dias da comunicação da rescisão, a transferência da responsabilidade técnica contábil junto aos órgãos federais, estaduais e municipais e ao Conselho Regional de Contabilidade, informando à CONTRATADA o nome, endereço, responsável técnico e CRC da nova empresa contábil. Os documentos e livros contábeis só serão entregues ao novo profissional após o cumprimento das formalidades do Termo de Transferência de Responsabilidade Técnica (Resolução CFC nº 825/98).</p>
      <p><b>7.2.1.</b> Os dados que compõem o banco de dados do sistema de gestão contábil da CONTRATADA, contendo as informações da CONTRATANTE, poderão ser repassados a esta ou a quem ela designar, mediante anuência escrita, podendo a CONTRATADA cobrar eventuais custos que julgar necessários para tal liberação.</p>
      <p><b>7.3.</b> A falta de pagamento de qualquer parcela de honorários, bem como a falência da CONTRATANTE, facultará à CONTRATADA suspender imediatamente a execução dos serviços e considerar rescindido o contrato, independentemente de notificação judicial ou extrajudicial.</p>
      <p><b>7.3.1.</b> Em caso de suspensão, a CONTRATADA não se responsabiliza por eventuais multas e notificações geradas em virtude da paralisação dos serviços, ficando estas sob responsabilidade da CONTRATANTE.</p>
      <p><b>7.4.</b> Considerar-se-á rescindido o contrato caso qualquer das partes infrinja cláusula ora convencionada, ficando estipulada multa contratual de 2 (duas) mensalidades vigentes, exigível por inteiro da parte que der causa à rescisão motivada.</p>`)}

    ${Cl(8, '– DO VÍNCULO EMPREGATÍCIO E DA RESPONSABILIDADE DOS SÓCIOS', `
      <p>O presente contrato não gera qualquer vínculo empregatício entre as partes, ou entre a CONTRATANTE e os prepostos da CONTRATADA. Os sócios da CONTRATANTE assinam o presente na condição de fiadores solidários e principais pagadores em relação a todas as obrigações contratuais decorrentes.</p>`)}

    ${Cl(9, '– DA EXECUTIVIDADE DO TÍTULO', `
      <p>Atribui-se executividade ao presente instrumento, assinado por duas testemunhas, por força do art. 784, inciso III, do Código de Processo Civil.</p>`)}

    ${Cl(10, '– DO FORO', `
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

    <table class="test">
      <tr>
        <td>
          <div class="test-line"></div>
          Testemunha 1<br/>Nome:<br/>CPF:
        </td>
        <td>
          <div class="test-line"></div>
          Testemunha 2<br/>Nome:<br/>CPF:
        </td>
      </tr>
    </table>

    <div class="pagebreak"></div>
    <div class="anexo-titulo">ANEXO 1 — Serviços Profissionais de Contabilidade</div>
    <div class="anexo-sub">1 — Escrituração Contábil</div>
    <ul>
      <li>Classificação da contabilidade conforme normas e princípios contábeis vigentes;</li>
      <li>Emissão de balancetes;</li>
      <li>Elaboração de demonstrativos contábeis.</li>
    </ul>
    <div class="anexo-sub">2 — Escrituração Fiscal</div>
    <ul>
      <li>Orientação e controle da aplicação dos dispositivos legais federais, estaduais e municipais;</li>
      <li>Escrituração dos registros fiscais dos livros obrigatórios e das obrigações acessórias pertinentes (incl. ISSQN);</li>
      <li>Apuração de impostos e atendimento das demais exigências da legislação.</li>
    </ul>
    <div class="anexo-sub">3 — Departamento de Pessoal</div>
    <ul>
      <li>Admissões, contratos de experiência e comunicações ao Ministério do Trabalho;</li>
      <li>Folha de pagamento, recibos, FGTS, INSS e guias de arrecadação;</li>
      <li>Rescisões, férias, 13º salário, seguro-desemprego, vale-transporte e salário-família;</li>
      <li>Comprovantes de rendimento e demais obrigações acessórias trabalhistas e previdenciárias.</li>
    </ul>

    <div class="foot">NAUTA CONTABILIDADE LTDA · CNPJ 19.361.966/0001-82 · Avenida Santa Catarina, Centro — Imbituba/SC · nautacontabilidade.com.br</div>
  </div>
</body></html>`
}
