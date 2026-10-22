// Alvaras › Painel — licencas, vencimentos, exigencias e taxas (foco em Imbituba/SC).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { Anel } from '../societario/Kanban';
import { Selo } from '../societario/Gestao';
import {
  COR, LIC_SITUACOES, ETAPAS_LEGAL, alvApi, nomeLic, diasAte, dataBR, situacaoEfetiva, corSituacao, corValidade, hojeISO,
  type Licenca, type Legalizacao, type EmpresaMin,
} from './comum';
import { LicencaModal, CorrigirTipoModal, BotaoImportar, modeloExcel, exportarExcel, Botao, INP } from './modais';

export function useAlvaras() {
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [legalizacoes, setLegalizacoes] = useState<Legalizacao[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaMin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(async () => {
    const [l, g] = await Promise.all([alvApi.licencas().catch(() => []), alvApi.legalizacoes().catch(() => [])]);
    setLicencas(l); setLegalizacoes(g); setCarregando(false);
  }, []);
  useEffect(() => { recarregar(); alvApi.empresas().then(setEmpresas).catch(() => undefined); }, [recarregar]);
  return { licencas, legalizacoes, empresas, carregando, recarregar, setLegalizacoes };
}

export default function PainelAlvaras() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'alvaras_operar');
  const navigate = useNavigate();
  const { licencas, legalizacoes, empresas, recarregar } = useAlvaras();
  const [editar, setEditar] = useState<Licenca | null | 'novo'>(null);
  const [corrigir, setCorrigir] = useState(false);
  const [filt, setFilt] = useState({ q: '', situacao: '', validade: '', ordem: 'validade' });
  const [mais, setMais] = useState({ venc: false, vencidas: false });

  const ativas = licencas.filter((l) => !l.inativo);
  const inativasQtd = licencas.length - ativas.length;
  const comValidade = ativas.filter((l) => l.validade);
  const validas = comValidade.filter((l) => (diasAte(l.validade) ?? -1) >= 0);
  const pct = comValidade.length ? Math.round((validas.length / comValidade.length) * 100) : 100;
  const vencidas = ativas.filter((l) => (diasAte(l.validade) ?? 0) < 0 && l.validade).sort((a, b) => (diasAte(a.validade)! - diasAte(b.validade)!));
  const aVencer = ativas.filter((l) => { const d = diasAte(l.validade); return d !== null && d >= 0 && d <= 30; }).sort((a, b) => diasAte(a.validade)! - diasAte(b.validade)!);
  const quadro = legalizacoes.filter((c) => !c.inativo && !c.ocultoNoIniciar);
  const emCurso = quadro.filter((c) => c.etapa !== 'Concluído').length;
  const emExig = ativas.filter((l) => l.situacao === 'Em exigência').length;

  const lista = useMemo(() => {
    const q = filt.q.trim().toLowerCase();
    const arr = ativas.filter((l) => {
      if (q && ![nomeLic(l), l.tipo, l.orgao, l.protocolo, situacaoEfetiva(l), l.responsavel, l.observacao].some((t) => (t ?? '').toLowerCase().includes(q))) return false;
      if (filt.situacao && situacaoEfetiva(l) !== filt.situacao) return false;
      const d = diasAte(l.validade);
      if (filt.validade === 'venc' && !(d !== null && d < 0)) return false;
      if (filt.validade === '30' && !(d !== null && d >= 0 && d <= 30)) return false;
      if (filt.validade === '90' && !(d !== null && d >= 0 && d <= 90)) return false;
      if (filt.validade === 'sem' && l.validade) return false;
      return true;
    });
    if (filt.ordem === 'validade') arr.sort((a, b) => (a.validade ?? '9999').localeCompare(b.validade ?? '9999') || nomeLic(a).localeCompare(nomeLic(b)));
    else arr.sort((a, b) => ((b.ultimaConclusao ?? b.emissao ?? '') || '').localeCompare((a.ultimaConclusao ?? a.emissao ?? '') || '') || nomeLic(a).localeCompare(nomeLic(b)));
    return arr;
  }, [ativas, filt]);

  const temFiltro = !!(filt.q || filt.situacao || filt.validade);
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Alvarás e licenças · {dataBR(hojeISO())}</div>
            <div className="text-lg font-semibold">Central de licenciamento</div>
            <div className="text-[12px] text-slate-300">{validas.length} de {comValidade.length} licença(s) com validade futura</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 'Vencidas', n: vencidas.length, d: vencidas.length ? 'ação imediata' : 'nenhuma vencida', c: COR.erro, ir: '/alvaras/vencimentos' },
            { t: 'Vencem em 30 dias', n: aVencer.length, d: aVencer.length ? 'renovar com urgência' : 'nada vencendo no mês', c: COR.aviso, ir: '/alvaras/vencimentos' },
            { t: 'Legalizações em curso', n: emCurso, d: emExig ? `${emExig} em exigência no órgão` : 'processos no Kanban', c: COR.info, ir: '/alvaras/kanban' },
          ].map((k) => (
            <button key={k.t} onClick={() => navigate(k.ir)} className="rounded bg-white/10 p-2 text-center hover:bg-white/20">
              <div className="text-[11px] text-slate-300">{k.t}</div><div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div><div className="text-[11px] text-slate-300">{k.d}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div><div className="font-semibold text-slate-700">Todos os alvarás e licenças</div><div className="text-[12px] text-slate-500">Carteira completa. Clique numa linha para abrir o registro.</div></div>
          <div className="flex flex-wrap gap-1.5">
            <Botao tipo="neutro" onClick={modeloExcel}><Download size={13} /> Modelo Excel</Botao>
            <Botao tipo="neutro" onClick={() => exportarExcel(licencas)}><Download size={13} /> Exportar</Botao>
            {podeOperar && <BotaoImportar onFeito={recarregar} />}
            {podeOperar && <Botao tipo="info" onClick={() => setCorrigir(true)}>⇄ Corrigir tipo</Botao>}
            {podeOperar && <Botao tipo="novo" onClick={() => setEditar('novo')}><Plus size={13} /> Novo registro</Botao>}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <input className={`${INP} w-64`} placeholder="Pesquisar" value={filt.q} onChange={(e) => setFilt({ ...filt, q: e.target.value })} />
          <select className={`${INP} w-48`} value={filt.situacao} onChange={(e) => setFilt({ ...filt, situacao: e.target.value })}><option value="">Todas as situações</option>{LIC_SITUACOES.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={`${INP} w-48`} value={filt.validade} onChange={(e) => setFilt({ ...filt, validade: e.target.value })}>
            <option value="">Todas as validades</option><option value="venc">Vencidas</option><option value="30">Vencem em 30 dias</option><option value="90">Vencem em 90 dias</option><option value="sem">Sem validade informada</option>
          </select>
          <select className={`${INP} w-56`} value={filt.ordem} onChange={(e) => setFilt({ ...filt, ordem: e.target.value })}>
            <option value="validade">Validade (mais próxima)</option><option value="concluido">Último processo feito (recente)</option>
          </select>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[800px] text-[13px]">
            <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Cliente</th><th>Licença / tipo</th><th>Protocolo / nº</th><th>Validade</th><th>Situação</th><th>Observações</th></tr></thead>
            <tbody>
              {lista.map((l) => {
                const d = diasAte(l.validade);
                return (
                  <tr key={l.id} onClick={() => setEditar(l)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-1.5"><div className="text-slate-700">{nomeLic(l)}</div>{filt.ordem === 'concluido' && <div className="text-[11px] text-slate-400">{l.ultimaConclusao || l.emissao ? `Concluído em ${dataBR((l.ultimaConclusao ?? l.emissao)!.slice(0, 10))}` : 'Sem conclusão registrada'}</div>}</td>
                    <td><div>{l.tipo}</div><div className="text-[11px] text-slate-400">{l.orgao ?? ''}</div></td>
                    <td className="text-slate-600">{l.protocolo || '—'}</td>
                    <td><div style={{ color: corValidade(l.validade), fontWeight: d !== null && d < 0 ? 600 : 400 }}>{dataBR(l.validade?.slice(0, 10))}</div>{d !== null && <div className="text-[11px] text-slate-400">{d < 0 ? `${-d} dia(s) vencida` : `${d} dia(s)`}</div>}</td>
                    <td><Selo cor={corSituacao(situacaoEfetiva(l))}>{situacaoEfetiva(l)}</Selo></td>
                    <td className="max-w-[240px] truncate text-slate-500">{(l.observacao ?? '').split('\n')[0]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-center text-[12px] text-slate-500">
          {temFiltro ? `${lista.length} de ${ativas.length} alvará(s) com os filtros aplicados.` : `${ativas.length} alvará(s) na carteira.`}
          {inativasQtd > 0 && ` ${inativasQtd} de empresa(s) inativa(s) fora da conta — em Vencimentos e renovações.`}
          {' '}<button className="text-marca-600 hover:underline" onClick={() => navigate('/alvaras/vencimentos')}>Abrir página completa ▸</button>
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between"><span className="font-semibold text-slate-700">Legalização por etapa</span><button className="text-[12px] text-marca-600 hover:underline" onClick={() => navigate('/alvaras/kanban')}>Abrir Kanban ▸</button></div>
        <div className="grid grid-cols-5 gap-2">
          {ETAPAS_LEGAL.map((e) => (
            <button key={e} onClick={() => navigate('/alvaras/kanban')} className="rounded border border-slate-200 p-2 text-center hover:bg-slate-50">
              <div className="text-xl font-semibold text-slate-700">{quadro.filter((c) => c.etapa === e).length}</div><div className="text-[11px] text-slate-500">{e}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card p-3">
          <div className="mb-2 font-semibold text-slate-700">Licenças a vencer (30 dias)</div>
          {aVencer.length === 0 && <div className="py-4 text-center text-slate-400">Nenhuma licença vence nos próximos 30 dias.</div>}
          {(mais.venc ? aVencer : aVencer.slice(0, 8)).map((l) => {
            const d = diasAte(l.validade)!;
            return (
              <button key={l.id} onClick={() => setEditar(l)} className="flex w-full items-center gap-2 border-b border-slate-100 py-1.5 text-left hover:bg-slate-50">
                <span className="h-2 w-2 rounded-full" style={{ background: d <= 15 ? COR.erro : COR.aviso }} />
                <span className="flex-1"><span className="text-slate-700">{nomeLic(l)}</span><span className="block text-[11px] text-slate-400">{l.tipo} · vence em {d} dia(s) ({dataBR(l.validade?.slice(0, 10))})</span></span>
              </button>
            );
          })}
          {aVencer.length > 8 && <button className="mt-1 text-[12px] text-marca-600 hover:underline" onClick={() => setMais((m) => ({ ...m, venc: !m.venc }))}>{mais.venc ? 'Ver menos' : `Ver mais (${aVencer.length - 8}) ▸`}</button>}
        </div>
        <div className="card p-3">
          <div className="mb-2 font-semibold" style={{ color: COR.erro }}>⚠ Alvarás vencidos</div>
          {vencidas.length === 0 && <div className="py-4 text-center text-slate-400">Nenhum alvará vencido.</div>}
          {vencidas.length > 0 && (
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-slate-500"><th>Cliente</th><th>Tipo</th><th>Órgão</th><th>Situação</th><th>Validade</th></tr></thead>
              <tbody>
                {(mais.vencidas ? vencidas : vencidas.slice(0, 8)).map((l) => (
                  <tr key={l.id} onClick={() => setEditar(l)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-1">{nomeLic(l)}</td><td>{l.tipo}</td><td>{l.orgao ?? '—'}</td><td><Selo cor={corSituacao(situacaoEfetiva(l))}>{situacaoEfetiva(l)}</Selo></td>
                    <td style={{ color: COR.erro }}>{dataBR(l.validade?.slice(0, 10))} (há {-diasAte(l.validade)!}d)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {vencidas.length > 8 && <button className="mt-1 text-[12px] text-marca-600 hover:underline" onClick={() => setMais((m) => ({ ...m, vencidas: !m.vencidas }))}>{mais.vencidas ? 'Ver menos' : `Ver mais (${vencidas.length - 8}) ▸`}</button>}
        </div>
      </div>

      <LicencaModal aberto={editar !== null} licenca={editar === 'novo' ? null : editar} empresas={empresas} onFechar={() => setEditar(null)} onSalvo={recarregar} podeOperar={podeOperar} />
      <CorrigirTipoModal aberto={corrigir} licencas={licencas} onFechar={() => setCorrigir(false)} onFeito={recarregar} />
    </div>
  );
}
