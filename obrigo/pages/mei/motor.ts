// Motor do MEI no front — regras do painel da Atuan (motor-mei.js), com as correcoes decididas:
// faturamento unico (lancamentos de venda/servico), excesso de 20% sobre o limite do ano (proporcional na
// abertura), honorario com historico, competencias param no mes da inativacao.
import { api } from '../../lib/api';

export const ATIVIDADES: { v: string; t: string }[] = [
  { v: 'comercio', t: 'Comércio' }, { v: 'servicos', t: 'Serviços' }, { v: 'ambos', t: 'Comércio e serviços' }, { v: 'transporte', t: 'Transporte de cargas' },
];
export const SITUACOES_MEI = ['Ativo', 'Baixado', 'Desenquadrado', 'Inativo'];
export const SAL_MIN_PADRAO: Record<string, number> = { 2021: 1100, 2022: 1212, 2023: 1320, 2024: 1412, 2025: 1518, 2026: 1630 };
export const PRESUNCAO: Record<string, number> = { comercio: 8, transporte: 8, ambos: 8, servicos: 32 };
export const PGMEI_URL = 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao';
export const DASN_URL = 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/dasnsimei.app/Identificacao';
export const PARCEL_URL = 'https://www8.receita.fazenda.gov.br/SimplesNacional/aplicacoes.aspx?id=52';
export const PORTAL_URL = 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor';
export const CONTAS: { id: string; grupo: string; sinal: 1 | -1; rotulo: string }[] = [
  { id: 'rec_vendas', grupo: 'Receitas', sinal: 1, rotulo: 'Venda de mercadorias/produtos' },
  { id: 'rec_servicos', grupo: 'Receitas', sinal: 1, rotulo: 'Prestação de serviços' },
  { id: 'rec_outras', grupo: 'Receitas', sinal: 1, rotulo: 'Outras receitas' },
  { id: 'rec_fin', grupo: 'Receitas', sinal: 1, rotulo: 'Receitas financeiras' },
  { id: 'ded_impostos', grupo: 'Deduções e custos', sinal: -1, rotulo: 'Impostos sobre vendas (DAS/ICMS/ISS)' },
  { id: 'ded_devol', grupo: 'Deduções e custos', sinal: -1, rotulo: 'Devoluções e descontos' },
  { id: 'cmv', grupo: 'Deduções e custos', sinal: -1, rotulo: 'Custo das mercadorias/serviços (CMV/CSP)' },
  { id: 'desp_pessoal', grupo: 'Despesas', sinal: -1, rotulo: 'Despesas com pessoal' },
  { id: 'desp_admin', grupo: 'Despesas', sinal: -1, rotulo: 'Despesas administrativas' },
  { id: 'desp_comercial', grupo: 'Despesas', sinal: -1, rotulo: 'Despesas comerciais' },
  { id: 'desp_fin', grupo: 'Despesas', sinal: -1, rotulo: 'Despesas financeiras' },
  { id: 'outras_desp', grupo: 'Despesas', sinal: -1, rotulo: 'Outras despesas' },
];
export const conta = (id: string) => CONTAS.find((c) => c.id === id);
export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export interface Mei {
  id: string; empresaId: string | null; empresa: { id: string; razaoSocial: string; nomeFantasia: string | null } | null; apelido: string | null;
  codigo: string | null; cnpj: string | null; ocupacao: string | null; atividade: string; situacao: string; abertura: string | null; temEmpregado: boolean;
  honorario: number; honorarioHist: Record<string, number>; comissaoPct: number; comissaoPctHist: Record<string, number>;
  honPago: Record<string, { pagoEm?: string } | true>; observacao: string | null; inativoEm: string | null; inativoMotivo: string | null;
  simeiBaixa: string | null; simeiBaixaEm: string | null;
}
export interface Guia { id: string; meiId: string; competencia: string; valor: number; situacao: string; pagoEm: string | null; parcelamentoId: string | null }
export interface Dasn { id: string; meiId: string; ano: number; situacao: string; entregueEm: string | null; receitaInformada: number | null }
export interface CompAcordo { competencia: string; valor: number; situacaoAnterior?: string; existiaGuia?: boolean }
export interface Acordo {
  id: string; meiId: string; competencias: CompAcordo[]; principal: number; juros: number; total: number; parcelas: number; valorParcela: number;
  valorPrimeira: number; parcelasPagas: number; adesao: string | null; protocolo: string | null; observacao: string | null; situacao: string; createdAt: string;
}
export interface Lancamento { id: string; meiId: string; data: string; competencia: string; conta: string; descricao: string | null; valor: number; automatico: boolean }
export interface Dados { meis: Mei[]; das: Guia[]; dasn: Dasn[]; parcelamentos: Acordo[]; config: { salarioMinimo: Record<string, number>; limiteAnual: number }; receitaMes: Record<string, Record<string, number>> }

