// MEI › Debitos e parcelamento — DAS em atraso e acordos de parcelamento (SIMEI / Simples Nacional).
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { Modal, useToast } from '../../components/ui';
import { Selo } from '../societario/Gestao';
import { Botao, Campo, INP, erroMsg } from '../societario/modais';
import { mascaraMoeda, moedaParaNumero, numeroParaMoeda } from '../societario/comum';
import { COR } from '../alvaras/comum';
import {
  meiApi, nomeMei, passaRecorte, competenciasDo, resumoDebitos, indiceGuias, rotuloComp, brl, dataBR, hojeISO, r2, PARCEL_URL,
  type Dados, type Mei, type Acordo,
} from './motor';
import { useMei, OpcoesRecorte } from './Painel';

const ROT: Record<string, string> = { pago: 'Pago', vencido: 'Vencido', pendente: 'A pagar', parcelado: 'Em parcelamento', dispensado: 'Dispensado', na: '—' };
const CORS: Record<string, string> = { pago: COR.ok, vencido: COR.erro, pendente: COR.aviso, parcelado: COR.info, dispensado: COR.neutro, na: COR.neutro };

export default function DebitosMei() {
  const { d, recarregar } = useMei();
  const [busca, setBusca] = useState('');
  const [soDevendo, setSoDevendo] = useState(true);
  const [recorte, setRecorte] = useState('ativos');
  const [meiId, setMeiId] = useState('');
  const guias = useMemo(() => indiceGuias(d?.das ?? []), [d]);
  if (!d) return <div className="py-16 text-center text-slate-400">Carregando…</div>;
  const mei = d.meis.find((m) => m.id === meiId);
  if (mei) return <FichaDebitos d={d} mei={mei} onVoltar={() => setMeiId('')} recarregar={recarregar} />;
  const linhas = d.meis.filter((m) => passaRecorte(m, recorte))
    .filter((m) => !busca || [nomeMei(m), m.cnpj, m.codigo].some((t) => (t ?? '').toLowerCase().includes(busca.toLowerCase())))
    .map((m) => ({ m, r: resumoDebitos(d, m, guias) }))
    .filter((x) => !soDevendo || x.r.aberto > 0 || x.r.emAcordo > 0)
    .sort((a, b) => b.r.aberto - a.r.aberto);
  const tot = linhas.reduce((s, x) => ({ ab: s.ab + x.r.aberto, ac: s.ac + x.r.emAcordo, v: s.v + x.r.vencidos }), { ab: 0, ac: 0, v: 0 });
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div><div className="text-base font-semibold text-slate-700">Débitos e parcelamento</div><div className="text-[12px] text-slate-500">DAS em atraso e acordos de parcelamento (SIMEI / Simples Nacional).</div></div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-2"><div className="text-[11px] text-slate-500">Total em aberto</div><b style={{ color: tot.ab ? COR.erro : '#334155' }}>{brl(tot.ab)}</b><div className="text-[11px] text-slate-400">{tot.v} guia(s) vencida(s) na carteira</div></div>
        <div className="card p-2"><div className="text-[11px] text-slate-500">MEIs devendo</div><b>{linhas.filter((x) => x.r.aberto > 0).length} de {d.meis.filter((m) => passaRecorte(m, recorte)).length}</b></div>
        <div className="card p-2"><div className="text-[11px] text-slate-500">Em parcelamento</div><b style={{ color: COR.info }}>{brl(tot.ac)}</b></div>
      </div>
      <div className="card p-3">
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <input className={`${INP} w-64`} placeholder="Buscar MEI (nome, CNPJ, código)" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className={`${INP} w-56`} value={recorte} onChange={(e) => setRecorte(e.target.value)}><OpcoesRecorte /></select>
          <label className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={soDevendo} onChange={(e) => setSoDevendo(e.target.checked)} /> só quem deve</label>
        </div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">MEI</th><th>Vencidos</th><th>Desde</th><th className="text-right">Em aberto</th><th className="text-right">Em acordo</th></tr></thead>
          <tbody>{linhas.map(({ m, r }) => (
            <tr key={m.id} onClick={() => setMeiId(m.id)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
              <td className="py-1.5">{nomeMei(m)}<div className="text-[11px] text-slate-400">{m.cnpj || m.codigo}</div></td>
              <td>{r.vencidos ? <Selo cor={COR.erro}>{r.vencidos}</Selo> : r.aPagar ? <Selo cor={COR.aviso}>{r.aPagar} a pagar</Selo> : '—'}</td>
              <td>{r.maisAntiga ? rotuloComp(r.maisAntiga) : '—'}</td>
              <td className="text-right">{brl(r.aberto)}</td>
              <td className="text-right">{brl(r.emAcordo)}{r.semAcordoNoPainel && <div className="text-[11px] text-slate-400">sem acordo no painel</div>}</td>
            </tr>))}</tbody>
          {linhas.length > 0 && <tfoot><tr className="font-semibold"><td className="py-1" colSpan={3}>TOTAL</td><td className="text-right">{brl(tot.ab)}</td><td className="text-right">{brl(tot.ac)}</td></tr></tfoot>}
        </table>
        {linhas.length === 0 && <div className="py-4 text-center text-slate-400">{!d.meis.length ? 'Nenhum MEI cadastrado ainda.' : busca ? `Nenhum MEI encontrado para “${busca}”.` : 'Nenhum DAS em aberto na carteira — tudo pago, dispensado ou dentro de um acordo.'}</div>}
      </div>
    </div>
  );
}

