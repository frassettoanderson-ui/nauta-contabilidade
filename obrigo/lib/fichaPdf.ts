import type { EmpresaDetalhe } from './tipos';

// Gera um PDF de impressão com TODAS as informações cadastrais da empresa (ficha completa).
// jspdf é carregado sob demanda (lazy), fora do bundle principal.

type Par = [string, string];
const s = (v: unknown) => (v == null || v === '' ? '—' : String(v));
const money = (v: unknown) => {
  const n = Number(v);
  return v == null || v === '' || Number.isNaN(n) ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const data = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};
const fmtCnpj = (d: string) => (d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : d);
const fmtCpf = (d: string) => (d.length === 11 ? d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : d);
const doc0 = (v: string | null) => { const d = String(v ?? '').replace(/\D/g, ''); return d.length === 14 ? fmtCnpj(d) : d.length === 11 ? fmtCpf(d) : (v ?? '—'); };

export async function gerarFichaPdf(
  e: EmpresaDetalhe,
  opts: { regimeNome?: string; grupoNome?: string } = {},
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const MARCA: [number, number, number] = [244, 121, 32];
  const MARINHO: [number, number, number] = [14, 34, 64];

  // Cabeçalho
  doc.setFillColor(...MARINHO);
  doc.rect(0, 0, W, 60, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('Ficha cadastral da empresa', 40, 28);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${e.razaoSocial}${e.numero != null ? `  [${e.numero}]` : ''}`, 40, 46);
  doc.setFontSize(8);
  doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, W - 40, 46, { align: 'right' });

  let y = 78;
  const secao = (titulo: string, pares: Par[]) => {
    const body = pares.filter(([, v]) => v !== undefined);
    autoTable(doc, {
      startY: y,
      head: [[{ content: titulo, colSpan: 2 }]],
      body: body.map(([k, v]) => [k, v]),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: MARCA, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 150, fontStyle: 'bold', textColor: [71, 85, 105] } },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  };
  const tabela = (titulo: string, head: string[], body: string[][]) => {
    if (y > doc.internal.pageSize.getHeight() - 90) { doc.addPage(); y = 50; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...MARCA);
    doc.text(titulo, 40, y); y += 6;
    const corpo = body.length ? body : [[{ content: 'Nenhum registro.', colSpan: head.length }]];
    autoTable(doc, {
      startY: y,
      head: [head],
      body: corpo as unknown as import('jspdf-autotable').RowInput[],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: MARINHO, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  };

  const cnpjPrinc = e.identificadores.find((i) => i.tipo === 'CNPJ')?.valor;
  secao('Identificação', [
    ['Razão social', s(e.razaoSocial)],
    ['Nome fantasia', s(e.nomeFantasia)],
    ['CNPJ / CPF', cnpjPrinc ? doc0(cnpjPrinc) : '—'],
    ['Regime tributário', s(opts.regimeNome)],
    ['Grupo de empresas', s(opts.grupoNome)],
    ['Apelido e-Contínuo', s(e.apelidoEcontinuo)],
    ['Situação', e.ativo ? 'Ativa' : 'Inativa'],
    ['Em abertura', e.emAbertura ? 'Sim' : 'Não'],
    ['Cliente desde', data(e.dataEntrada)],
    ['Data de abertura', data(e.dataAbertura)],
  ]);

  const ies = (e.inscricoesEstaduais ?? []).map((i) => `${i.valor}${i.uf ? `/${i.uf}` : ''}`).join(', ');
  secao('Endereço e inscrições', [
    ['CEP', s(e.cep)],
    ['Endereço', `${s(e.logradouro)}${e.numeroEndereco ? `, ${e.numeroEndereco}` : ''}`],
    ['Complemento', s(e.complemento)],
    ['Bairro', s(e.bairro)],
    ['Cidade / UF', `${s(e.cidade)}${e.uf ? ` / ${e.uf}` : ''}`],
    ['Telefone', s(e.telefone)],
    ['E-mail', s(e.emailPrincipal)],
    ['Website', s(e.website)],
    ['NIRE', s(e.nire)],
    ['Inscrição municipal', s(e.inscricaoMunicipal)],
    ['Inscrições estaduais', e.ieIsenta ? 'Isenta' : (ies || '—')],
  ]);

  secao('Contrato e honorários', [
    ['Tipo de contrato', s(e.interesse)],
    ['Honorário mensal', money(e.honorario)],
    ['Dia do vencimento', s(e.diaVencimento)],
    ['1º vencimento', data(e.primeiroVencimento)],
    ['Valor da abertura', money(e.valorAbertura)],
    ['Condições negociadas', s(e.negociacaoObs)],
  ]);

  secao('Atividade, capital e imóvel', [
    ['Atividade', s(e.atividade)],
    ['Capital social', money(e.capitalSocial)],
    ['Inscrição imobiliária', s(e.inscricaoImobiliaria)],
    ['Área ocupada (m²)', s(e.areaOcupada)],
    ['Área da edificação (m²)', s(e.areaEdificacao)],
    ['Proprietário do imóvel', s(e.proprietarioNome)],
    ['CPF do proprietário', e.proprietarioCpf ? doc0(e.proprietarioCpf) : '—'],
    ['Usa gás GLP', e.usaGlp == null ? '—' : e.usaGlp ? 'Sim' : 'Não'],
  ]);

  const socios = e.socios ?? [];
  if (!socios.length) {
    secao('Quadro societário', [['Sócios', 'Nenhum sócio cadastrado.']]);
  } else {
    socios.forEach((x, i) => {
      const end = [x.endereco, x.bairro].filter(Boolean).join(', ');
      secao(`Sócio ${i + 1}${x.nomeCompleto ? ` — ${x.nomeCompleto}` : ''}`, [
        ['CPF', x.cpf ? doc0(x.cpf) : '—'],
        ['RG', s(x.rg)],
        ['Participação', x.participacao == null || x.participacao === '' ? '—' : `${x.participacao}%`],
        ['Nascimento', s(x.nascimento)],
        ['Estado civil', s(x.estadoCivil)],
        ['Nome do pai', s(x.nomePai)],
        ['Nome da mãe', s(x.nomeMae)],
        ['Recibo IRPF', s(x.reciboIrpf)],
        ['Título de eleitor', s(x.tituloEleitor)],
        ['E-mail', s(x.email)],
        ['Telefone', s(x.telefone)],
        ['CEP', s(x.cep)],
        ['Endereço', end || '—'],
        ['Cidade / UF', s(x.cidadeEstado)],
      ]);
    });
  }

  if (e.identificadores.length) {
    tabela('Identificadores', ['Tipo', 'Valor', 'Apelido'],
      e.identificadores.map((i) => [s(i.tipo), doc0(i.valor), s(i.apelido)]));
  }

  tabela('Contatos', ['Nome', 'Cargo', 'WhatsApp', 'E-mail'],
    (e.contatos ?? []).map((c) => [s(c.nome), s(c.cargo), s(c.whatsapp), s(c.email)]));

  if (e.filiais?.length) {
    tabela('Filiais', ['CNPJ', 'Fantasia', 'Município', 'UF', 'Telefone'],
      e.filiais.map((fl) => [doc0(fl.cnpj ?? ''), s(fl.fantasia), s(fl.municipio), s(fl.estado), s(fl.telefone)]));
  }

  const tags = (e.tags ?? []).map((t) => t.tag?.nome).filter(Boolean).join(', ');
  if (tags || e.anexos?.length || e.anotacoes) {
    secao('Outros', [
      ['Tags', tags || '—'],
      ['Arquivos anexos', (e.anexos ?? []).map((a) => a.nomeArquivo).join(', ') || '—'],
      ['Anotações', s(e.anotacoes)],
    ]);
  }

  // Rodapé com paginação
  const total = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5); doc.setTextColor(150);
    doc.text(`Obrigô — ficha cadastral · ${e.razaoSocial}`, 40, doc.internal.pageSize.getHeight() - 18);
    doc.text(`${p}/${total}`, W - 40, doc.internal.pageSize.getHeight() - 18, { align: 'right' });
  }

  const nome = `ficha-${e.razaoSocial.replace(/[^\w]+/g, '-').slice(0, 40)}.pdf`;
  doc.save(nome);
}
