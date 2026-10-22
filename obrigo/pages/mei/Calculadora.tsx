// MEI › Calculadora do DAS e guia de obrigacoes (referencia).
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { Campo, INP, erroMsg } from '../societario/modais';
import { ATIVIDADES, SAL_MIN_PADRAO, meiApi, salarioMinimo, dasPartes, limiteAno, brl, hojeISO, PGMEI_URL, DASN_URL, PARCEL_URL, PORTAL_URL } from './motor';
import { useMei } from './Painel';

export default function CalculadoraMei() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'mei_operar');
  const toast = useToast();
  const { d, recarregar } = useMei();
  const anoCorr = Number(hojeISO().slice(0, 4));
  const [ano, setAno] = useState(anoCorr);
  if (!d) return <div className="py-16 text-center text-slate-400">Carregando…</div>;
  const sm = salarioMinimo(ano, d.config);
  const manual = d.config.salarioMinimo[String(ano)] != null && Number(d.config.salarioMinimo[String(ano)]) !== SAL_MIN_PADRAO[String(ano)];
  const fonte = manual ? 'Valor informado manualmente' : SAL_MIN_PADRAO[String(ano)] ? `Salário mínimo de referência de ${ano}` : 'Estimativa — informe o valor oficial';
  async function salvarSm(v: string) {
    const n = Number(v.replace(',', '.'));
    if (!(n > 0) || n === sm) return;
    try { await meiApi.salarioMinimo(ano, n); toast('ok', 'Salário mínimo atualizado.'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const limite = limiteAno({ abertura: null } as never, ano, d.config);
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="card mx-auto max-w-3xl p-3">
        <div className="mb-2 text-center font-semibold text-slate-700">Calculadora do DAS-MEI</div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Campo label="Ano"><select className={INP} value={ano} onChange={(e) => setAno(Number(e.target.value))}>{[anoCorr + 1, anoCorr, anoCorr - 1, anoCorr - 2, anoCorr - 3, anoCorr - 4, anoCorr - 5].map((a) => <option key={a}>{a}</option>)}</select></Campo>
          <Campo label="Salário mínimo do ano (ajustável)">
            <input className={INP} defaultValue={String(sm).replace('.', ',')} key={`${ano}${sm}`} disabled={!podeOperar} onBlur={(e) => salvarSm(e.target.value)} />
            <span className="text-[11px] text-slate-400">{fonte}</span>
          </Campo>
        </div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Tipo</th><th className="text-right">INSS</th><th className="text-right">ICMS</th><th className="text-right">ISS</th><th className="text-right">DAS mensal</th></tr></thead>
          <tbody>{ATIVIDADES.map((a) => { const p = dasPartes(a.v, ano, d.config); return (
            <tr key={a.v} className="border-b border-slate-100"><td className="py-1">{a.t}{a.v === 'transporte' && ' (INSS 12%)'}</td><td className="text-right">{brl(p.inss)}</td><td className="text-right">{p.icms ? brl(p.icms) : '—'}</td><td className="text-right">{p.iss ? brl(p.iss) : '—'}</td><td className="text-right font-semibold">{brl(p.total)}</td></tr>); })}</tbody>
        </table>
        <div className="mt-2 text-center text-[11px] text-slate-400">Estimativa com base na legislação do SIMEI (LC 123/2006). O valor oficial é o gerado no PGMEI.</div>
      </div>
      <div className="card mx-auto max-w-3xl space-y-2 p-3 text-[13px] text-slate-600">
        <div className="text-center font-semibold text-slate-700">Guia de obrigações do MEI</div>
        <div><b>Mensais:</b> DAS-SIMEI vence no dia 20 (fim de semana ou feriado: próximo dia útil). Relatório Mensal de Receitas Brutas até o dia 20 do mês seguinte, separando receita com e sem nota. Nota fiscal obrigatória para venda a pessoa jurídica; dispensada para pessoa física que não exigir.</div>
        <div><b>Anual:</b> DASN-SIMEI até 31/05 do ano seguinte. O atraso gera multa (mínimo R$ 50,00) e pode travar a emissão do DAS.</div>
        <div><b>Limite:</b> {brl(limite)} por ano ({brl(limite / 12)} por mês). No ano de abertura é proporcional aos meses, contando o mês de abertura. Excesso de até 20% desenquadra no ano seguinte, com DAS complementar sobre o excesso; acima de 20%, o desenquadramento é retroativo ao início do ano.</div>
        <div><b>Funcionário:</b> até 1 empregado, com salário mínimo ou piso da categoria. FGTS 8% e INSS 3% pela DAE do eSocial.</div>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          {[['Portal do Empreendedor', PORTAL_URL], ['PGMEI', PGMEI_URL], ['DASN-SIMEI', DASN_URL], ['Parcelamento', PARCEL_URL]].map(([t, u]) => (
            <a key={t} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-marca-600 hover:underline">{t} <ExternalLink size={11} /></a>))}
        </div>
      </div>
    </div>
  );
}