export const r2 = (x: number) => Math.round(x * 100) / 100;
export function hojeISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
export const compAtual = () => hojeISO().slice(0, 7);
export function somaComp(c: string, n: number) { const [a, m] = c.split('-').map(Number); const t = a * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; }
export const rotuloComp = (c: string) => `${MESES[Number(c.slice(5, 7)) - 1]}/${c.slice(0, 4)}`;
export const dataBR = (d?: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '—');
export const brl = (v?: number | null) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const rotuloAtividade = (v: string) => ATIVIDADES.find((a) => a.v === v)?.t ?? '';

export const nomeMei = (m?: Mei | null) => m?.empresa?.razaoSocial ?? m?.apelido ?? 'MEI';
export const apelidoSeDiferente = (m: Mei) => (m.apelido && m.apelido !== m.empresa?.razaoSocial ? m.apelido : '');
export const ativo = (m: Mei) => (m.situacao || 'Ativo') === 'Ativo';
export const passaRecorte = (m: Mei, r: string) => (r === 'ativos' ? ativo(m) : r === 'inativos' ? !ativo(m) : r.startsWith('s:') ? m.situacao === r.slice(2) : true);
export const atividadeDe = (m?: Mei | null) => (m && ATIVIDADES.some((a) => a.v === m.atividade) ? m.atividade : '');

export function salarioMinimo(ano: number, cfg: Dados['config']) {
  const t = { ...SAL_MIN_PADRAO, ...cfg.salarioMinimo };
  if (Number(t[String(ano)])) return Number(t[String(ano)]);
  const anos = Object.keys(t).sort();
  return Number(t[anos[anos.length - 1]]) || 1630;
}
export function dasPartes(atividade: string, ano: number, cfg: Dados['config']) {
  const sm = salarioMinimo(ano, cfg);
  const inss = r2(sm * (atividade === 'transporte' ? 0.12 : 0.05));
  const icms = ['comercio', 'ambos', 'transporte'].includes(atividade) ? 1 : 0;
  const iss = ['servicos', 'ambos'].includes(atividade) ? 5 : 0;
  return { inss, icms, iss, total: r2(inss + icms + iss) };
}
export const das = (atividade: string, ano: number, cfg: Dados['config']) => dasPartes(atividade, ano, cfg).total;
export function vencimentoDe(c: string) { const p = somaComp(c, 1); return `${p}-20`; }

const compAbertura = (m: Mei) => (m.abertura ? m.abertura.slice(0, 7) : '');
export const honorarioDevido = (m: Mei, c: string) => !compAbertura(m) || c >= compAbertura(m);
// Depois da inativacao (baixa/desenquadramento), as competencias param no mes da inativacao
export const competenciaExiste = (m: Mei, c: string) => honorarioDevido(m, c) && (!m.inativoEm || ativo(m) || c <= m.inativoEm.slice(0, 7));
export const pago = (m: Mei, c: string) => !!m.honPago?.[c];
function doHistorico(h: Record<string, number> | undefined, c: string, atual: number) {
  const ks = Object.keys(h ?? {}).filter((k) => k <= c).sort();
  return ks.length ? Number(h![ks[ks.length - 1]]) : atual;
}
export const honorarioEm = (m: Mei, c: string) => doHistorico(m.honorarioHist, c, Number(m.honorario) || 0);
export const percentualEm = (m: Mei, c: string) => doHistorico(m.comissaoPctHist, c, m.comissaoPct ?? 10);

