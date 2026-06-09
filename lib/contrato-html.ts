import { tipoFromInteresse, OBJETO, usaEmpresa, usaAbertura, TIPO_LABEL } from './contratos'

type Obj = Record<string, any>

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const brl = (v: unknown) => {
  const n = Number(v) || 0
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const hoje = () => {
  const d = new Date()
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `Imbituba/SC, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

/** Monta o HTML do contrato conforme o tipo (derivado do interesse do lead). */
export function buildContratoHtml(cliente: Obj, lead: Obj): string {
  const tipo = tipoFromInteresse(lead?.interesse) || 3
  const comEmpresa = usaEmpresa(tipo)
  const comAbertura = usaAbertura(tipo) && Number(lead?.valor_abertura) > 0

  const socios: Obj[] = (cliente.socios || []).filter((s: Obj) => s && (s.nome_completo || s.cpf))
  const pessoaNome = esc(cliente.cli_nome_completo)
  const pessoaCpf = esc(cliente.cli_cpf)

  // Bloco CONTRATANTE
  const contratante = comEmpresa
    ? `
      <tr><td>Razão Social / Nome</td><td>${esc(cliente.emp_nome)}</td></tr>
      <tr><td>CNPJ</td><td>${esc(cliente.emp_cnpj)}</td></tr>
      <tr><td>Endereço</td><td>${esc(cliente.emp_endereco)}</td></tr>
      <tr><td>Bairro</td><td>${esc(cliente.emp_bairro)}</td></tr>
      <tr><td>Cidade / Estado</td><td>${esc(cliente.emp_cidade_estado)}</td></tr>
      <tr><td>CEP</td><td>${esc(cliente.emp_cep)}</td></tr>
      <tr><td>E-mail</td><td>${esc(cliente.emp_email)}</td></tr>
      <tr><td>Contato</td><td>${esc(cliente.emp_telefone)}</td></tr>
      <tr><td>Sócio Administrador</td><td>${pessoaNome}</td></tr>
      <tr><td>CPF do Sócio</td><td>${pessoaCpf}</td></tr>`
    : `
      <tr><td>Nome do Responsável Legal</td><td>${pessoaNome}</td></tr>
      <tr><td>CPF</td><td>${pessoaCpf}</td></tr>
      <tr><td>RG</td><td>${esc(cliente.cli_rg)}</td></tr>
      <tr><td>Endereço</td><td>${esc(cliente.cli_endereco)}</td></tr>
      <tr><td>Bairro</td><td>${esc(cliente.cli_bairro)}</td></tr>
      <tr><td>Cidade / Estado</td><td>${esc(cliente.cli_cidade_estado)}</td></tr>
      <tr><td>CEP</td><td>${esc(cliente.cli_cep)}</td></tr>`

  const honorario = brl(lead?.valor_honorario)
  const aberturaLinha = comAbertura
    ? `<p>5.1.1. Pela ${tipo === 1 ? 'abertura/constituição da empresa' : 'execução dos serviços iniciais'}, a CONTRATANTE pagará à CONTRATADA o valor único de <b>R$ ${brl(lead?.valor_abertura)}</b>, devido na contratação.</p>`
    : ''

  const fiadores = socios.length > 0
    ? socios.map((s, i) => `
        <div class="assinatura">
          <div class="linha"></div>
          <p>${esc(s.nome_completo)}<br/>CPF: ${esc(s.cpf)} — Sócio fiador</p>
        </div>`).join('')
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 2.2cm 2cm; }
  body { font-family: 'Liberation Serif', 'Times New Roman', serif; font-size: 11pt; color: #111; line-height: 1.5; }
  h1 { font-size: 15pt; text-align: center; margin-bottom: 18pt; }
  h2 { font-size: 11.5pt; margin-top: 16pt; margin-bottom: 4pt; }
  p { margin: 4pt 0; text-align: justify; }
  table.dados { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 10pt; }
  table.dados td { border: 1px solid #999; padding: 4pt 6pt; }
  table.dados td:first-child { width: 38%; background: #f0f0f0; font-weight: bold; }
  .sec-title { font-weight: bold; margin-top: 10pt; }
  .assinaturas { margin-top: 40pt; }
  .assinatura { margin-top: 34pt; text-align: center; }
  .assinatura .linha { border-top: 1px solid #000; width: 60%; margin: 0 auto 4pt; }
  .small { font-size: 9.5pt; color: #444; }
</style></head>
<body>
  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS</h1>
  <p class="small" style="text-align:center">${TIPO_LABEL[tipo]}</p>

  <p class="sec-title">CONTRATANTE</p>
  <table class="dados">${contratante}</table>

  <p class="sec-title">CONTRATADA</p>
  <table class="dados">
    <tr><td>Razão Social</td><td>NAUTA CONTABILIDADE LTDA</td></tr>
    <tr><td>CNPJ</td><td>19.361.966/0001-82</td></tr>
    <tr><td>Endereço</td><td>Avenida Santa Catarina — Centro, Imbituba/SC</td></tr>
    <tr><td>Responsável Técnico</td><td>Guilherme Dias Ronchi — CRC 041514/O</td></tr>
  </table>

  <p>${hoje()}</p>

  <p>Pelo presente instrumento particular, as partes acima devidamente qualificadas, doravante denominadas simplesmente CONTRATADA e CONTRATANTE, na melhor forma de direito, ajustam e contratam a prestação de serviços profissionais de contabilidade, segundo as cláusulas e condições adiante listadas.</p>

  <h2>CLÁUSULA 1 – DO OBJETO</h2>
  <p>${OBJETO[tipo]}</p>

  <h2>CLÁUSULA 2 – DAS OBRIGAÇÕES DA CONTRATANTE</h2>
  <p>2.1 - A CONTRATANTE se obriga a remeter à CONTRATADA, mediante protocolo, todos os arquivos digitais e documentos necessários e indispensáveis ao desempenho dos serviços contratados.</p>
  <p>2.2 – O recolhimento de impostos e encargos referentes à movimentação econômica da CONTRATANTE é de sua exclusiva responsabilidade, devendo arcar com o pagamento de eventuais multas e juros incidentes pelo atraso ou falta de pagamento.</p>
  <p>2.3 – A CONTRATANTE se obriga a cumprir as orientações dadas pela CONTRATADA (normas trabalhistas, previdenciárias, fiscais, entre outras), eximindo-se esta das consequências e penalidades oriundas da sua não observância.</p>
  <p>2.4 – A CONTRATANTE deverá indicar seus colaboradores/supervisores que terão permissão para as tratativas junto à CONTRATADA.</p>

  <h2>CLÁUSULA 3 – DAS OBRIGAÇÕES DA CONTRATADA</h2>
  <p>A CONTRATADA se obriga a cumprir a Legislação Federal, Estadual e Municipal, desempenhando os serviços objeto deste contrato com zelo, diligência e honestidade, resguardando os interesses da CONTRATANTE, sujeitando-se às normas do Código de Ética Profissional do Contabilista.</p>
  <p>3.1 - A CONTRATADA não se responsabilizará por multas, juros ou correções monetárias decorrentes da falta de recolhimento de obrigações, que correm por conta e risco exclusivo da CONTRATANTE.</p>
  <p>3.2 – A CONTRATADA compromete-se a entregar as guias de recolhimento com antecedência mínima de 02 (dois) dias do vencimento, desde que fornecidas as bases pela CONTRATANTE.</p>

  <h2>CLÁUSULA 4 – DA PROTEÇÃO DOS DADOS PESSOAIS</h2>
  <p>As partes garantem que o tratamento de dados pessoais observará a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018), mantendo sigilo e confidencialidade, adotando medidas técnicas e administrativas de segurança e notificando a outra parte em caso de incidentes.</p>

  <h2>CLÁUSULA 5 – DOS HONORÁRIOS PROFISSIONAIS</h2>
  <p>5.1. Para a execução dos serviços, a CONTRATANTE pagará à CONTRATADA, mensalmente, honorários profissionais no valor de <b>R$ ${honorario}</b>, a serem pagos até o dia 10 (dez) do mês subsequente aos serviços prestados.</p>
  ${aberturaLinha}
  <p>5.2. Além da parcela mensal, a CONTRATANTE pagará um adicional anual correspondente ao valor de uma parcela mensal (13ª), devido até 10 de dezembro de cada exercício.</p>
  <p>5.3. Os honorários não pagos na data estipulada serão acrescidos de multa de 2% e juros de 1% ao mês, além de correção monetária.</p>
  <p>5.4. Os honorários serão corrigidos anualmente pelo índice IPCA, em comum acordo entre as partes.</p>

  <h2>CLÁUSULA 6 – DA VIGÊNCIA E RESCISÃO</h2>
  <p>O presente contrato vigora por prazo indeterminado. A parte que desejar rescindir deverá comunicar a outra, por escrito, com antecedência mínima de 30 (trinta) dias, permanecendo todas as cláusulas em vigor durante esse período.</p>

  <h2>CLÁUSULA 7 – DO VÍNCULO E DA RESPONSABILIDADE DOS SÓCIOS</h2>
  <p>O presente contrato não gera qualquer vínculo empregatício entre as partes. Os sócios da CONTRATANTE assinam o presente na condição de fiadores solidários e principais pagadores em relação a todas as obrigações contratuais decorrentes.</p>

  <h2>CLÁUSULA 8 – DO FORO</h2>
  <p>Fica eleito o foro da comarca de Imbituba/SC para dirimir as questões oriundas do presente instrumento, renunciando as partes a qualquer outro, por mais privilegiado que seja.</p>

  <p style="margin-top:14pt">Assim, por estarem justos e contratados, assinam as partes o presente instrumento.</p>
  <p>${hoje()}</p>

  <div class="assinaturas">
    <div class="assinatura"><div class="linha"></div><p>NAUTA CONTABILIDADE LTDA<br/>CONTRATADA</p></div>
    <div class="assinatura"><div class="linha"></div><p>${comEmpresa ? esc(cliente.emp_nome) : pessoaNome}<br/>CONTRATANTE</p></div>
    ${fiadores}
  </div>
</body></html>`
}
