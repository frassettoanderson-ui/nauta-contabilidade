// Alvaras › Calculadora de taxas (TFLE/TFFE) — estimativa com base na UFM e na LC 3.019/2006 (Imbituba/SC).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, temPermissao } from '../../lib/auth';
import { Modal, useToast } from '../../components/ui';
import { Campo } from '../societario/modais';
import { copiar } from '../societario/comum';
import { UFM, TAXAS } from './dados';
import { COR, TOTAL_CNAES, alvApi, ufmDeCnae, buscarCnae, moeda, type EmpresaMin } from './comum';
import { SelectEmpresa, Botao, INP, erroMsg } from './modais';

interface Ajuste { cnae: string; ufm: string; desc: string }
interface Faixa { ate: string; abertura: string; renovacao: string }
interface Params { exercicio?: number; ufmPorAno?: Record<string, string>; atividades?: Ajuste[]; faixas?: Faixa[]; taxas?: Record<string, string> }
const dig = (v: string) => v.replace(/\D/g, '');

export default function CalculadoraAlvaras() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'alvaras_operar');
  const toast = useToast();
  const [p, setP] = useState<Params>({});
  const [empresas, setEmpresas] = useState<EmpresaMin[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    alvApi.config().then((c) => setP(c.parametros as Params)).catch(() => undefined);
    alvApi.empresas().then(setEmpresas).catch(() => undefined);
  }, []);
  function salvar(np: Params) {
    setP(np);
    if (!podeOperar) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => alvApi.salvarConfig({ parametros: np }).catch((e) => toast('erro', erroMsg(e))), 600);
  }

  const anoAtual = new Date().getFullYear();
  const anos = [...new Set([...Object.keys(UFM).map(Number), anoAtual])].sort((a, b) => b - a);
  const ano = p.exercicio ?? anoAtual;
  const ufmManual = p.ufmPorAno?.[String(ano)];
  const ufm = Number(ufmManual) || UFM[String(ano)]?.v || 0;
  const dicaUfm = ufmManual ? 'Valor informado manualmente' : UFM[String(ano)] ? UFM[String(ano)].src : `Sem decreto cadastrado para ${ano} — informe o valor.`;

  // ── simulador
  const [s, setS] = useState({ empresaId: '', enq: 'demais', tipo: 'abertura', isencao: 'auto', area: '' });
  const [avulsos, setAvulsos] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [res, setRes] = useState<{ linhas: [string, string, string][]; total: number; notas: string[]; isento: boolean; sub: string } | null>(null);
  const [ajuda, setAjuda] = useState(false);
  const emp = empresas.find((e) => e.id === s.empresaId);
  const cnaesCliente = useMemo(() => (emp?.cnaes ?? '').split(/[,;|\n]/).map((x) => dig(x.split(' - ')[0] ?? x)).filter((d) => d.length >= 4), [emp]);
  const cnaes = [...new Set([...cnaesCliente, ...avulsos])];
  const ufmDe = (d: string): number | null => {
    const a = (p.atividades ?? []).find((x) => dig(x.cnae) === d && x.ufm !== '' && !Number.isNaN(Number(x.ufm)));
    return a ? Number(a.ufm) : ufmDeCnae(d);
  };
  async function buscarCnaesReceita() {
    if (!emp) return;
    try { const r = await alvApi.buscarCnaes(emp.id); setEmpresas((l) => l.map((e) => (e.id === emp.id ? { ...e, cnaes: r.cnaes } : e))); toast('ok', 'Atividades atualizadas pela Receita.'); }
    catch (e) { toast('erro', erroMsg(e)); }
  }
  function calcular() {
    if (!ufm) return toast('erro', 'Informe o valor da UFM do exercício antes de calcular.');
    const isento = s.isencao === 'sim' ? true : s.isencao === 'nao' ? false : s.enq === 'mei';
    const principal = TAXAS.find((t) => t.key === (s.tipo === 'abertura' ? 'loc' : 'tfle'))!;
    let soma = 0, casados = 0;
    for (const c of cnaes) { const u = ufmDe(c); if (u != null) { soma += u; casados++; } }
    const notas: string[] = [];
    let qtd: number | null = null, det = '';
    if (casados > 0) { qtd = soma; det = ` · ${casados} atividade(s) (CNAE) → ${soma} UFM`; }
    else {
      const area = Number(s.area.replace(',', '.'));
      const fx = [...(p.faixas ?? [])].sort((a, b) => (a.ate === '' ? Infinity : Number(a.ate)) - (b.ate === '' ? Infinity : Number(b.ate)));
      if (area > 0 && fx.length) {
        const f = fx.find((x) => x.ate === '' || area <= Number(x.ate)) ?? fx[fx.length - 1];
        const v = Number(s.tipo === 'abertura' ? f.abertura : f.renovacao);
        if (!Number.isNaN(v) && (s.tipo === 'abertura' ? f.abertura : f.renovacao) !== '') { qtd = v; det = ` · faixa até ${f.ate === '' ? '∞' : `${f.ate} m²`}`; }
      }
      notas.push(cnaes.length ? 'Os CNAEs considerados não constam na tabela oficial — confira o código ou crie um ajuste manual.' : 'Nenhuma atividade (CNAE) considerada — escolha o cliente ou adicione CNAEs pela consulta.');
    }
    const linhas: [string, string, string][] = [];
    let total = 0;
    if (isento) { linhas.push([principal.name, 'Isento', moeda(0)]); notas.push('Isenção da Lei 5.134/2020 (MEI/novos) aplicada à taxa principal.'); }
    else if (qtd == null) linhas.push([principal.name, 'quantidade de UFM não definida', 'a definir']);
    else { linhas.push([principal.name, `${qtd} UFM × ${moeda(ufm)}${det}`, moeda(qtd * ufm)]); total += qtd * ufm; }
    for (const k of extras) {
      const t = TAXAS.find((x) => x.key === k)!;
      const q = Number(p.taxas?.[k]);
      if (!p.taxas?.[k] || Number.isNaN(q)) { linhas.push([t.name, 'a definir', 'a definir']); notas.push(`Defina a quantidade de UFM da taxa “${t.name}” nos Parâmetros.`); }
      else { linhas.push([t.name, `${q} UFM × ${moeda(ufm)}`, moeda(q * ufm)]); total += q * ufm; }
    }
    setRes({ linhas, total, notas, isento, sub: `${emp?.razaoSocial ?? 'Simulação genérica'} · Exercício ${ano} · UFM ${moeda(ufm)} · ${s.tipo === 'abertura' ? 'Abertura — TFLE' : 'Renovação — TFFE'} · ${s.enq.toUpperCase()}` });
  }
  const resultados = buscarCnae(busca);
  const extrasDef = TAXAS.filter((t) => t.group === 'extra');

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-center text-[12px] text-slate-600">
        Estimativa de apoio com base na IN SEFAZ 004/2022 (Anexo Único) e na LC 3.019/2006 (arts. 331, 332, 338 a 340, 369) de Imbituba/SC.
        A tabela tem {TOTAL_CNAES} atividades. O cálculo não substitui a guia oficial.
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="card space-y-3 p-3">
          <div className="text-center font-semibold text-slate-700">Parâmetros da base de cálculo</div>
          <fieldset disabled={!podeOperar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Exercício"><select className={INP} value={ano} onChange={(e) => salvar({ ...p, exercicio: Number(e.target.value) })}>{anos.map((a) => <option key={a}>{a}</option>)}</select></Campo>
              <Campo label="UFM vigente (R$)">
                <input className={INP} value={ufmManual ?? (UFM[String(ano)]?.v ? String(UFM[String(ano)].v).replace('.', ',') : '')} placeholder="0,00"
                  onChange={(e) => salvar({ ...p, ufmPorAno: { ...(p.ufmPorAno ?? {}), [String(ano)]: e.target.value.replace(',', '.') } })} />
                <span className="text-[11px] text-slate-400">{dicaUfm}</span>
              </Campo>
            </div>
            <div className="text-center"><Botao tipo="cancelar" onClick={() => confirm('Restaurar os parâmetros padrão (UFM manual, ajustes, faixas e taxas extras)?') && salvar({ exercicio: ano })}>↺ Restaurar padrão</Botao></div>
          </fieldset>
          <Campo label="Consulta CNAE (código ou descrição)"><input className={INP} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="ex.: 5611 ou restaurante" /></Campo>
          {resultados.length > 0 && (
            <div className="max-h-56 overflow-y-auto rounded border border-slate-200">
              {resultados.map(([c, d, u]) => {
                const usando = avulsos.includes(dig(c)) || cnaesCliente.includes(dig(c));
                return (
                  <div key={c} className="flex items-center gap-2 border-b border-slate-100 px-2 py-1 text-[12px]">
                    <span className="w-20 font-mono">{c}</span><span className="flex-1 text-slate-600">{d}</span><span className="rounded bg-slate-100 px-1.5">{u} UFM</span>
                    <button className="text-marca-600 hover:underline" disabled={usando} onClick={() => setAvulsos((a) => [...a, dig(c)])}>{usando ? 'no cálculo ✓' : '+ usar no cálculo'}</button>
                    {podeOperar && !(p.atividades ?? []).some((x) => dig(x.cnae) === dig(c)) && <button className="text-slate-500 hover:underline" onClick={() => salvar({ ...p, atividades: [...(p.atividades ?? []), { cnae: c, ufm: String(u), desc: d }] })}>ajustar</button>}
                  </div>
                );
              })}
            </div>
          )}
          <fieldset disabled={!podeOperar}>
            <div className="mb-1 text-[12px] font-medium text-slate-600">Ajustes manuais (exceções) — têm prioridade sobre a tabela oficial</div>
            {(p.atividades ?? []).map((a, i) => (
              <div key={i} className="mb-1 grid grid-cols-[110px_70px_1fr_auto] gap-1">
                <input className={INP} value={a.cnae} placeholder="CNAE" onChange={(e) => salvar({ ...p, atividades: p.atividades!.map((x, j) => (j === i ? { ...x, cnae: e.target.value } : x)) })} />
                <input className={INP} value={a.ufm} placeholder="UFM" onChange={(e) => salvar({ ...p, atividades: p.atividades!.map((x, j) => (j === i ? { ...x, ufm: e.target.value } : x)) })} />
                <input className={INP} value={a.desc} placeholder="Descrição" onChange={(e) => salvar({ ...p, atividades: p.atividades!.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)) })} />
                <button className="px-1 text-red-500" onClick={() => salvar({ ...p, atividades: p.atividades!.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <button className="text-[12px] text-marca-600 hover:underline" onClick={() => salvar({ ...p, atividades: [...(p.atividades ?? []), { cnae: '', ufm: '', desc: '' }] })}>+ Ajuste manual (exceção)</button>
            <div className="mb-1 mt-3 text-[12px] font-medium text-slate-600">Faixas de área (m²) → UFM (usadas quando nenhum CNAE é encontrado)</div>
            {(p.faixas ?? []).map((f, i) => (
              <div key={i} className="mb-1 grid grid-cols-[1fr_1fr_1fr_auto] gap-1">
                <input className={INP} value={f.ate} placeholder="Até (m²) — vazio = acima" onChange={(e) => salvar({ ...p, faixas: p.faixas!.map((x, j) => (j === i ? { ...x, ate: e.target.value } : x)) })} />
                <input className={INP} value={f.abertura} placeholder="Abertura (UFM)" onChange={(e) => salvar({ ...p, faixas: p.faixas!.map((x, j) => (j === i ? { ...x, abertura: e.target.value } : x)) })} />
                <input className={INP} value={f.renovacao} placeholder="TFFE (UFM)" onChange={(e) => salvar({ ...p, faixas: p.faixas!.map((x, j) => (j === i ? { ...x, renovacao: e.target.value } : x)) })} />
                <button className="px-1 text-red-500" onClick={() => salvar({ ...p, faixas: p.faixas!.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <button className="text-[12px] text-marca-600 hover:underline" onClick={() => salvar({ ...p, faixas: [...(p.faixas ?? []), { ate: '', abertura: '', renovacao: '' }] })}>+ Adicionar faixa</button>
            <div className="mb-1 mt-3 text-[12px] font-medium text-slate-600">UFM das taxas adicionais</div>
            {extrasDef.map((t) => (
              <div key={t.key} className="mb-1 grid grid-cols-[1fr_90px] items-center gap-2">
                <div><div className="text-[12px] text-slate-700">{t.name}</div><div className="text-[11px] text-slate-400">{t.legal}</div></div>
                <input className={INP} value={p.taxas?.[t.key] ?? ''} placeholder="UFM" onChange={(e) => salvar({ ...p, taxas: { ...(p.taxas ?? {}), [t.key]: e.target.value } })} />
              </div>
            ))}
          </fieldset>
        </div>

        <div className="space-y-3">
          <div className="card space-y-3 p-3">
            <div className="text-center font-semibold text-slate-700">Simulador de taxas</div>
            <Campo label="Cliente (opcional)"><SelectEmpresa empresas={empresas} valor={s.empresaId} onMudar={(v) => setS({ ...s, empresaId: v })} placeholder="— simulação genérica —" /></Campo>
            {emp && !cnaesCliente.length && (
              <div className="rounded bg-slate-50 p-2 text-center text-[12px] text-slate-500">
                Esta empresa ainda não tem as atividades (CNAE) no cadastro. {emp.cnpj && podeOperar && <button className="text-marca-600 hover:underline" onClick={buscarCnaesReceita}>Buscar na Receita</button>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Enquadramento"><select className={INP} value={s.enq} onChange={(e) => setS({ ...s, enq: e.target.value })}><option value="demais">Demais empresas</option><option value="simples">ME/EPP — Simples</option><option value="mei">MEI (isento — Lei 5.134/2020)</option></select></Campo>
              <Campo label="Tipo de solicitação"><select className={INP} value={s.tipo} onChange={(e) => setS({ ...s, tipo: e.target.value })}><option value="abertura">Abertura — TFLE (Localização)</option><option value="renovacao">Renovação anual — TFFE (Funcionamento)</option></select></Campo>
              <Campo label="Isenção Lei 5.134/2020">
                <select className={INP} value={s.isencao} onChange={(e) => setS({ ...s, isencao: e.target.value })}><option value="auto">Automática (MEI)</option><option value="sim">Aplicar</option><option value="nao">Não aplicar</option></select>
                <button className="text-[11px] text-marca-600 hover:underline" onClick={() => setAjuda(true)}>❓ ajuda</button>
              </Campo>
              <Campo label="Área (m²), opcional"><input className={INP} value={s.area} onChange={(e) => setS({ ...s, area: e.target.value })} /></Campo>
            </div>
            <div>
              <div className="mb-1 text-[12px] font-medium text-slate-600">Atividades (CNAEs) consideradas</div>
              <div className="flex flex-wrap gap-1">
                {cnaes.length === 0 && <span className="text-[12px] text-slate-400">Nenhuma — escolha um cliente ou use a consulta CNAE.</span>}
                {cnaes.map((c) => { const u = ufmDe(c); return (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px]">
                    {c} · {u != null ? `${u} UFM` : 'sem UFM'}
                    {avulsos.includes(c) && !cnaesCliente.includes(c) && <button className="text-red-500" onClick={() => setAvulsos((a) => a.filter((x) => x !== c))}>✕</button>}
                  </span>); })}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[12px] font-medium text-slate-600">Taxas adicionais a incluir</div>
              {extrasDef.map((t) => (
                <label key={t.key} className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" className="accent-marca-600" checked={extras.includes(t.key)} onChange={(e) => setExtras((x) => (e.target.checked ? [...x, t.key] : x.filter((y) => y !== t.key)))} />
                  {t.name} <span className="text-slate-400">· {p.taxas?.[t.key] ? `${p.taxas[t.key]} UFM` : 'definir UFM'}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              <Botao tipo="cancelar" onClick={() => { setS({ empresaId: '', enq: 'demais', tipo: 'abertura', isencao: 'auto', area: '' }); setAvulsos([]); setExtras([]); setRes(null); }}>Limpar</Botao>
              <Botao tipo="salvar" onClick={calcular}>Calcular estimativa</Botao>
            </div>
          </div>
          {res && (
            <div className="card p-3">
              <div className="text-center font-semibold text-slate-700">Resultado da estimativa</div>
              <div className="mb-2 text-center text-[12px] text-slate-500">{res.sub}</div>
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Taxa</th><th>Cálculo</th><th className="text-right">Valor</th></tr></thead>
                <tbody>{res.linhas.map((l) => <tr key={l[0]} className="border-b border-slate-100"><td className="py-1">{l[0]}</td><td className="text-slate-500">{l[1]}</td><td className="text-right">{l[2]}</td></tr>)}</tbody>
                <tfoot><tr><td colSpan={2} className="py-1 text-right font-semibold">Total estimado</td><td className="text-right font-semibold">{moeda(res.total)}</td></tr></tfoot>
              </table>
              {res.total === 0 && <div className="mt-1 text-center"><span className="rounded px-2 py-0.5 text-[11px]" style={{ background: (res.isento ? COR.ok : COR.aviso) + '22', color: res.isento ? COR.ok : COR.aviso }}>{res.isento ? 'ISENTO — MEI (Lei 5.134/2020)' : 'informe as atividades (CNAE)'}</span></div>}
              <ul className="mt-2 list-disc pl-5 text-[11px] text-slate-500">{res.notas.map((n) => <li key={n}>{n}</li>)}<li>Base legal: LC 3.019/2006 (arts. 331, 332, 338 a 340, 369) e IN SEFAZ 004/2022. Estimativa — não substitui a guia oficial.</li></ul>
              <div className="mt-2 text-center"><Botao tipo="info" onClick={async () => toast((await copiar([res.sub, ...res.linhas.map((l) => l.join(' | ')), `TOTAL: ${moeda(res.total)}`].join('\n'))) ? 'ok' : 'erro', 'Resultado copiado.')}>Copiar</Botao></div>
            </div>
          )}
        </div>
      </div>
      <Modal aberto={ajuda} onFechar={() => setAjuda(false)} titulo="Isenção — Lei 5.134/2020">
        <p className="text-center text-[13px] text-slate-600">A lei municipal isenta das taxas de localização e funcionamento o MEI e os empreendimentos que ela enquadra como novos.
          No modo “Automática”, a isenção é aplicada quando o enquadramento é MEI. Use “Aplicar” para outros casos previstos na lei.
          A isenção vale só para a taxa principal; as taxas adicionais continuam sendo calculadas.</p>
      </Modal>
    </div>
  );
}
