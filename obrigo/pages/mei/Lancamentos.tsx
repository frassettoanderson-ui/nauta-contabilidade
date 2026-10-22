// MEI › Lancamentos de receitas e despesas (livro-caixa no plano de contas). As receitas de venda e
// servico sao o faturamento que conta para o teto do MEI, para a DASN e para a DRE.
import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Pencil, X, Zap } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { Selo } from '../societario/Gestao';
import { Botao, INP, erroMsg } from '../societario/modais';
import { mascaraMoeda, moedaParaNumero, numeroParaMoeda } from '../societario/comum';
import { COR } from '../alvaras/comum';
import {
  CONTAS, conta, meiApi, nomeMei, dre, enquadramento, receitaAno, brl, dataBR, hojeISO, MESES_LONGOS, baixarCsv, moedaCsv, lerCsv, coluna,
  type Dados, type Mei, type Lancamento,
} from './motor';
import { useMei, SeletorMei, OpcoesRecorte } from './Painel';

export function FaturamentoQuadro({ d, mei, ano }: { d: Dados; mei: Mei; ano: number }) {
  const e = enquadramento(d, mei, ano);
  const cor = { erro: COR.erro, aviso: COR.aviso, ok: COR.ok }[e.sit.c as 'erro' | 'aviso' | 'ok'];
  return (
    <div className="card p-3">
      <div className="mb-2 text-center font-semibold text-slate-700">Faturamento e limite de enquadramento · {ano}</div>
      <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-5">
        <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">Faturado no ano</div><b>{brl(e.acumulado)}</b></div>
        <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">Limite do ano{mei.abertura && Number(mei.abertura.slice(0, 4)) === ano ? ' (proporcional)' : ''}</div><b>{e.limite ? brl(e.limite) : '—'}</b></div>
        <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">% do limite</div><b>{e.pct.toFixed(1)}%</b></div>
        <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">Projeção anual</div><b style={e.limite && e.projecao > e.limite ? { color: COR.erro } : undefined}>{e.projecao ? brl(e.projecao) : '—'}</b></div>
        <div className="rounded border p-2" style={{ borderColor: cor + '66', background: cor + '11' }}><div className="text-[11px] text-slate-500">Situação</div><b style={{ color: cor }}>{e.sit.t}</b></div>
      </div>
      <div className="mt-1 text-center text-[11px] text-slate-400">Excesso tolerado de 20% sobre o limite do ano ({brl(e.teto20)}). Acima disso, o desenquadramento é retroativo. O sistema só sinaliza — a mudança de situação é manual.</div>
    </div>
  );
}