export function linha(m: Mei, c: string, cfg: Dados['config']) {
  const ano = Number(c.slice(0, 4));
  const honorario = honorarioEm(m, c);
  const ativ = atividadeDe(m);
  const dasV = das(ativ, ano, cfg);
  const liquido = r2(honorario - dasV);
  const pct = percentualEm(m, c);
  const comissao = r2(Math.max(0, liquido) * pct / 100);
  const pg = pago(m, c);
  return { honorario, das: dasV, partes: dasPartes(ativ, ano, cfg), liquido, pct, comissao, comissaoRealizada: pg ? comissao : 0, pago: pg, devido: honorarioDevido(m, c), atividadeIndefinida: !ativ };
}
export function fechamento(meis: Mei[], c: string, cfg: Dados['config']) {
  let previsto = 0, recebido = 0, comissoes = 0; const emAberto: { mei: Mei; honorario: number }[] = [];
  for (const m of meis) {
    if (!ativo(m) || !honorarioDevido(m, c)) continue;
    const l = linha(m, c, cfg);
    if (!l.honorario) continue;
    previsto += l.honorario;
    if (l.pago) { recebido += l.honorario; comissoes += l.comissao; } else emAberto.push({ mei: m, honorario: l.honorario });
  }
  emAberto.sort((a, b) => b.honorario - a.honorario);
  return { previsto: r2(previsto), recebido: r2(recebido), comissoes: r2(comissoes), aberto: r2(previsto - recebido), emAberto };
}

// Faturamento unico: lancamentos de venda e servico
export const receitaAno = (d: Dados, meiId: string, ano: number) => r2(Object.entries(d.receitaMes[meiId] ?? {}).filter(([c]) => c.startsWith(`${ano}-`)).reduce((s, [, v]) => s + v, 0));
export function limiteAno(m: Mei, ano: number, cfg: Dados['config']) {
  const cheio = Number(cfg.limiteAnual) || 81000;
  if (!m.abertura) return cheio;
  const aa = Number(m.abertura.slice(0, 4)); const ma = Number(m.abertura.slice(5, 7));
  if (ano < aa) return 0;
  if (ano > aa) return cheio;
  return r2(cheio / 12 * (12 - ma + 1));
}
export function enquadramento(d: Dados, m: Mei, ano: number) {
  const acumulado = receitaAno(d, m.id, ano);
  const limite = limiteAno(m, ano, d.config);
  const pct = limite ? Math.min(999, acumulado / limite * 100) : 0;
  const anoCorr = Number(hojeISO().slice(0, 4));
  const inicio = m.abertura && Number(m.abertura.slice(0, 4)) === ano ? Number(m.abertura.slice(5, 7)) : 1;
  const fim = ano === anoCorr ? Number(hojeISO().slice(5, 7)) : 12;
  const decorridos = Math.max(1, fim - inicio + 1); const mesesAno = 12 - inicio + 1;
  const projecao = ano > anoCorr ? 0 : r2(acumulado / decorridos * mesesAno);
  const teto20 = r2(limite * 1.2);
  const sit = limite && acumulado > teto20 ? { t: 'Excedeu +20% — desenquadramento retroativo', c: 'erro' }
    : limite && acumulado > limite ? { t: 'Excedeu o limite — desenquadra no ano seguinte', c: 'erro' }
      : pct >= 80 ? { t: 'Atenção — perto do limite', c: 'aviso' } : { t: 'Dentro do limite', c: 'ok' };
  return { acumulado, limite, pct, projecao, teto20, sit };
}

