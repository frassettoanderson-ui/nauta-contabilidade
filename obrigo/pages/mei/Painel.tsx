// MEI › Painel — cadastro dos MEIs e controle 360°: honorario, comissao, DAS, faturamento, limite.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Upload, ChevronLeft, ChevronRight, Bell, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth, temPermissao } from '../../lib/auth';
import { Modal, useToast } from '../../components/ui';
import { Anel } from '../societario/Kanban';
import { Selo } from '../societario/Gestao';
import { Botao, Campo, INP, erroMsg } from '../societario/modais';
import { mascaraCnpj, mascaraMoeda, moedaParaNumero, numeroParaMoeda } from '../societario/comum';
import { COR } from '../alvaras/comum';
import {
  ATIVIDADES, SITUACOES_MEI, meiApi, nomeMei, apelidoSeDiferente, ativo, passaRecorte, atividadeDe, rotuloAtividade, linha, fechamento,
  receitaAno, limiteAno, situacaoDas, indiceGuias, honorarioDevido, compAtual, somaComp, rotuloComp, dataBR, brl, hojeISO, MESES,
  baixarCsv, moedaCsv, lerCsv, coluna, type Dados, type Mei,
} from './motor';

export function useMei() {
  const [d, setD] = useState<Dados | null>(null);
  const recarregar = useCallback(() => meiApi.dados().then(setD).catch(() => undefined), []);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { d, recarregar };
}
export const corSit = (s: string) => (s === 'Ativo' ? COR.ok : s === 'Desenquadrado' ? COR.erro : s === 'Inativo' ? COR.aviso : COR.neutro);
export function SeletorMei({ meis, recorte, valor, onMudar }: { meis: Mei[]; recorte: string; valor: string; onMudar: (id: string) => void }) {
  const lista = meis.filter((m) => passaRecorte(m, recorte)).sort((a, b) => nomeMei(a).localeCompare(nomeMei(b)));
  return (
    <select className={`${INP} w-72`} value={valor} onChange={(e) => onMudar(e.target.value)}>
      {lista.length === 0 && <option value="">— nenhum MEI —</option>}
      {lista.map((m) => <option key={m.id} value={m.id}>{nomeMei(m)}</option>)}
    </select>
  );
}
export const OpcoesRecorte = () => <><option value="ativos">Ativos</option><option value="inativos">Inativos (baixado, desenquadrado…)</option><option value="">Todos</option></>;

