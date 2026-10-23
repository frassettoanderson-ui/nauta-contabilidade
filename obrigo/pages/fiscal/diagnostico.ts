// Diagnóstico fiscal impresso que vai para o cliente (Painel Fiscal do cliente) — reorganiza, sem
// alterar valores, o que foi lido do Relatório de Situação Fiscal. Gera HTML (mesmo conteúdo na tela
// e na janela de impressão). Folha de estilo inteira escopada em .pf-doc, nas cores do Obrigô.
import type { Relatorio } from './comum';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const brl = (n: unknown) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Cada receita do e-CAC cai num grupo: é o que permite dizer "de que é feita a dívida"
export function grupo(desc: string) {
  const t = String(desc || '').toUpperCase();
  if (/4406|5440|MAED/.test(t)) return 'MAED';
  if (/1082|1138|CP-SEGUR|CP-PATRONAL/.test(t)) return 'INSS';
  if (/SIMPLES/.test(t)) return 'DAS';
  if (/^MEI/.test(t.trim())) return 'MEI';
  return 'OUTROS';
}
const GRUPOS: Record<string, { label: string; cor: string }> = {
  INSS: { label: 'INSS / Previdência', cor: '#0E2240' },
  MAED: { label: 'Multas por atraso (MAED)', cor: '#E0A03A' },
  DAS: { label: 'Simples Nacional (DAS)', cor: '#F47920' },
  MEI: { label: 'MEI residual', cor: '#5B4A9E' },
  OUTROS: { label: 'Outros débitos', cor: '#8A99AB' },
};
const info = (g: string) => GRUPOS[g] || GRUPOS.OUTROS;
const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
function venceu(dd: string) { const p = String(dd || '').split('/'); return p.length === 3 && new Date(+p[2], +p[1] - 1, +p[0]) < hoje(); }
const mesChave = (dd: string) => { const p = String(dd || '').split('/'); return p[2] && p[1] ? `${p[2]}-${p[1]}` : ''; };
const mesRotulo = (k: string) => { const p = k.split('-'); return `${MESES[+p[1] - 1] || p[1]}/${String(p[0]).slice(2)}`; };
const mesVencido = (k: string) => { const p = k.split('-'); return new Date(+p[0], +p[1], 0) < hoje(); };
// "2024 - JAN FEV MAR" -> "Janeiro, Fevereiro e Março / 2024"
function periodoFmt(s: string) {
  const M: Record<string, string> = { JAN: 'Janeiro', FEV: 'Fevereiro', MAR: 'Março', ABR: 'Abril', MAI: 'Maio', JUN: 'Junho', JUL: 'Julho', AGO: 'Agosto', SET: 'Setembro', OUT: 'Outubro', NOV: 'Novembro', DEZ: 'Dezembro' };
  const m = String(s).match(/(\d{4})\s*[-–]\s*(.+)/);
  if (!m) return s;
  const ms = m[2].trim().split(/\s+/).map((x) => M[x.toUpperCase()] || x);
  return `${ms.length > 1 ? ms.slice(0, -1).join(', ') + ' e ' + ms.slice(-1) : ms[0]} / ${m[1]}`;
}
const GLOSSARIO: Record<string, [string, string]> = {
  DAS: ['DAS — Simples Nacional', 'Guia única mensal do Simples: reúne quase todos os tributos num só boleto. Pagar em atraso acumula multa e juros e conta para a exclusão do regime.'],
  MAED: ['MAED — multas por atraso', 'Multa por entregar declaração (PGDAS-D/DCTFWeb) fora do prazo. Mínimo de R$ 50 por competência.'],
  INSS: ['INSS — CP-Segurado / CP-Patronal', 'Contribuições previdenciárias em aberto. Precisam estar confessadas na DCTFWeb e pagas.'],
  MEI: ['MEI residual', 'Débito remanescente do período em que a empresa era MEI.'],
  CND: ['Certidão', 'Com débitos em aberto a certidão sai positiva. Pagando/parcelando, é possível obter a positiva com efeitos de negativa (vale como negativa).'],
};