// Situacao do DAS numa competencia
export type SitDas = 'na' | 'pago' | 'vencido' | 'pendente' | 'parcelado' | 'dispensado';
export function situacaoDas(m: Mei, c: string, guias: Map<string, Guia>): SitDas {
  if (!competenciaExiste(m, c)) return 'na';
  const g = guias.get(`${m.id}|${c}`);
  if (g?.situacao === 'Pago') return 'pago';
  if (g?.situacao === 'Parcelado') return 'parcelado';
  if (g?.situacao === 'Dispensado') return 'dispensado';
  return vencimentoDe(c) < hojeISO() ? 'vencido' : 'pendente';
}
export const indiceGuias = (gs: Guia[]) => new Map(gs.map((g) => [`${g.meiId}|${g.competencia}`, g]));
export function competenciasDo(m: Mei, guias: Map<string, Guia>, cfg: Dados['config']) {
  const ini = m.abertura ? m.abertura.slice(0, 7) : `${Number(hojeISO().slice(0, 4)) - 5}-01`;
  const out: { comp: string; ano: number; situacao: SitDas; valor: number; vencimento: string; acordoId: string }[] = [];
  for (let c = ini; c <= compAtual(); c = somaComp(c, 1)) {
    if (!competenciaExiste(m, c)) continue;
    const g = guias.get(`${m.id}|${c}`);
    out.push({ comp: c, ano: Number(c.slice(0, 4)), situacao: situacaoDas(m, c, guias), valor: g?.valor ? g.valor : das(atividadeDe(m), Number(c.slice(0, 4)), cfg), vencimento: vencimentoDe(c), acordoId: g?.parcelamentoId ?? '' });
  }
  return out;
}
export function resumoDebitos(d: Dados, m: Mei, guias: Map<string, Guia>) {
  let aberto = 0, emAcordo = 0, vencidos = 0, aPagar = 0, parcelados = 0; let maisAntiga = '';
  for (const c of competenciasDo(m, guias, d.config)) {
    if (c.situacao === 'pago' || c.situacao === 'dispensado' || c.situacao === 'na') continue;
    if (c.situacao === 'parcelado' || c.acordoId) { parcelados++; emAcordo += c.valor; continue; }
    aberto += c.valor; if (c.situacao === 'vencido') vencidos++; else aPagar++;
    if (!maisAntiga) maisAntiga = c.comp;
  }
  return { aberto: r2(aberto), emAcordo: r2(emAcordo), vencidos, aPagar, parcelados, maisAntiga, semAcordoNoPainel: parcelados > 0 && !d.parcelamentos.some((p) => p.meiId === m.id) };
}

// DRE
export function dre(ls: Lancamento[]) {
  const s: Record<string, number> = {};
  for (const l of ls) if (conta(l.conta)) s[l.conta] = (s[l.conta] ?? 0) + Number(l.valor);
  const v = (k: string) => s[k] ?? 0;
  const recBruta = r2(v('rec_vendas') + v('rec_servicos')); const deducoes = r2(v('ded_impostos') + v('ded_devol'));
  const recLiquida = r2(recBruta - deducoes); const custo = r2(v('cmv')); const lucroBruto = r2(recLiquida - custo);
  const despOper = r2(v('desp_pessoal') + v('desp_admin') + v('desp_comercial')); const resFin = r2(v('rec_fin') - v('desp_fin'));
  const outras = r2(v('rec_outras') - v('outras_desp')); const resultado = r2(lucroBruto - despOper + resFin + outras);
  return { s: v, recBruta, deducoes, recLiquida, custo, lucroBruto, despOper, resFin, outras, resultado, margem: recBruta ? r2(resultado / recBruta * 100) : 0 };
}

