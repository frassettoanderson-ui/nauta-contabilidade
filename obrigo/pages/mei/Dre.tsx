// MEI › DRE — apuracao gerencial do lucro ou prejuizo do ano a partir dos lancamentos.
import { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Botao, INP } from '../societario/modais';
import { COR } from '../alvaras/comum';
import { meiApi, nomeMei, dre, atividadeDe, rotuloAtividade, PRESUNCAO, brl, hojeISO, MESES_LONGOS, baixarCsv, moedaCsv, r2, type Lancamento } from './motor';
import { useMei, SeletorMei, OpcoesRecorte } from './Painel';
import { FaturamentoQuadro } from './Lancamentos';

const neg = (v: number) => (v < 0 ? <span style={{ color: COR.erro }}>({brl(-v)})</span> : brl(v));

export default function DreMei() {
  const { d } = useMei();
  const anoCorr = Number(hojeISO().slice(0, 4));
  const [recorte, setRecorte] = useState('ativos');
  const [meiId, setMeiId] = useState('');
  const [ano, setAno] = useState(anoCorr);
  const [ls, setLs] = useState<Lancamento[]>([]);
  const mei = d?.meis.find((m) => m.id === meiId) ?? null;
  useEffect(() => { if (d && !d.meis.some((m) => m.id === meiId)) setMeiId(d.meis.filter((m) => recorte !== 'ativos' || m.situacao === 'Ativo').sort((a, b) => nomeMei(a).localeCompare(nomeMei(b)))[0]?.id ?? ''); }, [d, recorte]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (meiId) meiApi.lancamentos(ano, meiId).then(setLs).catch(() => setLs([])); else setLs([]); }, [meiId, ano]);
  if (!d) return <div className="py-16 text-center text-slate-400">Carregando…</div>;

  const r = dre(ls);
  const lucroOper = r2(r.lucroBruto - r.despOper);
  const margemBruta = r.recBruta ? Math.round(r.lucroBruto / r.recBruta * 1000) / 10 : 0;
  const margemOper = r.recBruta ? Math.round(lucroOper / r.recBruta * 1000) / 10 : 0;
  const nMeses = Math.max(1, new Set(ls.map((l) => l.competencia)).size);
  const pct = PRESUNCAO[atividadeDe(mei) || 'comercio'] ?? 8;
  const dasPago = r2(d.das.filter((g) => g.meiId === meiId && g.situacao === 'Pago' && g.competencia.startsWith(`${ano}-`)).reduce((s, g) => s + g.valor, 0));
  const isento = Math.max(0, r2(r.recBruta * pct / 100 - dasPago));
  const meses = [...new Set(ls.map((l) => l.competencia))].sort().map((c) => {
    const x = dre(ls.filter((l) => l.competencia === c));
    const rec = r2(x.recBruta + x.s('rec_outras') + x.s('rec_fin'));
    const desp = r2(x.deducoes + x.custo + x.despOper + x.s('desp_fin') + x.s('outras_desp'));
    return { c, rec, desp, lucro: x.resultado, margem: rec ? Math.round(x.resultado / rec * 1000) / 10 : 0 };
  });
  const linhasDre: [string, number, boolean?][] = [
    ['RECEITA OPERACIONAL BRUTA', r.recBruta, true], ['  Venda de mercadorias/produtos', r.s('rec_vendas')], ['  Prestação de serviços', r.s('rec_servicos')],
    ['(−) DEDUÇÕES', -r.deducoes, true], ['  Impostos sobre vendas (DAS/ICMS/ISS)', -r.s('ded_impostos')], ['  Devoluções e descontos', -r.s('ded_devol')],
    ['(=) RECEITA LÍQUIDA', r.recLiquida, true], ['(−) CUSTO DAS MERCADORIAS/SERVIÇOS', -r.custo, true], ['(=) LUCRO BRUTO', r.lucroBruto, true],
    ['(−) DESPESAS OPERACIONAIS', -r.despOper, true], ['  Pessoal', -r.s('desp_pessoal')], ['  Administrativas', -r.s('desp_admin')], ['  Comerciais', -r.s('desp_comercial')],
    ['(±) RESULTADO FINANCEIRO', r.resFin, true], ['  Receitas financeiras', r.s('rec_fin')], ['  Despesas financeiras', -r.s('desp_fin')],
    ['(±) OUTRAS RECEITAS/DESPESAS', r.outras, true],
  ];
  function exportar() {
    if (!mei) return;
    baixarCsv(`DRE_${nomeMei(mei).replace(/[^A-Za-z0-9]+/g, '_')}_${ano}.csv`, [['Conta', 'Valor (R$)'], ...linhasDre.map(([t, v]) => [t.trim(), moedaCsv(v)]),
      ['RESULTADO LÍQUIDO DO EXERCÍCIO', moedaCsv(r.resultado)], [''], ['LUCRO', ''], ['Lucro bruto', moedaCsv(r.lucroBruto)], ['Margem bruta (%)', String(margemBruta).replace('.', ',')],
      ['Lucro operacional', moedaCsv(lucroOper)], ['Margem operacional (%)', String(margemOper).replace('.', ',')], ['Lucro líquido', moedaCsv(r.resultado)], ['Margem líquida (%)', String(r.margem).replace('.', ',')],
      ['Média por mês', moedaCsv(r2(r.resultado / nMeses))], [''], ['DISTRIBUIÇÃO DE LUCRO ISENTA DE IR', ''], ['% de presunção', String(pct)], ['DAS pago no ano', moedaCsv(dasPago)],
      ['Isento sem escrituração', moedaCsv(isento)], ['Lucro apurado (com escrituração)', moedaCsv(r.resultado)]]);
  }
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px] print:m-0 print:bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="text-base font-semibold text-slate-700">DRE — Demonstração do Resultado</div>
        <div className="flex flex-wrap gap-2">
          <select className={`${INP} w-56`} value={recorte} onChange={(e) => setRecorte(e.target.value)}><OpcoesRecorte /></select>
          <SeletorMei meis={d.meis} recorte={recorte} valor={meiId} onMudar={setMeiId} />
          <select className={`${INP} w-24`} value={ano} onChange={(e) => setAno(Number(e.target.value))}>{[anoCorr, anoCorr - 1, anoCorr - 2, anoCorr - 3].map((a) => <option key={a}>{a}</option>)}</select>
          <Botao tipo="neutro" onClick={exportar}><Download size={13} /> CSV</Botao><Botao tipo="neutro" onClick={() => window.print()}><Printer size={13} /> Imprimir</Botao>
        </div>
      </div>
      {!mei ? <div className="py-10 text-center text-slate-400">Cadastre e selecione um MEI.</div> : <>
        <div className="text-center text-slate-600"><b>{nomeMei(mei)}</b> · {mei.cnpj} · {rotuloAtividade(atividadeDe(mei))} · {ano}</div>
        <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
          {[['Lucro bruto', brl(r.lucroBruto), `margem ${margemBruta}%`], ['Lucro operacional', brl(lucroOper), `margem ${margemOper}%`], ['Lucro líquido do ano', brl(r.resultado), `margem ${r.margem}%`], ['Lucro médio por mês', brl(r2(r.resultado / nMeses)), `dividido pelos ${nMeses} mês(es) com lançamento`]].map(([t, v, s]) => (
            <div key={t} className="card p-2"><div className="text-[11px] text-slate-500">{t}</div><b>{v}</b><div className="text-[11px] text-slate-400">{s}</div></div>))}
        </div>
        <div className="card p-3">
          <div className="mb-1 text-center font-semibold text-slate-700">Quanto o titular pode receber sem imposto de renda</div>
          <table className="mx-auto w-full max-w-lg text-[13px]"><tbody>
            <tr><td>Receita bruta</td><td className="text-right">{brl(r.recBruta)}</td></tr>
            <tr><td>(×) Presunção da atividade</td><td className="text-right">{pct}%</td></tr>
            <tr><td>(−) DAS pago no ano</td><td className="text-right">{brl(dasPago)}</td></tr>
            <tr className="font-semibold"><td>(=) Distribuição isenta sem escrituração</td><td className="text-right">{brl(isento)}</td></tr>
            <tr><td>Lucro apurado nesta DRE (com escrituração)</td><td className="text-right">{brl(r.resultado)}</td></tr>
          </tbody></table>
          <div className="mt-1 text-center text-[11px] text-slate-400">Estimativa gerencial. Distribuir acima da presunção exige escrituração contábil que comprove o lucro.</div>
        </div>
        <div className="card p-3">
          <table className="w-full text-[13px]"><tbody>
            {linhasDre.map(([t, v, b]) => <tr key={t} className={`border-b border-slate-100 ${b ? 'font-semibold' : 'text-slate-600'}`}><td className="py-1 whitespace-pre">{t}</td><td className="text-right">{neg(v)}</td></tr>)}
            <tr className="font-bold" style={{ background: (r.resultado < 0 ? COR.erro : COR.ok) + '22' }}><td className="py-1.5">(=) RESULTADO LÍQUIDO DO EXERCÍCIO</td><td className="text-right">{neg(r.resultado)}</td></tr>
          </tbody></table>
          <div className="mt-1 text-center text-[12px] text-slate-500">Margem líquida sobre a receita bruta: {r.recBruta ? `${r.margem}%` : '—'}</div>
        </div>
        <div className="card p-3">
          <div className="mb-1 text-center font-semibold text-slate-700">Lucro mês a mês</div>
          {meses.length === 0 ? <div className="py-4 text-center text-slate-400">Nenhum lançamento no ano — a apuração mensal aparece quando houver receita ou despesa.</div> : (
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Mês</th><th className="text-right">Receitas</th><th className="text-right">Despesas</th><th className="text-right">Lucro</th><th className="text-right">Margem</th></tr></thead>
              <tbody>{meses.map((x) => <tr key={x.c} className="border-b border-slate-100"><td className="py-1">{MESES_LONGOS[Number(x.c.slice(5)) - 1]}</td><td className="text-right">{brl(x.rec)}</td><td className="text-right">{brl(x.desp)}</td><td className="text-right">{neg(x.lucro)}</td><td className="text-right">{x.margem}%</td></tr>)}</tbody>
              <tfoot><tr className="font-semibold"><td className="py-1">ANO</td><td className="text-right">{brl(meses.reduce((s, x) => s + x.rec, 0))}</td><td className="text-right">{brl(meses.reduce((s, x) => s + x.desp, 0))}</td><td className="text-right">{neg(r.resultado)}</td><td className="text-right">{r.margem}%</td></tr></tfoot>
            </table>
          )}
        </div>
        <FaturamentoQuadro d={d} mei={mei} ano={ano} />
      </>}
    </div>
  );
}