export default function LancamentosMei() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'mei_operar');
  const toast = useToast();
  const { d, recarregar } = useMei();
  const anoCorr = Number(hojeISO().slice(0, 4));
  const [recorte, setRecorte] = useState('ativos');
  const [meiId, setMeiId] = useState('');
  const [ano, setAno] = useState(anoCorr);
  const [mes, setMes] = useState('');
  const [ls, setLs] = useState<Lancamento[]>([]);
  const [form, setForm] = useState({ id: '', data: hojeISO(), conta: 'rec_servicos', descricao: '', valor: '' });
  const valorRef = useRef<HTMLInputElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const mei = d?.meis.find((m) => m.id === meiId) ?? null;
  useEffect(() => { if (d && !d.meis.some((m) => m.id === meiId)) setMeiId(d.meis.filter((m) => recorte !== 'ativos' || m.situacao === 'Ativo').sort((a, b) => nomeMei(a).localeCompare(nomeMei(b)))[0]?.id ?? ''); }, [d, recorte]); // eslint-disable-line react-hooks/exhaustive-deps
  const carregar = () => (meiId ? meiApi.lancamentos(ano, meiId).then(setLs).catch(() => setLs([])) : setLs([]));
  useEffect(() => { carregar(); }, [meiId, ano]); // eslint-disable-line react-hooks/exhaustive-deps
  const doPeriodo = ls.filter((l) => !mes || l.data.slice(5, 7) === mes);
  const r = dre(doPeriodo);
  const receitas = doPeriodo.filter((l) => conta(l.conta)?.sinal === 1).reduce((s, l) => s + l.valor, 0);
  const despesas = doPeriodo.filter((l) => conta(l.conta)?.sinal === -1).reduce((s, l) => s + l.valor, 0);
  const carteiraRec = d ? d.meis.reduce((s, m) => s + receitaAno(d, m.id, anoCorr), 0) : 0;

  async function salvar() {
    if (!podeOperar) return toast('erro', 'Seu nível de acesso é somente de consulta.');
    if (!meiId) return toast('erro', 'Cadastre e selecione um MEI primeiro.');
    const valor = moedaParaNumero(form.valor);
    if (!(valor > 0)) return toast('erro', 'Informe um valor maior que zero.');
    try {
      await meiApi.salvarLanc(form.id || null, { meiId, data: form.data || hojeISO(), conta: form.conta, descricao: form.descricao || null, valor });
      toast('ok', form.id ? 'Lançamento alterado.' : 'Lançamento adicionado.');
      setForm({ id: '', data: form.data, conta: form.conta, descricao: '', valor: '' }); carregar(); recarregar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function excluir(l: Lancamento) {
    if (!confirm(`Excluir o lançamento de ${brl(l.valor)} (${conta(l.conta)?.rotulo ?? l.conta})?`)) return;
    try { await meiApi.excluirLanc(l.id); carregar(); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function lancarDas() {
    if (!mei) return;
    if (!confirm(`Lançar como imposto (dedução) o DAS de cada competência PAGA de ${ano} de ${nomeMei(mei)}? Os lançamentos automáticos anteriores deste ano são refeitos.`)) return;
    try { const x = await meiApi.lancarDas(mei.id, ano); toast('ok', `${x.lancados} competência(s) lançada(s).`); carregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  function exportar() {
    if (!mei) return;
    baixarCsv(`Lancamentos_${nomeMei(mei).replace(/[^A-Za-z0-9]+/g, '_')}_${ano}.csv`, [['Data', 'Conta', 'Descrição', 'Valor', 'Automático'],
      ...ls.map((l) => [dataBR(l.data), conta(l.conta)?.rotulo ?? l.conta, l.descricao ?? '', moedaCsv(l.valor), l.automatico ? 'Sim' : 'Não'])]);
  }
  async function importar(arq: File) {
    if (!meiId) return toast('erro', 'Selecione o MEI.');
    try {
      const rows = lerCsv(await arq.text()).map((x) => ({ data: coluna(x, ['Data', 'Competência', 'Competencia']), conta: coluna(x, ['Conta']), descricao: coluna(x, ['Descrição', 'Descricao']), valor: coluna(x, ['Valor']) }));
      const res = await meiApi.importarLanc(meiId, rows);
      toast('ok', `${res.criados} lançamento(s) importado(s)${res.repetidos ? `, ${res.repetidos} já existiam` : ''}${res.ignoradas ? `, ${res.ignoradas} linha(s) ignorada(s)` : ''}.`); carregar(); recarregar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  const grupos = ['Receitas', 'Deduções e custos', 'Despesas'];
  if (!d) return <div className="py-16 text-center text-slate-400">Carregando…</div>;
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-base font-semibold text-slate-700">Lançamentos de receitas e despesas</div><div className="text-[12px] text-slate-500">As receitas de venda e de serviço formam o faturamento que conta para o teto do MEI, a DASN e a DRE.</div></div>
        <div className="flex gap-2"><Selo cor={COR.info}>{brl(carteiraRec)} receita da carteira em {anoCorr}</Selo></div>
      </div>
      <div className="card p-3">
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <select className={`${INP} w-56`} value={recorte} onChange={(e) => setRecorte(e.target.value)}><OpcoesRecorte /></select>
          <SeletorMei meis={d.meis} recorte={recorte} valor={meiId} onMudar={setMeiId} />
          <select className={`${INP} w-24`} value={ano} onChange={(e) => setAno(Number(e.target.value))}>{[anoCorr + 1, anoCorr, anoCorr - 1, anoCorr - 2, anoCorr - 3].map((a) => <option key={a}>{a}</option>)}</select>
          <select className={`${INP} w-40`} value={mes} onChange={(e) => setMes(e.target.value)}><option value="">Todos os meses</option>{MESES_LONGOS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}</select>
        </div>
        {mei && podeOperar && (
          <div className="mb-2 grid grid-cols-1 gap-2 rounded border border-slate-200 bg-slate-50 p-2 md:grid-cols-[140px_1fr_1fr_120px_auto]">
            <input type="date" className={INP} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            <select className={INP} value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })}>
              {grupos.map((g) => <optgroup key={g} label={`RESULTADO (DRE) · ${g}`}>{CONTAS.filter((c) => c.grupo === g).map((c) => <option key={c.id} value={c.id}>{c.sinal < 0 ? '(−) ' : ''}{c.rotulo}</option>)}</optgroup>)}
            </select>
            <input className={INP} placeholder="Descrição (opcional) — ex.: Venda NF 123" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <input ref={valorRef} className={INP} placeholder="Valor (R$)" value={form.valor} onChange={(e) => setForm({ ...form, valor: mascaraMoeda(e.target.value) })} onKeyDown={(e) => e.key === 'Enter' && salvar()} />
            <div className="flex gap-1">
              <Botao tipo="salvar" onClick={salvar}>{form.id ? 'Salvar alteração' : '+ Adicionar'}</Botao>
              {form.id && <Botao tipo="cancelar" onClick={() => setForm({ id: '', data: hojeISO(), conta: 'rec_servicos', descricao: '', valor: '' })}>Cancelar</Botao>}
            </div>
          </div>
        )}
        {mei && (
          <div className="mb-2 flex flex-wrap justify-center gap-1.5">
            {podeOperar && <Botao tipo="novo" onClick={lancarDas}><Zap size={13} /> Lançar DAS pago como imposto</Botao>}
            <Botao tipo="neutro" onClick={exportar}><Download size={13} /> Exportar CSV</Botao>
            {podeOperar && <><input ref={arquivo} type="file" accept=".csv" className="hidden" onChange={(e) => { const a = e.target.files?.[0]; e.target.value = ''; if (a) importar(a); }} />
              <Botao tipo="info" onClick={() => arquivo.current?.click()}><Upload size={13} /> Importar CSV</Botao></>}
          </div>
        )}
        {mei && (
          <div className="mb-2 grid grid-cols-2 gap-2 text-center md:grid-cols-4">
            <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">Receitas</div><b style={{ color: COR.ok }}>{brl(receitas)}</b></div>
            <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">Despesas / deduções</div><b style={{ color: COR.erro }}>{brl(despesas)}</b></div>
            <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">Resultado {mes ? 'do mês' : 'do ano'}</div><b style={{ color: r.resultado < 0 ? COR.erro : '#334155' }}>{brl(r.resultado)}</b></div>
            <div className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">Lançamentos</div><b>{doPeriodo.length}</b></div>
          </div>
        )}
        {!mei ? <div className="py-6 text-center text-slate-400">Cadastre um MEI para começar a lançar.</div> : (
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Data</th><th>Conta</th><th>Descrição</th><th className="text-right">Valor</th><th /></tr></thead>
            <tbody>
              {doPeriodo.map((l) => { const c = conta(l.conta); return (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-1">{dataBR(l.data)}</td><td>{c?.rotulo ?? l.conta} {l.automatico && <Selo cor={COR.info}>auto</Selo>}</td><td className="text-slate-600">{l.descricao}</td>
                  <td className="text-right" style={{ color: c?.sinal === -1 ? COR.erro : COR.ok }}>{c?.sinal === -1 ? '− ' : ''}{brl(l.valor)}</td>
                  <td className="whitespace-nowrap text-right">{podeOperar && <>
                    <button className="px-1 text-slate-400" onClick={() => { setForm({ id: l.id, data: l.data.slice(0, 10), conta: l.conta, descricao: l.descricao ?? '', valor: numeroParaMoeda(l.valor) }); valorRef.current?.focus(); }}><Pencil size={13} /></button>
                    <button className="px-1 text-red-400" onClick={() => excluir(l)}><X size={13} /></button></>}</td>
                </tr>); })}
            </tbody>
          </table>
        )}
        {mei && doPeriodo.length === 0 && <div className="py-4 text-center text-slate-400">{mes ? `Nenhum lançamento neste mês de ${ano}.` : `Nenhum lançamento em ${ano}.`}</div>}
      </div>
      {mei && <FaturamentoQuadro d={d} mei={mei} ano={ano} />}
    </div>
  );
}