// ─── API ────────────────────────────────────────────────────────────────────
export const meiApi = {
  dados: () => api.get<Dados>('/mei/dados'),
  salvar: (id: string | null, b: unknown) => (id ? api.put(`/mei/meis/${id}`, b) : api.post('/mei/meis', b)),
  excluir: (id: string) => api.del(`/mei/meis/${id}`),
  inativar: (id: string, b: unknown) => api.post(`/mei/meis/${id}/inativar`, b),
  reativar: (id: string) => api.post(`/mei/meis/${id}/reativar`),
  honorario: (id: string, comp: string, pago: boolean) => api.post(`/mei/meis/${id}/honorario`, { comp, pago }),
  comissao: (id: string, comp: string, pct: number) => api.post(`/mei/meis/${id}/comissao`, { comp, pct }),
  importar: (linhas: Record<string, string>[]) => api.post<{ novos: number; atualizados: number; ignoradas: number }>('/mei/meis/importar', { linhas }),
  lancamentos: (ano: number, meiId?: string) => api.get<Lancamento[]>(`/mei/lancamentos?ano=${ano}${meiId ? `&meiId=${meiId}` : ''}`),
  salvarLanc: (id: string | null, b: unknown) => (id ? api.put(`/mei/lancamentos/${id}`, b) : api.post('/mei/lancamentos', b)),
  excluirLanc: (id: string) => api.del(`/mei/lancamentos/${id}`),
  importarLanc: (meiId: string, linhas: Record<string, string>[]) => api.post<{ criados: number; ignoradas: number; repetidos: number }>('/mei/lancamentos/importar', { meiId, linhas }),
  lancarDas: (id: string, ano: number) => api.post<{ lancados: number }>(`/mei/meis/${id}/lancar-das`, { ano }),
  alternarDas: (meiId: string, competencia: string) => api.post('/mei/das/alternar', { meiId, competencia }),
  tirarParcelamento: (meiId: string, competencias: string[]) => api.post<{ devolvidas: number }>('/mei/das/tirar-parcelamento', { meiId, competencias }),
  dasn: (b: unknown) => api.post('/mei/dasn', b),
  salvarAcordo: (id: string | null, b: unknown) => (id ? api.put(`/mei/parcelamentos/${id}`, b) : api.post('/mei/parcelamentos', b)),
  acaoAcordo: (id: string, acao: string, pagas?: number) => api.post(`/mei/parcelamentos/${id}/${acao}`, { pagas }),
  excluirAcordo: (id: string) => api.del(`/mei/parcelamentos/${id}`),
  salarioMinimo: (ano: number, valor: number) => api.post('/mei/config/salario-minimo', { ano, valor }),
};

// ─── CSV ────────────────────────────────────────────────────────────────────
export function baixarCsv(nome: string, linhas: (string | number)[][]) {
  const cel = (v: string | number) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(,\d+)?$/.test(s)) s = `'${s}`;
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob(['﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; a.click();
}
export const moedaCsv = (v: number) => (Number(v) || 0).toFixed(2).replace('.', ',');
export function lerCsv(texto: string): Record<string, string>[] {
  const t = texto.replace(/^﻿/, '');
  const primeira = t.split(/\r?\n/)[0] ?? '';
  const sep = (primeira.match(/;/g)?.length ?? 0) > (primeira.match(/,/g)?.length ?? 0) ? ';' : ',';
  const linhas: string[][] = []; let campo = ''; let linha: string[] = []; let aspas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (aspas) { if (ch === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else aspas = false; } else campo += ch; continue; }
    if (ch === '"') aspas = true;
    else if (ch === sep) { linha.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; linha.push(campo); campo = ''; if (linha.some((x) => x.trim())) linhas.push(linha); linha = []; }
    else campo += ch;
  }
  linha.push(campo); if (linha.some((x) => x.trim())) linhas.push(linha);
  const cab = (linhas.shift() ?? []).map((c) => c.trim());
  return linhas.map((l) => Object.fromEntries(cab.map((c, i) => [c, (l[i] ?? '').trim()])));
}
export const coluna = (r: Record<string, string>, nomes: string[]) => {
  const k = Object.keys(r).find((c) => nomes.some((n) => n.toLowerCase() === c.toLowerCase()));
  return k ? r[k] : '';
};