export default function PainelMei() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'mei_operar');
  const toast = useToast();
  const navigate = useNavigate();
  const { d, recarregar } = useMei();
  const [comp, setComp] = useState(compAtual());
  const anoCorr = Number(hojeISO().slice(0, 4));
  const [anoQuadro, setAnoQuadro] = useState(anoCorr);
  const [filt, setFilt] = useState({ q: '', sit: 'ativos', ativ: '', hon: '' });
  const [ficha, setFicha] = useState<Mei | null | 'novo'>(null);
  const [inativar, setInativar] = useState<Mei | null>(null);
  const [tetoAberto, setTetoAberto] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const uid = sessao?.usuario?.id ?? 'geral';

  const meis = d?.meis ?? [];
  const cfg = d?.config ?? { salarioMinimo: {}, limiteAnual: 81000 };
  const guias = useMemo(() => indiceGuias(d?.das ?? []), [d]);
  const compAnt = somaComp(compAtual(), -1);

  // alerta de honorario em atraso (competencia anterior)
  const atrasados = useMemo(() => meis.filter((m) => ativo(m) && Number(m.honorario) > 0 && honorarioDevido(m, compAnt) && !m.honPago?.[compAnt]).map((m) => {
    let meses = 0; let c = compAnt;
    while (meses < 12 && honorarioDevido(m, c) && !m.honPago?.[c]) { meses++; c = somaComp(c, -1); }
    return { m, meses, total: Number(m.honorario) * meses };
  }).sort((a, b) => b.meses - a.meses), [meis, compAnt]);
  // alerta de teto (>= 80%)
  const perto = useMemo(() => (d ? meis.filter((m) => ativo(m)).map((m) => {
    const lim = limiteAno(m, anoCorr, cfg); return { m, pct: lim ? receitaAno(d, m.id, anoCorr) / lim : 0 };
  }).filter((x) => x.pct >= 0.8) : []), [d, meis, cfg, anoCorr]);
  const vistosKey = `obrigo.meiTetoVistos_${uid}`;
  const vistos = (() => { try { return new Set((localStorage.getItem(vistosKey) ?? '').split(',').filter(Boolean)); } catch { return new Set<string>(); } })();
  const naoVistos = perto.filter((x) => !vistos.has(x.m.id)).length;
  useEffect(() => { if (naoVistos > 0) setTetoAberto(true); }, [naoVistos]);
  function marcarVistos() { try { localStorage.setItem(vistosKey, perto.map((x) => x.m.id).join(',')); } catch { /* sem storage */ } }

  const f = fechamento(meis, comp, cfg);
  const pct = f.previsto ? Math.round((f.recebido / f.previsto) * 100) : 100;
  const linhas = meis
    .filter((m) => passaRecorte(m, filt.sit))
    .filter((m) => !filt.ativ || atividadeDe(m) === filt.ativ)
    .filter((m) => !filt.q || [nomeMei(m), m.apelido, m.cnpj, m.ocupacao, m.codigo].some((t) => (t ?? '').toLowerCase().includes(filt.q.toLowerCase())))
    .map((m) => ({ m, l: linha(m, comp, cfg) }))
    .filter((x) => !filt.hon || (filt.hon === 'pago' ? x.l.pago : !x.l.pago))
    .sort((a, b) => nomeMei(a.m).localeCompare(nomeMei(b.m)));
  const devidas = linhas.filter((x) => x.l.devido);
  const ocultas = linhas.length - devidas.length;
  const tot = devidas.reduce((s, x) => ({ fat: s.fat + (d ? receitaAno(d, x.m.id, anoCorr) : 0), hon: s.hon + x.l.honorario, das: s.das + x.l.das, liq: s.liq + x.l.liquido, com: s.com + x.l.comissaoRealizada }), { fat: 0, hon: 0, das: 0, liq: 0, com: 0 });

  async function marcarPago(m: Mei, c: string, v: boolean) {
    if (!podeOperar) return toast('erro', 'Seu nível de acesso é somente de consulta.');
    try { await meiApi.honorario(m.id, c, v); toast('ok', v ? 'Honorário recebido.' : 'Honorário desmarcado.'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function comissao(m: Mei, v: string) {
    try { await meiApi.comissao(m.id, comp, Number(v) || 0); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function reativar(m: Mei) {
    if (!confirm(`Reativar ${nomeMei(m)}?`)) return;
    try { await meiApi.reativar(m.id); toast('ok', 'MEI reativado.'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  function exportar() {
    const ano = Number(comp.slice(0, 4));
    baixarCsv(`MEIs_ATUAN_${comp}.csv`, [
      ['Código', 'Cliente', 'CNPJ', 'Abertura', 'Ocupação', 'Atividade', 'Situação', 'Empregado', 'Faturamento do ano', 'Honorário', 'Competência', 'Honorário pago', 'DAS', 'Comissão %', 'Comissão R$', 'Observações'],
      ...[...meis].sort((a, b) => nomeMei(a).localeCompare(nomeMei(b))).map((m) => {
        const l = linha(m, comp, cfg);
        return [m.codigo ?? '', nomeMei(m), m.cnpj ?? '', m.abertura?.slice(0, 10) ?? '', m.ocupacao ?? '', rotuloAtividade(atividadeDe(m)), m.situacao, m.temEmpregado ? 'Sim' : 'Não',
          moedaCsv(d ? receitaAno(d, m.id, anoCorr) : 0), moedaCsv(l.honorario), rotuloComp(comp), l.pago ? 'Sim' : 'Não', moedaCsv(l.das), String(l.pct).replace('.', ','), moedaCsv(l.comissaoRealizada), m.observacao ?? ''];
      }),
    ]);
    void ano;
  }
  async function importar(arq: File) {
    try {
      const rows = lerCsv(await arq.text()).map((r) => ({
        nome: coluna(r, ['Cliente', 'Nome', 'MEI', 'Razão Social', 'Razao Social']), cnpj: coluna(r, ['CNPJ']), codigo: coluna(r, ['Código', 'Codigo']),
        abertura: coluna(r, ['Abertura', 'Data de abertura']), ocupacao: coluna(r, ['Ocupação', 'Ocupacao', 'CNAE']), atividade: coluna(r, ['Atividade', 'Tipo']),
        empregado: coluna(r, ['Empregado']), honorario: coluna(r, ['Honorário', 'Honorario']), comissao: coluna(r, ['Comissão %', 'Comissao %', 'Comissão', 'Comissao']),
        observacao: coluna(r, ['Observações', 'Observacoes', 'Obs']),
      }));
      const r = await meiApi.importar(rows);
      toast('ok', `Importação: ${r.novos} novo(s), ${r.atualizados} atualizado(s)${r.ignoradas ? `, ${r.ignoradas} ignorada(s)` : ''}.`); recarregar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }

  if (!d) return <div className="py-16 text-center text-slate-400">Carregando…</div>;
  const ativos = meis.filter(ativo);
  const anosQuadro = [...new Set([anoCorr + 1, anoCorr, anoCorr - 1, anoCorr - 2, anoCorr - 3, ...meis.filter((m) => m.abertura).map((m) => Number(m.abertura!.slice(0, 4)))])].sort((a, b) => b - a);
  const recebPorMes = MESES.map((_, i) => { const c = `${anoQuadro}-${String(i + 1).padStart(2, '0')}`; return meis.filter((m) => honorarioDevido(m, c) && m.honPago?.[c]).reduce((s, m) => s + linha(m, c, cfg).honorario, 0); });
  const maxReceb = Math.max(...recebPorMes);
  const saude = ativos.map((m) => {
    const lim = limiteAno(m, anoQuadro, cfg); const rec = receitaAno(d, m.id, anoQuadro);
    const vencido = MESES.some((_, i) => situacaoDas(m, `${anoQuadro}-${String(i + 1).padStart(2, '0')}`, guias) === 'vencido');
    return { m, pct: lim ? rec / lim : 0, rec, vencido };
  });
  const emDia = ativos.length ? Math.round((saude.filter((s) => !s.vencido).length / ativos.length) * 100) : 100;

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      {atrasados.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-[12px]">
          <b style={{ color: COR.erro }}>💰 Honorário em atraso:</b> {atrasados.length} cliente(s) não pagaram o honorário de {rotuloComp(compAnt)} — {brl(atrasados.reduce((s, x) => s + x.total, 0))} a receber
          {atrasados.filter((x) => x.meses > 1).length > 0 && ` · ${atrasados.filter((x) => x.meses > 1).length} com mais de um mês em aberto`}
          <div className="mt-1 flex flex-wrap gap-1">
            {atrasados.map((x) => (
              <span key={x.m.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: (x.meses > 1 ? COR.erro : COR.aviso) + '22' }}>
                <button onClick={() => setFicha(x.m)} className="hover:underline">{nomeMei(x.m)} · {brl(x.total)} · {x.meses} {x.meses > 1 ? 'meses' : 'mês'}</button>
                {podeOperar && <button title="Marcar como pago" onClick={() => marcarPago(x.m, compAnt, true)} style={{ color: COR.ok }}>✓</button>}
              </span>
            ))}
          </div>
        </div>
      )}
      {perto.length > 0 && (
        <div className="flex items-start gap-2">
          <button onClick={() => { setTetoAberto((v) => !v); marcarVistos(); }} className="relative rounded border border-amber-200 bg-amber-50 p-1.5" title="Avisos de teto">
            <Bell size={15} style={{ color: COR.aviso }} />
            {naoVistos > 0 && <span className="absolute -right-1 -top-1 rounded-full px-1 text-[10px] text-white" style={{ background: COR.erro }}>{naoVistos}</span>}
          </button>
          {tetoAberto && (
            <div className="flex-1 rounded border border-amber-200 bg-amber-50 p-2 text-[12px]">
              <div className="flex justify-between"><b style={{ color: COR.aviso }}>⚠ Atenção ao teto do MEI</b>
                <button onClick={() => { setTetoAberto(false); marcarVistos(); toast('ok', 'Avisos ocultados. Uma empresa nova acima de 80% reabre o aviso — ou use o sino.'); }}><X size={13} /></button></div>
              <div className="mt-1 flex flex-wrap gap-1">{perto.map((x) => <button key={x.m.id} onClick={() => setFicha(x.m)} className="rounded-full px-2 py-0.5" style={{ background: (x.pct >= 1 ? COR.erro : COR.aviso) + '22' }}>{nomeMei(x.m)} · {Math.round(x.pct * 100)}%</button>)}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div><div className="text-[11px] uppercase tracking-wide text-slate-300">MEI · {rotuloComp(comp)}</div><div className="text-lg font-semibold">Painel do MEI</div>
            <div className="text-[12px] text-slate-300">{brl(f.recebido)} de {brl(f.previsto)} previstos</div></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ t: 'MEIs na carteira', v: String(ativos.length), d: `de ${meis.length} cadastrados`, c: COR.info },
            { t: 'Em aberto', v: brl(f.aberto), d: `${f.emAberto.length} honorário(s) a receber`, c: f.aberto ? COR.erro : COR.ok },
            { t: 'Comissões do mês', v: brl(f.comissoes), d: 'só dos honorários recebidos', c: COR.ok }].map((k) => (
            <div key={k.t} className="rounded bg-white/10 p-2 text-center"><div className="text-[11px] text-slate-300">{k.t}</div><div className="text-lg font-semibold" style={{ color: k.c }}>{k.v}</div><div className="text-[11px] text-slate-300">{k.d}</div></div>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button className="rounded border border-slate-300 p-1" onClick={() => setComp(somaComp(comp, -1))}><ChevronLeft size={14} /></button>
            <input type="month" className={`${INP} w-40`} value={comp} onChange={(e) => e.target.value && setComp(e.target.value)} />
            <button className="rounded border border-slate-300 p-1" onClick={() => setComp(somaComp(comp, 1))}><ChevronRight size={14} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Botao tipo="neutro" onClick={exportar}><Download size={13} /> Exportar CSV</Botao>
            {podeOperar && <><input ref={arquivo} type="file" accept=".csv" className="hidden" onChange={(e) => { const a = e.target.files?.[0]; e.target.value = ''; if (a) importar(a); }} />
              <Botao tipo="info" onClick={() => arquivo.current?.click()}><Upload size={13} /> Importar CSV</Botao>
              <Botao tipo="novo" onClick={() => setFicha('novo')}><Plus size={13} /> Novo MEI</Botao></>}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <input className={`${INP} w-64`} placeholder="Nome, CNPJ, código ou ocupação" value={filt.q} onChange={(e) => setFilt({ ...filt, q: e.target.value })} />
          <select className={`${INP} w-56`} value={filt.sit} onChange={(e) => setFilt({ ...filt, sit: e.target.value })}><OpcoesRecorte />
            <optgroup label="Situação exata">{SITUACOES_MEI.map((s) => <option key={s} value={`s:${s}`}>{s}</option>)}</optgroup></select>
          <select className={`${INP} w-44`} value={filt.ativ} onChange={(e) => setFilt({ ...filt, ativ: e.target.value })}><option value="">Todas as atividades</option>{ATIVIDADES.map((a) => <option key={a.v} value={a.v}>{a.t}</option>)}</select>
          <select className={`${INP} w-40`} value={filt.hon} onChange={(e) => setFilt({ ...filt, hon: e.target.value })}><option value="">Honorário: todos</option><option value="pago">Pago</option><option value="aberto">Em aberto</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-[13px]">
            <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500">
              <th className="py-1">Código</th><th>✓ Pago</th><th>MEI</th><th>CNPJ</th><th>Atividade</th><th className="text-right">Faturamento {anoCorr}</th><th className="text-right">Honorário</th><th className="text-right">DAS/mês</th><th className="text-right">Líquido</th><th className="text-right">Comissão</th>
            </tr></thead>
            <tbody>
              {devidas.map(({ m, l }) => {
                const lim = limiteAno(m, anoQuadro, cfg); const p = lim ? receitaAno(d, m.id, anoQuadro) / lim : -1;
                const marca = p < 0 ? undefined : p <= 0.6 ? COR.ok : p <= 0.8 ? COR.aviso : COR.erro;
                return (
                  <tr key={m.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={(e) => { if (!(e.target as HTMLElement).closest('input,button,select,label')) setFicha(m); }}>
                    <td className="py-1.5 text-slate-500">{m.codigo || '—'}</td>
                    <td><input type="checkbox" className="accent-marca-600" checked={l.pago} title={l.pago ? 'Pago' : ''} disabled={!podeOperar} onChange={(e) => marcarPago(m, comp, e.target.checked)} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="rounded px-1" style={marca ? { background: marca + '33' } : undefined} title={lim ? `Faturou ${brl(receitaAno(d, m.id, anoQuadro))} de ${brl(lim)} (${Math.round(p * 100)}% do teto em ${anoQuadro})` : ''}>{nomeMei(m)}</span>
                        {podeOperar && (ativo(m) ? <button title="Inativar" onClick={() => setInativar(m)} className="text-slate-400">⏸</button> : <button title="Reativar" onClick={() => reativar(m)} className="text-slate-400">▶</button>)}
                      </div>
                      {apelidoSeDiferente(m) && <div className="text-[11px] text-slate-400">{m.apelido}</div>}
                      {!ativo(m) && <div className="text-[11px] text-slate-400">{m.situacao} · desde {dataBR(m.inativoEm)}{m.inativoMotivo ? ` · ${m.inativoMotivo}` : ''}</div>}
                      {!ativo(m) && m.simeiBaixa === 'nao' && <Selo cor={COR.erro}>baixa no SIMEI pendente</Selo>}
                      {m.temEmpregado && <Selo cor={COR.aviso}>1 empregado</Selo>}
                    </td>
                    <td className="text-slate-600">{m.cnpj}</td>
                    <td>{atividadeDe(m) ? rotuloAtividade(atividadeDe(m)) : <Selo cor={COR.aviso}>definir</Selo>}</td>
                    <td className="text-right">{brl(receitaAno(d, m.id, anoCorr))}</td>
                    <td className="text-right">{l.honorario ? brl(l.honorario) : '—'}</td>
                    <td className="text-right" title={`INSS ${brl(l.partes.inss)} + ICMS/ISS ${brl(l.partes.icms + l.partes.iss)}`} style={l.atividadeIndefinida ? { color: COR.aviso } : undefined}>{brl(l.das)}</td>
                    <td className="text-right" style={l.liquido < 0 ? { color: COR.erro } : undefined}>{brl(l.liquido)}</td>
                    <td className="text-right">
                      <input type="number" step={0.5} min={0} className="w-14 rounded border border-slate-300 px-1 text-right" defaultValue={l.pct} key={`${m.id}${comp}${l.pct}`} disabled={!podeOperar} onBlur={(e) => Number(e.target.value) !== l.pct && comissao(m, e.target.value)} />%
                      <div className="text-[11px]" style={{ color: l.pago ? COR.ok : '#94a3b8' }}>{brl(l.comissao)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {devidas.length > 0 && <tfoot><tr className="font-semibold"><td colSpan={5} className="py-1.5">TOTAL — {devidas.length} MEIs</td><td className="text-right">{brl(tot.fat)}</td><td className="text-right">{brl(tot.hon)}</td><td className="text-right">{brl(tot.das)}</td><td className="text-right">{brl(tot.liq)}</td><td className="text-right">{brl(tot.com)}</td></tr></tfoot>}
          </table>
        </div>
        {devidas.length === 0 && <div className="py-6 text-center text-slate-400">{meis.length ? 'Nenhum MEI nesta competência com os filtros atuais.' : 'Nenhum MEI cadastrado. Use + Novo MEI.'}</div>}
        {ocultas > 0 && <div className="mt-1 text-center text-[12px] text-slate-500">🔒 {ocultas} MEI(s) oculto(s) nesta competência (aberto depois de {rotuloComp(comp)}).</div>}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card p-3">
          <div className="mb-2 font-semibold text-slate-700">💰 Financeiro do escritório · {rotuloComp(comp)}</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['Previsto', brl(f.previsto), '#334155'], ['Recebido', brl(f.recebido), COR.ok], ['Em aberto', brl(f.aberto), f.aberto ? COR.erro : '#334155'], ['Comissões', brl(f.comissoes), '#334155']].map(([t, v, c]) => (
              <div key={t} className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">{t}</div><div className="font-semibold" style={{ color: c }}>{v}</div></div>))}
          </div>
          <div className="mt-2 text-[12px] text-slate-600">
            {f.emAberto.length === 0 ? `Todos os honorários de ${rotuloComp(comp)} foram recebidos. ✓` : <>Honorários em aberto ({f.emAberto.length}):
              {f.emAberto.slice(0, 10).map((x) => <div key={x.mei.id} className="flex justify-between border-b border-slate-100 py-0.5"><span>{nomeMei(x.mei)}</span><span>{brl(x.honorario)}</span></div>)}
              {f.emAberto.length > 10 && <div className="text-slate-400">+ {f.emAberto.length - 10} outro(s)…</div>}</>}
          </div>
        </div>
        <div className="card p-3">
          <div className="mb-2 flex items-center justify-between"><span className="font-semibold text-slate-700">📊 Recebimento de honorários por mês</span>
            <select className="rounded border border-slate-300 px-1 text-[12px]" value={anoQuadro} onChange={(e) => setAnoQuadro(Number(e.target.value))}>{anosQuadro.map((a) => <option key={a}>{a}</option>)}</select></div>
          <div className="grid grid-cols-6 gap-1 text-center text-[11px]">
            {recebPorMes.map((v, i) => <div key={i} className="rounded border border-slate-100 p-1"><div className="text-slate-500">{MESES[i]}</div><div className={v === maxReceb && v > 0 ? 'font-bold' : ''}>{brl(v)}</div></div>)}
          </div>
          <div className="mb-1 mt-3 font-semibold text-slate-700">📈 Saúde fiscal da carteira · {anoQuadro}</div>
          <div className="grid grid-cols-4 gap-2 text-center text-[12px]">
            <button className="rounded border border-slate-200 p-1 hover:bg-slate-50" onClick={() => navigate('/mei/das')}><div className="text-slate-500">DAS em dia</div><b>{emDia}%</b></button>
            <button className="rounded border border-slate-200 p-1 hover:bg-slate-50" onClick={() => navigate('/mei/lancamentos')}><div className="text-slate-500">Perto do limite</div><b>{saude.filter((s) => s.pct >= 0.8).length}</b></button>
            <button className="rounded border border-slate-200 p-1 hover:bg-slate-50" onClick={() => navigate('/mei/lancamentos')}><div className="text-slate-500">Excederam</div><b style={{ color: COR.erro }}>{saude.filter((s) => s.pct > 1).length}</b></button>
            <button className="rounded border border-slate-200 p-1 hover:bg-slate-50" onClick={() => navigate('/mei/lancamentos')}><div className="text-slate-500">Faturamento em risco</div><b>{brl(saude.filter((s) => s.pct >= 0.8).reduce((a, s) => a + s.rec, 0))}</b></button>
          </div>
        </div>
      </div>

      <MeiModal mei={ficha === 'novo' ? null : ficha} aberto={ficha !== null} onFechar={() => setFicha(null)} onSalvo={recarregar} podeOperar={podeOperar} onInativar={(m) => { setFicha(null); setInativar(m); }} />
      <InativarMeiModal mei={inativar} onFechar={() => setInativar(null)} onFeito={recarregar} />
    </div>
  );
}

// ─── Ficha do MEI ───────────────────────────────────────────────────────────
interface EmpresaOpc { id: string; razaoSocial: string; cnpj: string }
export function MeiModal({ mei, aberto, onFechar, onSalvo, podeOperar, onInativar }: { mei: Mei | null; aberto: boolean; onFechar: () => void; onSalvo: () => void; podeOperar: boolean; onInativar: (m: Mei) => void }) {
  const toast = useToast();
  const [empresas, setEmpresas] = useState<EmpresaOpc[]>([]);
  const [q, setQ] = useState('');
  const vazio = { empresaId: '', razaoSocial: '', apelido: '', cnpj: '', atividade: 'servicos', comissaoPct: '10', abertura: '', temEmpregado: false, honorario: '', observacao: '' };
  const [f, setF] = useState(vazio);
  const [msg, setMsg] = useState('');
  useEffect(() => { if (aberto && !empresas.length) api.get<EmpresaOpc[]>('/alvaras/empresas').then(setEmpresas).catch(() => undefined); }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!aberto) return;
    setMsg(''); setQ('');
    setF(mei ? { empresaId: mei.empresaId ?? '', razaoSocial: '', apelido: mei.apelido ?? '', cnpj: mei.cnpj ?? '', atividade: mei.atividade || 'servicos', comissaoPct: String(mei.comissaoPct ?? 10),
      abertura: mei.abertura?.slice(0, 10) ?? '', temEmpregado: mei.temEmpregado, honorario: numeroParaMoeda(mei.honorario), observacao: mei.observacao ?? '' } : vazio);
  }, [aberto, mei]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  async function importarCnpj() {
    const dg = f.cnpj.replace(/\D/g, '');
    if (dg.length !== 14) return setMsg('Digite um CNPJ com 14 dígitos.');
    setMsg('Consultando a Receita…');
    try {
      const r = await api.get<{ razaoSocial: string; nomeFantasia: string }>(`/empresas/consulta-cnpj/${dg}`);
      const e = empresas.find((x) => x.cnpj === dg);
      setF((x) => ({ ...x, cnpj: mascaraCnpj(dg), apelido: r.nomeFantasia || x.apelido, empresaId: e?.id ?? x.empresaId, razaoSocial: e ? '' : r.razaoSocial }));
      setMsg(e ? `Empresa já cadastrada no Obrigô: ${e.razaoSocial}. Confira e clique em Salvar.` : `Encontrado: ${r.razaoSocial}. Ao salvar, a empresa é cadastrada no Obrigô.`);
    } catch (e) { setMsg(erroMsg(e)); }
  }
  async function salvar() {
    if (!f.empresaId && !f.razaoSocial.trim()) return toast('erro', 'Preencha: Cliente (escolha a empresa ou importe pelo CNPJ).');
    try {
      await meiApi.salvar(mei?.id ?? null, {
        empresaId: f.empresaId || null, razaoSocial: f.razaoSocial || null, apelido: f.apelido || null, cnpj: f.cnpj || null, atividade: f.atividade,
        comissaoPct: Number(f.comissaoPct) || 0, abertura: f.abertura || null, temEmpregado: f.temEmpregado, honorario: moedaParaNumero(f.honorario), observacao: f.observacao || null,
        situacao: mei && !ativo(mei) ? undefined : 'Ativo',
      });
      toast('ok', 'MEI salvo.'); onSalvo(); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function excluir() {
    if (!mei || !confirm(`Excluir o MEI ${nomeMei(mei)}? Os lançamentos, guias de DAS, DASN e parcelamentos dele também serão apagados. Não tem desfazer.`)) return;
    try { await meiApi.excluir(mei.id); toast('ok', 'MEI excluído.'); onSalvo(); onFechar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const lista = (q ? empresas.filter((e) => e.razaoSocial.toLowerCase().includes(q.toLowerCase()) || e.cnpj.includes(q.replace(/\D/g, '') || '§')) : empresas).slice(0, 200);
  return (
    <Modal aberto={aberto} titulo={mei ? `MEI — ${nomeMei(mei)}` : 'Novo MEI'} onFechar={onFechar} largura="max-w-2xl">
      <fieldset disabled={!podeOperar}>
        <div className="mb-3 rounded border border-slate-200 bg-slate-50 p-2">
          <div className="mb-1 text-center text-[12px] font-medium text-slate-600">Importar dados pelo CNPJ</div>
          <div className="flex gap-2"><input className={INP} value={f.cnpj} placeholder="00.000.000/0000-00" onChange={(e) => set('cnpj', mascaraCnpj(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && importarCnpj()} /><Botao tipo="info" type="button" onClick={importarCnpj}>Buscar e preencher</Botao></div>
          {msg && <div className="mt-1 text-center text-[12px] text-slate-500">{msg}</div>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cliente (empresa no Obrigô) *" className="col-span-2">
            {f.razaoSocial ? <div className="rounded bg-orange-50 p-1.5 text-[13px]">Nova empresa: <b>{f.razaoSocial}</b> <button type="button" className="text-marca-600" onClick={() => set('razaoSocial', '')}>trocar</button></div> : <>
              <input className={INP} placeholder="Filtrar por nome ou CNPJ" value={q} onChange={(e) => setQ(e.target.value)} />
              <select className={INP} size={4} value={f.empresaId} onChange={(e) => set('empresaId', e.target.value)}><option value="">— escolher —</option>{lista.map((e) => <option key={e.id} value={e.id}>{e.razaoSocial}</option>)}</select></>}
          </Campo>
          <Campo label="Nome fantasia / apelido"><input className={INP} value={f.apelido} onChange={(e) => set('apelido', e.target.value)} placeholder="em branco = razão social" /></Campo>
          <Campo label="Atividade (define o DAS)"><select className={INP} value={f.atividade} onChange={(e) => set('atividade', e.target.value)}>{ATIVIDADES.map((a) => <option key={a.v} value={a.v}>{a.t}</option>)}</select></Campo>
          <Campo label="Data de abertura"><input type="date" className={INP} value={f.abertura} onChange={(e) => set('abertura', e.target.value)} /></Campo>
          <Campo label="Honorário mensal (R$)"><input className={INP} value={f.honorario} placeholder="0,00" onChange={(e) => set('honorario', mascaraMoeda(e.target.value))} /></Campo>
          <Campo label="Comissão (%) — sobre o honorário líquido (honorário − DAS)"><input type="number" step={1} min={0} className={INP} value={f.comissaoPct} onChange={(e) => set('comissaoPct', e.target.value)} /></Campo>
          <label className="flex items-center gap-2 self-end text-[13px]"><input type="checkbox" className="accent-marca-600" checked={f.temEmpregado} onChange={(e) => set('temEmpregado', e.target.checked)} /> Possui empregado registrado</label>
          <Campo label="Observações" className="col-span-2"><textarea className={INP} rows={3} value={f.observacao} onChange={(e) => set('observacao', e.target.value)} /></Campo>
        </div>
        {mei && <p className="mt-2 text-center text-[11px] text-slate-400">Mudanças no honorário e na comissão valem a partir de {rotuloComp(compAtual())}; os meses anteriores ficam como estavam. Situação: <b>{mei.situacao}</b>{!ativo(mei) && ' (salvar reativa o MEI)'}.</p>}
      </fieldset>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {podeOperar && mei && <Botao tipo="excluir" onClick={excluir}>Excluir</Botao>}
        {podeOperar && mei && ativo(mei) && <Botao tipo="neutro" onClick={() => onInativar(mei)}>⏸ Inativar</Botao>}
        <Botao tipo="cancelar" onClick={onFechar}>{podeOperar ? 'Cancelar' : 'Fechar'}</Botao>
        {podeOperar && <Botao tipo="salvar" onClick={salvar}>Salvar</Botao>}
      </div>
    </Modal>
  );
}

export function InativarMeiModal({ mei, onFechar, onFeito }: { mei: Mei | null; onFechar: () => void; onFeito: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ situacao: 'Baixado', desde: hojeISO(), motivo: '', simeiBaixa: '' });
  const [erro, setErro] = useState('');
  useEffect(() => { if (mei) { setF({ situacao: 'Baixado', desde: hojeISO(), motivo: '', simeiBaixa: '' }); setErro(''); } }, [mei]);
  if (!mei) return null;
  async function confirmar() {
    if (!f.simeiBaixa) return setErro('⚠ Obrigatório: responda se a baixa no SIMEI foi feita.');
    try {
      await meiApi.inativar(mei!.id, f);
      toast('ok', `${nomeMei(mei!)} inativado${f.simeiBaixa === 'nao' ? ' — baixa no SIMEI ainda PENDENTE.' : '.'}`); onFeito(); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <Modal aberto onFechar={onFechar} titulo={`Inativar MEI — ${nomeMei(mei)}`}>
      <p className="mb-3 text-center text-[12px] text-slate-500">Nada é apagado. O DAS deixa de correr depois do mês da inativação.</p>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Situação"><select className={INP} value={f.situacao} onChange={(e) => setF({ ...f, situacao: e.target.value })}>{['Baixado', 'Desenquadrado', 'Inativo'].map((s) => <option key={s}>{s}</option>)}</select></Campo>
        <Campo label="Desde"><input type="date" className={INP} value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></Campo>
        <Campo label="Observação" className="col-span-2"><input className={INP} value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} /></Campo>
        <Campo label="Baixa no SIMEI (Portal do Empreendedor) *" className="col-span-2">
          <select className={INP} value={f.simeiBaixa} onChange={(e) => { setF({ ...f, simeiBaixa: e.target.value }); setErro(''); }}>
            <option value="">— responda —</option><option value="sim">Sim — baixa no SIMEI concluída</option><option value="nao">Não — ainda pendente</option><option value="na">Não se aplica (desenquadramento, sem baixa)</option>
          </select>
        </Campo>
      </div>
      {erro && <div className="mt-2 text-center text-[12px]" style={{ color: COR.erro }}>{erro}</div>}
      <div className="mt-4 flex justify-center gap-2"><Botao tipo="cancelar" onClick={onFechar}>Cancelar</Botao><Botao tipo="excluir" onClick={confirmar}>Inativar</Botao></div>
    </Modal>
  );
}