// Números que resumem uma empresa na lista (mesmos critérios de risco do FiscalView)
export function resumoEmpresa(c: Relatorio) {
  const debs = c.exigibleDebts || [], susp = c.suspendedDebts || [], pgfn = c.pgfnItems || [];
  const omiss = (c.unknownPending || []).filter((x) => /omiss/i.test(x));
  const exigivel = debs.reduce((s, x) => s + Number(x.amount || 0), 0);
  const suspenso = susp.reduce((s, x) => s + Number(x.amount || 0), 0);
  const risco = exigivel || pgfn.length || omiss.length ? 'Crítico' : suspenso || /positiva com efeitos/i.test(c.certificateType || '') ? 'Atenção' : 'Regular';
  return { exigivel, suspenso, debitos: debs.length, pgfn: pgfn.length, omissoes: omiss.length, risco: risco as 'Crítico' | 'Atenção' | 'Regular' };
}

export const CSS_RELATORIO = [
  '.pf-doc{--az:#F47920;--az2:#E56A10;--az-bg:#FEF0E6;--navy:#0E2240;--navy2:#1B3A5B;--tinta:#273444;--soft:#5A6B7D;--faint:#8A99AB;--linha:#E2E8F0;--linha2:#CFDCEC;--fundo:#F4F7FB;--branco:#FFFFFF;--verde:#127A52;--verde-bg:#E6F6EF;--amar:#8A5E00;--amar-bg:#FFF5D7;--verm:#B3282D;--verm-bg:#FDE8E9;--roxo:#5B4A9E;--sombra:0 10px 30px rgba(16,42,67,.07)}',
  '.pf-doc, .pf-doc *{box-sizing:border-box}',
  ".pf-doc{margin:0;background:var(--fundo);color:var(--tinta);font-family:Poppins,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-size:0.875rem;line-height:1.55}",
  '.pf-doc .mono{font-variant-numeric:tabular-nums}',
  '.pf-doc .wrap{max-width:1040px;margin:0 auto;padding:0 24px 60px}',
  '.pf-doc header.m{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;padding:26px 0 22px;border:0}',
  '.pf-doc .mt{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}',
  '.pf-doc .bl{display:flex;align-items:center;gap:14px}',
  '.pf-doc .crest{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;font-weight:800;font-size:1.0625rem;color:#fff;background:rgba(255,255,255,.14)}',
  '.pf-doc .eye{font-size:0.6562rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.62);font-weight:700}',
  '.pf-doc h1{font-size:1.5625rem;margin:3px 0 0;letter-spacing:-.4px;color:#fff}',
  '.pf-doc .sid{font-size:0.7812rem;color:rgba(255,255,255,.72);margin-top:4px}',
  '.pf-doc .stamp{text-align:right;font-size:0.7188rem;color:rgba(255,255,255,.62);line-height:1.6}',
  '.pf-doc .stamp b{color:#fff}',
  '.pf-doc .facts{display:flex;flex-wrap:wrap;margin-top:20px;border-radius:14px;overflow:hidden;background:rgba(255,255,255,.08)}',
  '.pf-doc .fact{flex:1 1 170px;padding:12px 16px;border-right:1px solid rgba(255,255,255,.12)}',
  '.pf-doc .fact:last-child{border:0}',
  '.pf-doc .fk{font-size:0.625rem;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);font-weight:700}',
  '.pf-doc header .fk{color:rgba(255,255,255,.55)}',
  '.pf-doc .fv{font-size:0.8438rem;font-weight:600;margin-top:2px;color:#fff}',
  '.pf-doc .hero{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin:-22px 0 26px;position:relative}',
  '@media(max-width:780px){.pf-doc .hero{grid-template-columns:1fr}}',
  '.pf-doc .card{background:var(--branco);border:1px solid var(--linha);border-radius:16px;padding:22px 24px;box-shadow:var(--sombra)}',
  '.pf-doc .card .eye{color:var(--faint)}',
  '.pf-doc .big{font-size:2.625rem;font-weight:800;color:var(--verm);line-height:1;margin:8px 0 2px;letter-spacing:-1px;font-variant-numeric:tabular-nums}',
  '.pf-doc .subvals{display:flex;gap:22px;margin-top:14px;flex-wrap:wrap;border-top:1px solid var(--linha);padding-top:12px}',
  '.pf-doc .subvals div{font-size:0.6875rem;color:var(--faint);font-weight:600;text-transform:uppercase;letter-spacing:.5px}',
  '.pf-doc .subvals b{display:block;font-size:0.9375rem;color:var(--navy);margin-top:2px;letter-spacing:0;text-transform:none;font-variant-numeric:tabular-nums}',
  '.pf-doc .pf-grow{margin:14px 0}',
  '.pf-doc .pf-gtop{display:flex;align-items:baseline;gap:10px}',
  '.pf-doc .pf-gval{font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums}',
  '.pf-doc .pf-gname{flex:1;font-size:0.8125rem;font-weight:600}',
  '.pf-doc .pf-gpct{font-size:0.6875rem;color:var(--faint);font-weight:600}',
  '.pf-doc .pf-track{height:9px;background:#EDF2F8;border-radius:99px;overflow:hidden;margin-top:6px}',
  '.pf-doc .pf-track span{display:block;height:100%;border-radius:99px}',
  '.pf-doc .pf-sec{margin:30px 0}',
  '.pf-doc .pf-sh{display:flex;align-items:center;gap:12px;border-bottom:2px solid var(--linha);padding-bottom:10px;margin-bottom:16px}',
  '.pf-doc .pf-idx{font-weight:800;font-size:0.75rem;color:var(--az);background:var(--az-bg);border-radius:8px;padding:4px 9px;letter-spacing:.5px}',
  '.pf-doc .pf-sh h2{font-size:1.125rem;margin:0;color:var(--navy);letter-spacing:-.3px}',
  '.pf-doc .pf-aside{margin-left:auto;font-size:0.6875rem;color:var(--faint);font-weight:600;text-transform:uppercase;letter-spacing:.5px}',
  '.pf-doc table.pf-tab{width:100%;border-collapse:separate;border-spacing:0;background:var(--branco);border:1px solid var(--linha);border-radius:14px;overflow:hidden;box-shadow:var(--sombra)}',
  '.pf-doc .pf-tab th{background:#F2F6FB;color:var(--navy);text-align:left;padding:10px 11px;font-size:0.6875rem;font-weight:700;border-bottom:1px solid var(--linha);white-space:nowrap}',
  '.pf-doc .pf-tab td{border-bottom:1px solid var(--linha);padding:9px 11px;font-size:0.75rem}',
  '.pf-doc .pf-tab tbody tr:nth-child(even) td{background:#FAFCFE}',
  '.pf-doc .pf-tab tbody tr:last-child td{border-bottom:0}',
  '.pf-doc .pf-tab td.r,.pf-doc .pf-tab th.r{text-align:right;font-variant-numeric:tabular-nums}',
  '.pf-doc .pf-tab tfoot td{background:var(--az-bg);color:var(--navy);font-weight:700;border-top:1px solid var(--linha2)}',
  '.pf-doc .pf-venc{color:var(--verm);font-weight:700}',
  '.pf-doc .pf-omiss{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
  '@media(max-width:600px){.pf-doc .pf-omiss{grid-template-columns:1fr}}',
  '.pf-doc .pf-ocard{border:1px solid var(--linha);border-left:4px solid var(--amar);background:var(--branco);border-radius:14px;padding:16px 18px;box-shadow:var(--sombra)}',
  '.pf-doc .pf-otag{font-weight:700;color:var(--amar);font-size:0.6875rem;text-transform:uppercase;letter-spacing:.6px}',
  '.pf-doc .pf-operiodo{font-weight:700;color:var(--navy);font-size:0.875rem;margin-top:3px}',
  '.pf-doc .pf-odesc{font-size:0.7812rem;color:var(--soft);margin-top:6px}',
  '.pf-doc .pf-crit{border:1px solid var(--linha);border-left:4px solid var(--verm);background:var(--branco);border-radius:14px;padding:16px 20px;margin:0 0 26px;box-shadow:var(--sombra)}',
  '.pf-doc .pf-crit-h{font-weight:700;color:var(--verm)}',
  '.pf-doc .pf-crit-b{font-size:0.8125rem;color:var(--soft);margin-top:6px}',
  '.pf-doc .pf-nego{padding:22px}',
  '.pf-doc .pf-negogrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}',
  '@media(max-width:600px){.pf-doc .pf-negogrid{grid-template-columns:1fr}}',
  '.pf-doc .pf-ed{border:1px dashed var(--linha2);border-radius:10px;padding:9px 12px;margin-top:4px;font-weight:600;background:var(--fundo);color:var(--navy)}',
  '.pf-doc .pf-ed:focus{outline:2px solid var(--az);border-style:solid;background:var(--branco)}',
  '.pf-doc .pf-negonote{margin-top:14px;font-size:0.7188rem;color:var(--faint)}',
  '.pf-doc .pf-venc-grid{display:flex;gap:10px;flex-wrap:wrap}',
  '.pf-doc .pf-vc{border:1px solid var(--linha);border-radius:12px;padding:11px 14px;background:var(--branco);min-width:104px;box-shadow:var(--sombra)}',
  '.pf-doc .pf-vm{font-size:0.6562rem;color:var(--faint);font-weight:700;text-transform:uppercase;letter-spacing:.6px}',
  '.pf-doc .pf-vv{font-weight:700;margin-top:3px;color:var(--navy);font-variant-numeric:tabular-nums}',
  '.pf-doc .pf-vn{font-size:0.625rem;color:var(--faint);margin-top:2px}',
  '.pf-doc .pf-vcred{border-color:#F5C2C4;background:var(--verm-bg)}',
  '.pf-doc .pf-vcred .pf-vv{color:var(--verm)}',
  '.pf-doc .pf-gloss{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
  '@media(max-width:600px){.pf-doc .pf-gloss{grid-template-columns:1fr}}',
  '.pf-doc details.pf-g{border:1px solid var(--linha);background:var(--branco);border-radius:14px;padding:13px 17px}',
  '.pf-doc details.pf-g summary{cursor:pointer;font-size:0.8438rem;font-weight:600;color:var(--navy)}',
  '.pf-doc details.pf-g div{margin-top:9px;font-size:0.8125rem;color:var(--soft)}',
  '.pf-doc .pf-steps{display:grid;gap:12px}',
  '.pf-doc .pf-step{display:grid;grid-template-columns:46px 1fr auto;gap:14px;align-items:start;background:var(--branco);border:1px solid var(--linha);border-radius:14px;padding:16px 18px;box-shadow:var(--sombra)}',
  '.pf-doc .pf-n{font-size:1.25rem;font-weight:800;color:var(--az);background:var(--az-bg);border-radius:12px;width:38px;height:38px;display:grid;place-items:center}',
  '.pf-doc .pf-step h4{margin:0 0 3px;font-size:0.9375rem;color:var(--navy)}',
  '.pf-doc .pf-step p{margin:0;font-size:0.8125rem;color:var(--soft)}',
  '.pf-doc .pf-prio{font-size:0.625rem;font-weight:700;letter-spacing:.06em;padding:4px 10px;border-radius:99px;height:fit-content;text-transform:uppercase}',
  '.pf-doc .pf-prio.urg{background:var(--verm-bg);color:var(--verm)}',
  '.pf-doc .pf-prio.med{background:var(--amar-bg);color:var(--amar)}',
  '.pf-doc .pf-prio.low{background:var(--verde-bg);color:var(--verde)}',
  '.pf-doc .pf-note{border:1px solid var(--linha);border-radius:14px;padding:14px 18px;margin:18px 0;font-size:0.8125rem;background:var(--branco)}',
  '.pf-doc .pf-ok{background:var(--verde-bg);color:var(--verde);border-color:#BFE6D5}',
  '.pf-doc footer{border-top:2px solid var(--linha);margin-top:36px;padding:22px 0}',
  '.pf-doc .disc{background:var(--branco);border:1px solid var(--linha);border-left:4px solid var(--az);border-radius:14px;padding:15px 19px;font-size:0.7812rem;color:var(--soft)}',
  '.pf-doc .btn{font:inherit;font-weight:600;border:0;background:var(--az);color:#fff;padding:11px 18px;border-radius:7px;cursor:pointer;margin-top:14px}',
  '.pf-doc .btn:hover{background:var(--az2)}',
  '@media print{.pf-doc .btn{display:none}',
  '.pf-doc{background:#fff}',
  '.pf-doc header.m{background:var(--navy) !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  '.pf-doc .card,.pf-doc .pf-step,.pf-doc details.pf-g,.pf-doc .pf-ocard,.pf-doc table.pf-tab{box-shadow:none;break-inside:avoid}}',
].join('\n');