function FichaDebitos({ d, mei, onVoltar, recarregar }: { d: Dados; mei: Mei; onVoltar: () => void; recarregar: () => void }) {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'mei_operar');
  const toast = useToast();
  const guias = useMemo(() => indiceGuias(d.das), [d]);
  const comps = competenciasDo(mei, guias, d.config);
  const acordos = d.parcelamentos.filter((p) => p.meiId === mei.id);
  const r = resumoDebitos(d, mei, guias);
  const [aba, setAba] = useState<'debitos' | 'parc'>('debitos');
  const [filt, setFilt] = useState({ ano: '', sit: 'aberto' });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<{ acordo: Acordo | null; marcadas: string[] } | null>(null);
  const [filtAc, setFiltAc] = useState('');
  const visiveis = comps.filter((c) => (!filt.ano || String(c.ano) === filt.ano) && (filt.sit === '' ? true : filt.sit === 'aberto' ? c.situacao === 'vencido' || c.situacao === 'pendente' : c.situacao === filt.sit)).reverse();
  const orfas = comps.filter((c) => c.situacao === 'parcelado' && !c.acordoId);
  const totalSel = r2(comps.filter((c) => sel.has(c.comp)).reduce((s, c) => s + c.valor, 0));
  const passiveis = comps.filter((c) => !c.acordoId && (c.situacao === 'vencido' || c.situacao === 'pendente'));

  async function acao(p: Acordo, a: string, pagas?: number, confirmacao?: string) {
    if (confirmacao && !confirm(confirmacao)) return;
    try { if (a === 'excluir') await meiApi.excluirAcordo(p.id); else await meiApi.acaoAcordo(p.id, a, pagas); toast('ok', 'Parcelamento atualizado.'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function tirarOrfas() {
    const alvo = orfas.filter((c) => sel.size === 0 || sel.has(c.comp)).map((c) => c.comp);
    if (!alvo.length || !confirm(`Tirar do parcelamento ${alvo.length} competência(s) sem acordo registrado? Elas voltam para “Em aberto”.`)) return;
    try { const x = await meiApi.tirarParcelamento(mei.id, alvo); toast('ok', `${x.devolvidas} competência(s) devolvida(s).`); setSel(new Set()); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const resumoAc = acordos.filter((p) => p.situacao !== 'Cancelado');
  const pagoDe = (p: Acordo) => (p.parcelasPagas ? (p.valorPrimeira ? p.valorPrimeira + p.valorParcela * (p.parcelasPagas - 1) : p.valorParcela * p.parcelasPagas) : 0);
  const listaAc = acordos.filter((p) => !filtAc || p.situacao === filtAc);
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Botao tipo="cancelar" onClick={onVoltar}><ArrowLeft size={13} /> Carteira</Botao>
          <div><div className="font-semibold text-slate-700">{nomeMei(mei)}</div><div className="text-[11px] text-slate-400">{[mei.apelido, mei.cnpj, mei.codigo && `código ${mei.codigo}`, mei.abertura && `aberto em ${dataBR(mei.abertura)}`].filter(Boolean).join(' · ')}</div></div>
        </div>
        <div className="flex gap-2">
          <a href={PARCEL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 self-center text-[12px] text-marca-600 hover:underline">Parcelar no Simples Nacional <ExternalLink size={11} /></a>
          {podeOperar && <Botao tipo="novo" onClick={() => { const m = sel.size ? [...sel] : passiveis.map((c) => c.comp); if (!m.length) return toast('erro', 'Este MEI não tem competências passíveis de parcelamento.'); setForm({ acordo: null, marcadas: m }); }}>＋ Novo parcelamento</Botao>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-2"><div className="text-[11px] text-slate-500">Em aberto</div><b style={{ color: r.aberto ? COR.erro : '#334155' }}>{brl(r.aberto)}</b><div className="text-[11px] text-slate-400">{r.vencidos} vencido(s) · {r.aPagar} a pagar</div></div>
        <div className="card p-2"><div className="text-[11px] text-slate-500">Em parcelamento</div><b style={{ color: COR.info }}>{brl(r.emAcordo)}</b><div className="text-[11px] text-slate-400">{r.parcelados} competência(s) dentro de acordo</div></div>
        <div className="card p-2"><div className="text-[11px] text-slate-500">Mais antiga em aberto</div><b>{r.maisAntiga ? rotuloComp(r.maisAntiga) : '—'}</b></div>
      </div>
      <div className="flex justify-center gap-1">
        <button onClick={() => setAba('debitos')} className={`rounded px-3 py-1 ${aba === 'debitos' ? 'bg-marca-50 font-medium text-marca-700' : 'text-slate-500'}`}>Débitos</button>
        <button onClick={() => setAba('parc')} className={`rounded px-3 py-1 ${aba === 'parc' ? 'bg-marca-50 font-medium text-marca-700' : 'text-slate-500'}`}>Parcelamentos ({acordos.length})</button>
      </div>
      {aba === 'debitos' ? (
        <div className="card p-3">
          <div className="mb-2 flex flex-wrap justify-center gap-2">
            <select className={`${INP} w-28`} value={filt.ano} onChange={(e) => setFilt({ ...filt, ano: e.target.value })}><option value="">Todos</option>{[...new Set(comps.map((c) => c.ano))].sort((a, b) => b - a).map((a) => <option key={a}>{a}</option>)}</select>
            <select className={`${INP} w-56`} value={filt.sit} onChange={(e) => setFilt({ ...filt, sit: e.target.value })}>
              <option value="aberto">Em aberto (a pagar e vencidos)</option><option value="">Todas</option><option value="vencido">Vencidos</option><option value="pendente">A pagar</option><option value="pago">Pagos</option><option value="parcelado">Em parcelamento</option></select>
          </div>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Sel.</th><th>Competência</th><th>Vencimento</th><th>Situação</th><th className="text-right">Valor do DAS</th></tr></thead>
            <tbody>{visiveis.map((c) => {
              const ac = c.acordoId ? acordos.find((p) => p.id === c.acordoId) : null;
              return (
                <tr key={c.comp} className="border-b border-slate-100">
                  <td className="py-1"><input type="checkbox" disabled={!!c.acordoId || c.situacao === 'pago' || !podeOperar} checked={sel.has(c.comp)} onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(c.comp); else n.delete(c.comp); return n; })} /></td>
                  <td>{rotuloComp(c.comp)}</td><td>{dataBR(c.vencimento)}</td>
                  <td><Selo cor={CORS[c.situacao]}>{ROT[c.situacao]}</Selo>
                    {c.situacao === 'parcelado' && !c.acordoId && <div className="text-[11px] text-slate-400">sem acordo registrado</div>}
                    {ac && <div className="text-[11px] text-slate-400">{ac.protocolo || 'acordo'} · {ac.situacao} · <button className="text-marca-600 hover:underline" onClick={() => setAba('parc')}>ver acordo</button></div>}</td>
                  <td className="text-right">{brl(c.valor)}</td>
                </tr>);
            })}</tbody>
          </table>
          {visiveis.length === 0 && <div className="py-4 text-center text-slate-400">Nada com estes filtros.</div>}
          {podeOperar && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[12px]">
              <Botao tipo="neutro" onClick={() => setSel(new Set(visiveis.filter((c) => c.situacao === 'vencido' || c.situacao === 'pendente').filter((c) => !c.acordoId).map((c) => c.comp)))}>Selecionar em aberto</Botao>
              {sel.size > 0 && <Botao tipo="cancelar" onClick={() => setSel(new Set())}>Limpar seleção</Botao>}
              <span>{sel.size} competência(s) selecionada(s) · {brl(totalSel)}</span>
              {orfas.length > 0 && <Botao tipo="info" onClick={tirarOrfas}>🔓 Tirar do parcelamento ({sel.size ? 'marcadas' : `todas as ${orfas.length}`})</Botao>}
              <Botao tipo="salvar" disabled={!sel.size} onClick={() => setForm({ acordo: null, marcadas: [...sel] })}>→ Montar parcelamento</Botao>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="card p-2"><div className="text-[11px] text-slate-500">Saldo a pagar</div><b>{brl(Math.max(0, resumoAc.reduce((s, p) => s + p.total - pagoDe(p), 0)))}</b></div>
            <div className="card p-2"><div className="text-[11px] text-slate-500">Já pago</div><b style={{ color: COR.ok }}>{brl(resumoAc.reduce((s, p) => s + pagoDe(p), 0))}</b></div>
            <div className="card p-2"><div className="text-[11px] text-slate-500">Acordos em andamento</div><b>{resumoAc.filter((p) => p.situacao === 'Ativo').length} ativos de {resumoAc.length}</b></div>
          </div>
          <div className="text-center"><select className={`${INP} w-48`} value={filtAc} onChange={(e) => setFiltAc(e.target.value)}><option value="">Todos</option><option>Ativo</option><option>Quitado</option><option>Cancelado</option></select></div>
          {listaAc.length === 0 && <div className="card py-6 text-center text-slate-400">{acordos.length ? `Existe(m) ${acordos.length} em outra situação — troque o filtro.` : 'Este MEI não tem parcelamento registrado.'}</div>}
          {listaAc.map((p) => (
            <div key={p.id} className="card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-700">Parcelamento · {p.protocolo || 's/ protocolo'} <Selo cor={p.situacao === 'Quitado' ? COR.ok : p.situacao === 'Cancelado' ? COR.neutro : COR.info}>{p.situacao}</Selo></div>
                <div className="text-slate-700"><b>{brl(p.total)}</b> · {p.valorPrimeira ? `1ª de ${brl(p.valorPrimeira)} + ${p.parcelas - 1}x de ${brl(p.valorParcela)}` : `${p.parcelas}x de ${brl(p.valorParcela)}`}</div>
              </div>
              <div className="text-[12px] text-slate-500">Adesão {dataBR(p.adesao)} · principal {brl(p.principal)} · {p.juros ? `juros ${brl(p.juros)}` : 'sem juros'}{p.observacao ? ` · ${p.observacao}` : ''}</div>
              <details className="mt-1 text-[12px]"><summary className="cursor-pointer text-marca-600">Ver os {p.competencias.length} débitos deste parcelamento</summary>
                <table className="mt-1 w-full"><tbody>{p.competencias.map((c) => <tr key={c.competencia} className="border-b border-slate-100"><td>{rotuloComp(c.competencia)}</td><td className="text-right">{brl(c.valor)}</td></tr>)}
                  <tr className="font-semibold"><td>SOMA</td><td className="text-right">{brl(p.principal)}</td></tr></tbody></table>
              </details>
              <div className="mt-2 h-1.5 rounded bg-slate-200"><div className="h-1.5 rounded" style={{ width: `${(p.parcelasPagas / p.parcelas) * 100}%`, background: COR.ok }} /></div>
              <div className="text-[11px] text-slate-500">{p.parcelasPagas} de {p.parcelas} parcela(s) paga(s) · {Math.round((p.parcelasPagas / p.parcelas) * 100)}%</div>
              {podeOperar && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {p.situacao !== 'Cancelado' && <><Botao tipo="neutro" onClick={() => acao(p, 'pagas', p.parcelasPagas - 1)}>−</Botao><span className="text-[12px]">{p.parcelasPagas}</span><Botao tipo="neutro" onClick={() => acao(p, 'pagas', p.parcelasPagas + 1)}>+</Botao></>}
                  <Botao tipo="info" onClick={() => setForm({ acordo: p, marcadas: p.competencias.map((c) => c.competencia) })}>✎ Editar acordo</Botao>
                  {p.situacao === 'Ativo' && <Botao tipo="salvar" onClick={() => acao(p, 'quitar', undefined, 'Marcar todas as parcelas como pagas?')}>Quitar tudo</Botao>}
                  {p.situacao === 'Cancelado' && <Botao tipo="salvar" onClick={() => acao(p, 'reativar')}>↺ Reativar</Botao>}
                  {p.situacao !== 'Cancelado' && <Botao tipo="cancelar" onClick={() => acao(p, 'cancelar', undefined, 'Cancelar o acordo? As competências voltam como estavam antes dele.')}>Cancelar</Botao>}
                  <Botao tipo="excluir" onClick={() => acao(p, 'excluir', undefined, `Apagar este acordo de vez? Não tem desfazer.${p.situacao === 'Ativo' && p.parcelasPagas ? ' ATENÇÃO: ele tem parcelas pagas.' : ''}`)}>Excluir</Botao>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {form && <AcordoModal d={d} mei={mei} comps={comps} acordo={form.acordo} marcadas={form.marcadas} onFechar={() => setForm(null)} onSalvo={() => { setSel(new Set()); recarregar(); }} />}
    </div>
  );
}

function AcordoModal({ d, mei, comps, acordo, marcadas, onFechar, onSalvo }: {
  d: Dados; mei: Mei; comps: ReturnType<typeof competenciasDo>; acordo: Acordo | null; marcadas: string[]; onFechar: () => void; onSalvo: () => void;
}) {
  const toast = useToast();
  const doAcordo = new Map((acordo?.competencias ?? []).map((c) => [c.competencia, c.valor]));
  const candidatas = [...new Set([...comps.filter((c) => !c.acordoId || c.acordoId === acordo?.id).filter((c) => c.situacao !== 'pago' || doAcordo.has(c.comp)).map((c) => c.comp), ...doAcordo.keys()])].sort();
  const valorPadrao = (c: string) => doAcordo.get(c) ?? comps.find((x) => x.comp === c)?.valor ?? 0;
  const [marc, setMarc] = useState<Set<string>>(new Set(marcadas));
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries(candidatas.map((c) => [c, numeroParaMoeda(valorPadrao(c))])));
  const principal = r2([...marc].reduce((s, c) => s + moedaParaNumero(valores[c] ?? ''), 0));
  const [juros, setJuros] = useState(acordo ? acordo.juros : 0);
  const [nParc, setNParc] = useState(acordo?.parcelas ?? 1);
  const [primeira, setPrimeira] = useState<number | null>(acordo?.valorPrimeira ? acordo.valorPrimeira : null);
  const [f, setF] = useState({ pagas: String(acordo?.parcelasPagas ?? 0), adesao: acordo?.adesao?.slice(0, 10) ?? hojeISO(), protocolo: acordo?.protocolo ?? '', observacao: acordo?.observacao ?? '', situacao: acordo?.situacao ?? 'Ativo' });
  const total = Math.max(0, r2(principal + juros));
  const n = Math.min(60, Math.max(1, Math.round(nParc) || 1));
  const pe = primeira == null ? null : n <= 1 ? total : Math.min(primeira, total) > 0 ? Math.min(primeira, total) : null;
  const demais = n <= 1 ? total : pe == null ? r2(total / n) : r2((total - pe) / (n - 1));
  const soma = r2((pe ?? demais) + demais * (n - 1));
  const menor = Math.min(pe ?? demais, demais);
  useEffect(() => { if (principal + juros < 0) setJuros(-principal); }, [principal]); // eslint-disable-line react-hooks/exhaustive-deps
  async function salvar() {
    if (!marc.size) return toast('erro', 'Marque ao menos uma competência.');
    try {
      await meiApi.salvarAcordo(acordo?.id ?? null, {
        meiId: mei.id, competencias: [...marc].sort().map((c) => ({ competencia: c, valor: moedaParaNumero(valores[c] ?? '') })), total, parcelas: n,
        valorPrimeira: pe, parcelasPagas: Number(f.pagas) || 0, adesao: f.adesao || null, protocolo: f.protocolo || null, observacao: f.observacao || null, situacao: f.situacao,
      });
      toast('ok', acordo ? 'Parcelamento alterado.' : 'Parcelamento registrado.'); onSalvo(); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  void d;
  return (
    <Modal aberto onFechar={onFechar} titulo={acordo ? 'Editar parcelamento' : 'Montar parcelamento'} largura="max-w-3xl">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[12px] font-medium text-slate-600">Competências do acordo ({marc.size} de {candidatas.length} marcada(s))</div>
          <div className="max-h-72 overflow-y-auto rounded border border-slate-200">
            {candidatas.map((c) => { const x = comps.find((y) => y.comp === c); return (
              <div key={c} className="flex items-center gap-2 border-b border-slate-100 px-2 py-1 text-[12px]">
                <input type="checkbox" checked={marc.has(c)} onChange={(e) => setMarc((s) => { const nn = new Set(s); if (e.target.checked) nn.add(c); else nn.delete(c); return nn; })} />
                <span className="w-20">{rotuloComp(c)}</span><span className="flex-1 text-slate-400">venc. {dataBR(x?.vencimento)}</span>
                <input className="w-24 rounded border border-slate-300 px-1 text-right" disabled={!marc.has(c)} value={valores[c] ?? ''} onChange={(e) => setValores({ ...valores, [c]: mascaraMoeda(e.target.value) })} />
              </div>); })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">O valor de cada competência é editável — use o consolidado do e-CAC.</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Principal (soma dos DAS)"><div className="py-1.5 font-medium">{brl(principal)}</div></Campo>
          <Campo label="Juros / acréscimos (R$)"><input className={INP} type="number" step={0.01} value={juros} onChange={(e) => setJuros(r2(Number(e.target.value) || 0))} /></Campo>
          <Campo label="Total do acordo (R$)"><input className={INP} type="number" step={0.01} value={total} onChange={(e) => setJuros(r2((Number(e.target.value) || 0) - principal))} /></Campo>
          <Campo label="Nº de parcelas (1–60)"><input className={INP} type="number" min={1} max={60} value={nParc} onChange={(e) => setNParc(Number(e.target.value))} /></Campo>
          <Campo label="Valor da 1ª parcela"><input className={INP} type="number" step={0.01} value={pe ?? ''} placeholder={String(r2(total / n))} onChange={(e) => setPrimeira(Number(e.target.value) > 0 ? r2(Number(e.target.value)) : null)} /></Campo>
          <Campo label="Valor das demais"><div className="py-1.5">{brl(demais)}</div></Campo>
          <Campo label="Parcelas já pagas"><input className={INP} type="number" min={0} max={n} value={f.pagas} onChange={(e) => setF({ ...f, pagas: e.target.value })} /></Campo>
          <Campo label="Data de adesão"><input type="date" className={INP} value={f.adesao} onChange={(e) => setF({ ...f, adesao: e.target.value })} /></Campo>
          <Campo label="Protocolo / nº"><input className={INP} value={f.protocolo} onChange={(e) => setF({ ...f, protocolo: e.target.value })} /></Campo>
          <Campo label="Situação do acordo"><select className={INP} value={f.situacao} onChange={(e) => setF({ ...f, situacao: e.target.value })}><option>Ativo</option><option>Quitado</option><option>Cancelado</option></select></Campo>
          <Campo label="Observações" className="col-span-2"><input className={INP} placeholder="Ex.: parcelamento ordinário do Simples Nacional" value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} /></Campo>
        </div>
      </div>
      <div className="mt-3 rounded bg-slate-50 p-2 text-center text-[12px] text-slate-600">
        Principal {brl(principal)} · Juros <span style={{ color: juros > 0 ? COR.erro : juros < 0 ? COR.ok : undefined }}>{brl(juros)}</span> · <b>Total {brl(total)}</b> em {pe != null && n > 1 ? `1ª de ${brl(pe)} + ${n - 1}x de ${brl(demais)}` : `${n}x de ${brl(demais)}`}
        {menor > 0 && menor < 50 && <div style={{ color: COR.erro }}>⚠ Parcela abaixo do mínimo de R$ 50,00.</div>}
        {Math.abs(soma - total) >= 0.01 && <div style={{ color: COR.aviso }}>Soma das parcelas: {brl(soma)} — {brl(Math.abs(soma - total))} a {soma > total ? 'mais' : 'menos'} que o total, por arredondamento. Ajuste a 1ª parcela para fechar exato.</div>}
        {!marc.size && <div style={{ color: COR.erro }}>⚠ Nenhuma competência marcada.</div>}
        <div className="mt-1 text-[11px] text-slate-400">Parcela mínima do MEI: R$ 50,00 (até 60 vezes). A adesão oficial é feita no portal do Simples Nacional — aqui você registra e acompanha o acordo.</div>
      </div>
      <div className="mt-3 flex justify-center gap-2"><Botao tipo="cancelar" onClick={onFechar}>Cancelar</Botao><Botao tipo="salvar" onClick={salvar}>{acordo ? 'Salvar alterações' : 'Confirmar parcelamento'}</Botao></div>
    </Modal>
  );
}
