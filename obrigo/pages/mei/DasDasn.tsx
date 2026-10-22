// MEI › DAS e DASN — DAS mensal (vence dia 20) e a Declaracao Anual (prazo 31/05) de cada MEI.
import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { Selo } from '../societario/Gestao';
import { Botao, INP, erroMsg } from '../societario/modais';
import { copiar, mascaraMoeda, moedaParaNumero, numeroParaMoeda } from '../societario/comum';
import { COR } from '../alvaras/comum';
import {
  meiApi, nomeMei, passaRecorte, ativo, atividadeDe, rotuloAtividade, das, situacaoDas, indiceGuias, vencimentoDe, competenciaExiste, receitaAno,
  brl, dataBR, hojeISO, MESES, PGMEI_URL, DASN_URL, type Mei, type SitDas,
} from './motor';
import { useMei, OpcoesRecorte } from './Painel';

const SELO: Record<SitDas, { t: string; c: string }> = {
  na: { t: '—', c: COR.neutro }, pago: { t: '✓', c: COR.ok }, vencido: { t: '!', c: COR.erro }, pendente: { t: '•', c: COR.aviso }, parcelado: { t: 'P', c: COR.info }, dispensado: { t: 'D', c: '#64748b' },
};

export async function abrirPortal(m: Mei | null, url: string, oque: string, toast: (t: 'ok' | 'erro', m: string) => void) {
  const c = (m?.cnpj ?? '').replace(/\D/g, '');
  if (c) toast((await copiar(c)) ? 'ok' : 'erro', `CNPJ ${c} copiado — cole (Ctrl+V) no portal ${oque}.`);
  else toast('erro', 'Este MEI está sem CNPJ cadastrado. Abrindo o portal…');
  window.open(url, '_blank');
}