// Só o CORPO do diagnóstico (sem <html>/<style>): o mesmo HTML vai na tela e na janela de impressão
export function corpoRelatorio(c: Relatorio) {
  const debs = c.exigibleDebts || [];
  const soma = (k: 'amount' | 'original' | 'penalty' | 'interest') => debs.reduce((s, x) => s + Number(x[k] || 0), 0);
  const consolidado = soma('amount'), orig = soma('original'), multa = soma('penalty'), juros = soma('interest');
  const mapaG: Record<string, number> = {};
  debs.forEach((x) => { const g = grupo(x.description); mapaG[g] = (mapaG[g] || 0) + Number(x.amount || 0); });
  const grupos = Object.entries(mapaG).sort((a, b) => b[1] - a[1]);
  const mapaM: Record<string, { s: number; n: number }> = {};
  debs.forEach((x) => { const k = mesChave(x.dueDate); if (!k) return; mapaM[k] = mapaM[k] || { s: 0, n: 0 }; mapaM[k].s += Number(x.amount || 0); mapaM[k].n++; });
  const meses = Object.entries(mapaM).sort((a, b) => a[0].localeCompare(b[0]));
  const omiss = (c.unknownPending || []).filter((s) => /omiss/i.test(s));
  const certVenc = (() => { const p = String(c.certificateValidity || '').split('/'); return !!c.certificateValidity && new Date(+p[2], +p[1] - 1, +p[0]) < hoje(); })();
  const pgfn = c.pgfnItems || [];
  const iniciais = (c.companyName || '?').replace(/^[\d./-]+\s*/, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'AT';
  const regime = [
    /EMPRESARIO/i.test(c.legalNature || '') ? 'Empresário Individual' : (c.legalNature || '').replace(/^\d+-\d+\s*-\s*/, ''),
    /MICRO/i.test(c.companySize || '') ? 'ME' : c.companySize || '',
    c.simples && !/não|encerrado/i.test(c.simples) ? 'Simples Nacional' : '',
  ].filter(Boolean).join(' · ');

  const barras = grupos.map(([g, v]) => {
    const pct = consolidado ? (100 * v) / consolidado : 0, i = info(g);
    return `<div class="pf-grow"><div class="pf-gtop"><span class="pf-gval mono">${brl(v)}</span><span class="pf-gname">${esc(i.label)}</span><span class="pf-gpct">${pct.toFixed(1)}% do total</span></div><div class="pf-track"><span style="width:${pct.toFixed(1)}%;background:${i.cor}"></span></div></div>`;
  }).join('');
  const linhas = debs.slice().sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0)).map((x) =>
    `<tr><td>${esc(info(grupo(x.description)).label)}</td><td>${esc(x.description)}</td><td>${esc(x.reference || '')}</td><td class="r ${venceu(x.dueDate) ? 'pf-venc' : ''}">${esc(x.dueDate || '')}</td><td class="r mono">${brl(x.original)}</td><td class="r mono">${brl(x.penalty)}</td><td class="r mono">${brl(x.interest)}</td><td class="r mono"><b>${brl(x.amount)}</b></td></tr>`).join('');
  const selosVenc = meses.map(([k, m]) => { const v = mesVencido(k); return `<div class="pf-vc${v ? ' pf-vcred' : ''}"><div class="pf-vm">${esc(mesRotulo(k))}</div><div class="pf-vv mono">${brl(m.s)}</div><div class="pf-vn">${m.n} déb.${v ? ' · vencido' : ''}</div></div>`; }).join('');
  const noSimples = c.simples && !/não|encerrado/i.test(c.simples);
  const prazoHtml = noSimples && consolidado > 0
    ? `<div class="pf-crit"><div class="pf-crit-h">⚠ Prazo crítico — risco de exclusão do Simples Nacional</div><div class="pf-crit-b">A Receita processa a exclusão de quem não regularizar os débitos no prazo legal. Regularizar o consolidado de <b>${brl(consolidado)}</b> antes da janela anual de exclusão preserva o regime — depois, a reopção só pode ser pedida em setembro.</div></div>` : '';
  const omissHtml = omiss.length
    ? `<section class="pf-sec"><div class="pf-sh"><span class="pf-idx">02</span><h2>Declarações não entregues</h2><span class="pf-aside">geram novas multas enquanto não forem transmitidas</span></div><div class="pf-omiss">${omiss.map((o) => { const p = String(o).split(' — Período: '); const per = p[1] ? periodoFmt(p[1]) : ''; return `<div class="pf-ocard"><div class="pf-otag">⚠ ${esc(p[0])}</div>${per ? `<div class="pf-operiodo">${esc(per)}</div>` : ''}<div class="pf-odesc">Declaração pendente de transmissão. Cada mês em atraso pode gerar multa e travar a apuração/confissão do débito.</div></div>`; }).join('')}</div></section>` : '';
  const pgfnHtml = pgfn.length
    ? `<section class="pf-sec"><div class="pf-sh"><span class="pf-idx">P</span><h2>Inscrições na Dívida Ativa (PGFN)</h2></div><table class="pf-tab"><thead><tr><th>Inscrição</th><th>Processo</th><th>Origem</th><th>Situação</th></tr></thead><tbody>${pgfn.map((p) => `<tr><td class="mono">${esc(p.number || '')}</td><td class="mono">${esc(p.process || '')}</td><td>${esc(p.source || '')}</td><td>${esc(p.status || '')}</td></tr>`).join('')}</tbody></table></section>`
    : c.pgfnClear ? '<div class="pf-note pf-ok">✓ Sem pendências na PGFN (Dívida Ativa da União).</div>' : '';
  const negocHtml = consolidado > 0 || pgfn.length
    ? `<section class="pf-sec"><div class="pf-sh"><span class="pf-idx">R</span><h2>Opção de negociação (Regularize)</h2><span class="pf-aside">preencha com a simulação — não vem no relatório do e-CAC</span></div><div class="card pf-nego"><div class="pf-negogrid"><div><div class="fk">Total sem desconto</div><div class="pf-ed" contenteditable="true">${brl(consolidado)}</div></div><div><div class="fk">Desconto</div><div class="pf-ed" contenteditable="true">R$ 0,00</div></div><div><div class="fk">Total a pagar</div><div class="pf-ed" contenteditable="true">${brl(consolidado)}</div></div></div><div class="pf-negogrid" style="margin-top:12px"><div><div class="fk">Pagar à vista</div><div class="pf-ed" contenteditable="true">${brl(consolidado)}</div></div><div><div class="fk">Nº de parcelas</div><div class="pf-ed" contenteditable="true">—</div></div><div><div class="fk">Valor da parcela</div><div class="pf-ed" contenteditable="true">R$ —</div></div></div><div style="margin-top:12px"><div class="fk">Observações da negociação</div><div class="pf-ed" contenteditable="true" style="min-height:40px">Valor mínimo da modalidade, condições e prazo — cole aqui a simulação do Regularize (PGFN).</div></div><div class="pf-negonote">✎ Os campos acima são editáveis: abra o Regularize, simule e preencha antes de imprimir/salvar.</div></div></section>` : '';
  const chavesGloss = [...new Set(grupos.map(([g]) => g).filter((g) => GLOSSARIO[g])), 'CND'];
  const glossHtml = `<section class="pf-sec"><div class="pf-sh"><span class="pf-idx">05</span><h2>Explicando para o cliente</h2><span class="pf-aside">em linguagem simples</span></div><div class="pf-gloss">${chavesGloss.map((k) => `<details class="pf-g"><summary><b>${esc(GLOSSARIO[k][0])}</b></summary><div>${esc(GLOSSARIO[k][1])}</div></details>`).join('')}</div></section>`;
  const plano: [string, string, string][] = [];
  if (omiss.length) plano.push(['URGENTE', 'Transmitir as declarações omissas', `Regularize ${omiss.map((o) => o.replace(/^.*Omissão de /i, '')).join(', ')} para parar novas multas e destravar a apuração.`]);
  if (consolidado > 0) plano.push(['URGENTE', 'Decidir: pagar à vista ou parcelar', `Regularizar o consolidado de ${brl(consolidado)} (pagamento ou parcelamento) para preservar o regime e a certidão.`]);
  if (mapaG.DAS) plano.push(['ALTA', 'Emitir e quitar os DAS em atraso', 'São os débitos que mais pesam na régua de exclusão do Simples.']);
  if (mapaG.INSS) plano.push(['ALTA', 'Regularizar as guias previdenciárias (INSS)', 'CP-Segurado e CP-Patronal em aberto; confirmar a escrituração na DCTFWeb.']);
  if (pgfn.length) plano.push(['ALTA', 'Tratar a(s) inscrição(ões) na PGFN', 'Negociar no Regularize antes do ajuizamento (custas/honorários).']);
  plano.push(['DEPOIS', 'Reemitir a certidão', 'Após zerar/parcelar e entregar tudo, emitir nova certidão para deixar a empresa apta a crédito e licitações.']);
  const planoHtml = `<section class="pf-sec"><div class="pf-sh"><span class="pf-idx">06</span><h2>Plano de regularização sugerido</h2><span class="pf-aside">ordenado por urgência</span></div><div class="pf-steps">${plano.map((p, i) => `<div class="pf-step"><span class="pf-n">${String(i + 1).padStart(2, '0')}</span><div><h4>${esc(p[1])}</h4><p>${esc(p[2])}</p></div><span class="pf-prio ${p[0] === 'URGENTE' ? 'urg' : p[0] === 'ALTA' ? 'med' : 'low'}">${p[0]}</span></div>`).join('')}</div></section>`;

  return `<header class="m"><div class="wrap" style="padding-bottom:0"><div class="mt"><div class="bl"><div class="crest">${esc(iniciais)}</div><div><div class="eye">Diagnóstico Fiscal · Receita Federal &amp; PGFN</div><h1>${esc(c.companyName)}</h1><div class="sid mono">CNPJ ${esc(c.cnpj)}${regime ? ' · ' + esc(regime) : ''}</div></div></div><div class="stamp">Relatório de Situação Fiscal<br>emitido em <b>${esc(c.reportDateTime || '')}</b><br>${esc(c.municipality || '')}${c.uf ? '/' + esc(c.uf) : ''}</div></div>`
    + `<div class="facts"><div class="fact"><div class="fk">Situação cadastral</div><div class="fv">${esc(c.cadastralStatus || '—')}</div></div><div class="fact"><div class="fk">Atividade (CNAE)</div><div class="fv">${esc((c.cnae || '—').replace(/^\d[\d./-]*\s*-\s*/, ''))}</div></div><div class="fact"><div class="fk">Abertura</div><div class="fv mono">${esc(c.openingDate || '—')}</div></div><div class="fact"><div class="fk">Certidão</div><div class="fv" style="color:${certVenc ? '#FF8A8A' : '#7DE0B4'}">${esc(c.certificateType || '—')}${c.certificateValidity ? (certVenc ? ` (vencida ${esc(c.certificateValidity)})` : ` (val. ${esc(c.certificateValidity)})`) : ''}</div></div></div></div></header>`
    + `<div class="wrap"><div class="hero"><div class="card"><div class="eye">Débito consolidado total (SIEF)</div><div class="big">${brl(consolidado)}</div><div style="font-size:0.7812rem;color:var(--soft)">Somatório de ${debs.length} débito(s) em aberto, já com multa e juros até a data do relatório.</div><div class="subvals"><div>Valor original<b class="mono">${brl(orig)}</b></div><div>Multa<b class="mono">${brl(multa)}</b></div><div>Juros<b class="mono">${brl(juros)}</b></div></div></div><div class="card"><div class="eye">Do que é feita a dívida</div>${barras || '<p style="color:var(--faint)">Sem débitos exigíveis.</p>'}</div></div>`
    + prazoHtml + omissHtml
    + (debs.length ? `<section class="pf-sec"><div class="pf-sh"><span class="pf-idx">03</span><h2>Todos os débitos, item a item</h2><span class="pf-aside">${debs.length} lançamento(s)</span></div><table class="pf-tab"><thead><tr><th>Grupo</th><th>Receita</th><th>Competência</th><th>Vencimento</th><th class="r">Valor original</th><th class="r">Multa</th><th class="r">Juros</th><th class="r">Saldo consolidado</th></tr></thead><tbody>${linhas}</tbody><tfoot><tr><td colspan="4"><b>Total</b></td><td class="r mono"><b>${brl(orig)}</b></td><td class="r mono"><b>${brl(multa)}</b></td><td class="r mono"><b>${brl(juros)}</b></td><td class="r mono"><b>${brl(consolidado)}</b></td></tr></tfoot></table></section>` : '')
    + (meses.length ? `<section class="pf-sec"><div class="pf-sh"><span class="pf-idx">04</span><h2>Vencimentos por mês</h2><span class="pf-aside">em vermelho: já vencidos</span></div><div class="pf-venc-grid">${selosVenc}</div></section>` : '')
    + pgfnHtml + negocHtml + glossHtml + planoHtml
    + '<footer><div class="disc"><b>Nota técnica.</b> Este painel reorganiza, sem alterar valores, os dados do “Relatório de Situação Fiscal” (Receita Federal/PGFN) importado na Situação Fiscal (e-CAC). Os totais são recalculados a partir dos lançamentos originais. Material de apoio — a decisão sobre pagamento, parcelamento e prazos deve ser validada pelo contador responsável nos sistemas oficiais.</div><button class="btn" id="pfImprimir" type="button">Imprimir / salvar em PDF</button></footer></div>';
}

// Documento completo para a janela de impressão. Leva o HTML JÁ editado na tela (campos da negociação).
export function imprimir(titulo: string, corpoHtml: string) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Painel Fiscal · ${esc(titulo)}</title><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>${CSS_RELATORIO}</style></head><body style="margin:0"><div class="pf-doc">${corpoHtml}</div></body></html>`);
  w.document.close();
  try { w.document.getElementById('pfImprimir')?.addEventListener('click', () => w.print()); } catch { /* ok */ }
  return true;
}