export default function DasDasnMei() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'mei_operar');
  const toast = useToast();
  const { d, recarregar } = useMei();
  const anoCorr = Number(hojeISO().slice(0, 4));
  const [ano, setAno] = useState(anoCorr);
  const [sit, setSit] = useState('ativos');
  const [anoDasn, setAnoDasn] = useState(anoCorr - 1);
  const [sitDasn, setSitDasn] = useState('ativos');
  const guias = useMemo(() => indiceGuias(d?.das ?? []), [d]);
  if (!d) return <div className="py-16 text-center text-slate-400">Carregando…</div>;
  const meis = d.meis.filter((m) => passaRecorte(m, sit)).sort((a, b) => nomeMei(a).localeCompare(nomeMei(b)));
  const anoGuias = d.das.filter((g) => g.competencia.startsWith(`${anoCorr}-`));
  const comps = MESES.map((_, i) => `${ano}-${String(i + 1).padStart(2, '0')}`);
  const cont = { pago: 0, pendente: 0, vencido: 0, parcelado: 0 };
  for (const m of meis) for (const c of comps) { const s = situacaoDas(m, c, guias); if (s in cont) cont[s as keyof typeof cont]++; }

  async function alternar(m: Mei, c: string, s: SitDas) {
    if (!podeOperar) return toast('erro', 'Seu nível de acesso é somente de consulta.');
    if (s === 'na') return toast('erro', 'Competência anterior à abertura do MEI.');
    if (s === 'parcelado') return toast('erro', 'Esta competência está em parcelamento — trate em “Débitos e parcelamento”.');
    try { await meiApi.alternarDas(m.id, c); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  // DASN
  const prazo = `${anoDasn + 1}-05-31`;
  const elegiveis = d.meis.filter((m) => passaRecorte(m, sitDasn) && (!m.abertura || Number(m.abertura.slice(0, 4)) <= anoDasn) && (ativo(m) || !m.inativoEm || Number(m.inativoEm.slice(0, 4)) >= anoDasn))
    .sort((a, b) => nomeMei(a).localeCompare(nomeMei(b)));
  const dasnDe = (m: Mei) => d.dasn.find((x) => x.meiId === m.id && x.ano === anoDasn);
  async function receitaDasn(m: Mei, v: string) {
    try { await meiApi.dasn({ meiId: m.id, ano: anoDasn, receitaInformada: v ? moedaParaNumero(v) : null }); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function alternarDasn(m: Mei) {
    try { await meiApi.dasn({ meiId: m.id, ano: anoDasn, alternar: true }); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const entregues = elegiveis.filter((m) => dasnDe(m)?.situacao === 'Entregue').length;
  const receitaDecl = elegiveis.reduce((s, m) => s + (dasnDe(m)?.receitaInformada ?? receitaAno(d, m.id, anoDasn)), 0);

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-base font-semibold text-slate-700">DAS e DASN</div><div className="text-[12px] text-slate-500">DAS mensal (vence dia 20) e a Declaração Anual (DASN, prazo 31/05) de cada MEI.</div></div>
        <div className="flex gap-2">
          <Selo cor={COR.ok}>{anoGuias.filter((g) => g.situacao === 'Pago').length} guias pagas em {anoCorr}</Selo>
          <Selo cor={COR.info}>{anoGuias.filter((g) => g.situacao === 'Parcelado').length} em parcelamento</Selo>
          <Selo cor={COR.neutro}>{d.meis.filter(ativo).length} MEIs na carteira</Selo>
        </div>
      </div>
      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold text-slate-700">Controle do DAS mensal (SIMEI)</div>
          <div className="flex flex-wrap gap-2">
            <select className={`${INP} w-24`} value={ano} onChange={(e) => setAno(Number(e.target.value))}>{[anoCorr, anoCorr - 1, anoCorr - 2, anoCorr - 3, anoCorr - 4].map((a) => <option key={a}>{a}</option>)}</select>
            <select className={`${INP} w-56`} value={sit} onChange={(e) => setSit(e.target.value)}><OpcoesRecorte /></select>
            <a href={PGMEI_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 self-center text-[12px] text-marca-600 hover:underline">Emitir DAS (PGMEI) <ExternalLink size={11} /></a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead><tr className="border-b border-slate-200 text-[12px] text-slate-500"><th className="py-1 text-left">MEI</th>{MESES.map((m) => <th key={m}>{m}</th>)}<th>Pagos</th></tr></thead>
            <tbody>
              {meis.map((m) => {
                const devidas = comps.filter((c) => competenciaExiste(m, c)).length;
                const pagos = comps.filter((c) => situacaoDas(m, c, guias) === 'pago').length;
                return (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-1.5"><div className="text-slate-700">{nomeMei(m)}</div>
                      <div className="text-[11px] text-slate-400">{m.apelido ? `${m.apelido} · ` : ''}{rotuloAtividade(atividadeDe(m))} · {brl(das(atividadeDe(m), ano, d.config))}/mês
                        {' '}<button className="text-marca-600 hover:underline" onClick={() => abrirPortal(m, PGMEI_URL, 'para emitir o DAS', toast)}>↗ Gerar DAS</button></div></td>
                    {comps.map((c) => {
                      const s = situacaoDas(m, c, guias); const g = guias.get(`${m.id}|${c}`);
                      const titulo = s === 'pago' ? `Pago · ${brl(g?.valor ?? das(atividadeDe(m), ano, d.config))}` : s === 'vencido' ? `Vencido em ${dataBR(vencimentoDe(c))}` : s === 'pendente' ? `A pagar — vence ${dataBR(vencimentoDe(c))}` : s === 'parcelado' ? 'Em parcelamento' : s === 'dispensado' ? 'Dispensado' : '';
                      return <td key={c} className="text-center"><button title={titulo} disabled={s === 'na'} onClick={() => alternar(m, c, s)}
                        className="h-6 w-6 rounded-full text-[12px] font-bold" style={{ background: SELO[s].c + '22', color: SELO[s].c }}>{SELO[s].t}</button></td>;
                    })}
                    <td className="text-center text-slate-600">{pagos}/{devidas}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {meis.length === 0 && <div className="py-4 text-center text-slate-400">Nenhum MEI com este recorte.</div>}
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-[12px]">
          <Selo cor={COR.ok}>{cont.pago} pagos no ano</Selo><Selo cor={COR.aviso}>{cont.pendente} a pagar</Selo><Selo cor={COR.erro}>{cont.vencido} vencidos — negocie em Débitos e parcelamento</Selo><Selo cor={COR.info}>{cont.parcelado} parcelados</Selo>
        </div>
        <div className="mt-1 text-center text-[11px] text-slate-400">Clique na bolinha para marcar ou desmarcar o pagamento. Os valores do DAS são estimativa — confira a guia oficial.</div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold text-slate-700">Declaração Anual DASN-SIMEI</div>
          <div className="flex flex-wrap gap-2">
            <select className={`${INP} w-28`} value={anoDasn} onChange={(e) => setAnoDasn(Number(e.target.value))}>{[anoCorr, anoCorr - 1, anoCorr - 2, anoCorr - 3, anoCorr - 4].map((a) => <option key={a} value={a}>Ano-base {a}</option>)}</select>
            <select className={`${INP} w-56`} value={sitDasn} onChange={(e) => setSitDasn(e.target.value)}><OpcoesRecorte /></select>
            <a href={DASN_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 self-center text-[12px] text-marca-600 hover:underline">Transmitir DASN <ExternalLink size={11} /></a>
          </div>
        </div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">MEI</th><th>CNPJ</th><th>Receita bruta do ano</th><th>Entrega</th><th>Situação</th><th /></tr></thead>
          <tbody>
            {elegiveis.map((m) => {
              const x = dasnDe(m); const entregue = x?.situacao === 'Entregue'; const atraso = !entregue && prazo < hojeISO();
              return (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-1.5">{nomeMei(m)}{m.apelido && <div className="text-[11px] text-slate-400">{m.apelido}</div>}</td>
                  <td className="text-slate-600">{m.cnpj}</td>
                  <td><input className={`${INP} w-36`} disabled={!podeOperar} defaultValue={x?.receitaInformada != null ? numeroParaMoeda(x.receitaInformada) : ''} key={`${m.id}${anoDasn}${x?.receitaInformada}`}
                    placeholder={numeroParaMoeda(receitaAno(d, m.id, anoDasn)) || '0,00'} onChange={(e) => { e.target.value = mascaraMoeda(e.target.value); }}
                    onBlur={(e) => receitaDasn(m, e.target.value)} /></td>
                  <td className="text-slate-600">{entregue ? dataBR(x?.entregueEm) : `até ${dataBR(prazo)}`}</td>
                  <td><Selo cor={entregue ? COR.ok : atraso ? COR.erro : COR.aviso}>{entregue ? 'Entregue' : atraso ? 'Em atraso' : (x?.situacao ?? 'Pendente')}</Selo></td>
                  <td className="space-x-1 whitespace-nowrap text-right">
                    {podeOperar && <Botao tipo={entregue ? 'cancelar' : 'salvar'} onClick={() => alternarDasn(m)}>{entregue ? 'Desmarcar' : 'Marcar entregue'}</Botao>}
                    <Botao tipo="neutro" onClick={() => abrirPortal(m, DASN_URL, 'para transmitir a DASN', toast)}>↗ Portal</Botao>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {elegiveis.length === 0 && <div className="py-4 text-center text-slate-400">Nenhum MEI com atividade em {anoDasn}.</div>}
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-[12px]">
          <Selo cor={COR.ok}>{entregues} entregues</Selo><Selo cor={COR.aviso}>{elegiveis.length - entregues} pendentes</Selo><Selo cor={COR.info}>Receita declarada {brl(receitaDecl)}</Selo><Selo cor={COR.neutro}>Prazo {dataBR(prazo)}</Selo>
        </div>
        <div className="mt-1 text-center text-[11px] text-slate-400">Em branco, a receita é a calculada pelos lançamentos de venda e serviço. Atraso na DASN gera multa (mínimo R$ 50,00).</div>
      </div>
    </div>
  );
}
