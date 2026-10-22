// Alvaras › Vencimentos e renovacoes — carteira completa: protocolo, validade e situacao de cada licenca.
import { useMemo, useState } from 'react';
import { Plus, Download, RefreshCw } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { Selo } from '../societario/Gestao';
import { COR, LIC_SITUACOES, alvApi, nomeLic, diasAte, dataBR, situacaoEfetiva, corSituacao, corValidade, type Licenca } from './comum';
import { LicencaModal, CorrigirTipoModal, InativarModal, BotaoImportar, modeloExcel, exportarExcel, Botao, INP, erroMsg } from './modais';
import { useAlvaras } from './Painel';

type Col = 'cliente' | 'tipo' | 'protocolo' | 'validade' | 'situacao' | 'observacao';

export default function VencimentosAlvaras() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'alvaras_operar');
  const toast = useToast();
  const { licencas, legalizacoes, empresas, recarregar } = useAlvaras();
  const [editar, setEditar] = useState<Licenca | null | 'novo'>(null);
  const [corrigir, setCorrigir] = useState(false);
  const [inativar, setInativar] = useState<{ empresaId: string; nome: string; inativo: boolean } | null>(null);
  const [filt, setFilt] = useState({ q: '', situacao: '', validade: '', inativas: false });
  const [ordem, setOrdem] = useState<{ col: Col; asc: boolean }>({ col: 'validade', asc: true });

  const ativas = licencas.filter((l) => !l.inativo);
  const vencidasN = ativas.filter((l) => (diasAte(l.validade) ?? 0) < 0 && l.validade).length;
  const vencem30 = ativas.filter((l) => { const d = diasAte(l.validade); return d !== null && d >= 0 && d <= 30; }).length;
  const inativasOcultas = licencas.filter((l) => l.inativo).length;

  const lista = useMemo(() => {
    const q = filt.q.trim().toLowerCase();
    const val = (l: Licenca): string => ({ cliente: nomeLic(l), tipo: l.tipo, protocolo: l.protocolo ?? '', validade: l.validade?.slice(0, 10) || '9999-12-31', situacao: situacaoEfetiva(l), observacao: l.observacao ?? '' }[ordem.col]);
    return licencas
      .filter((l) => filt.inativas || !l.inativo)
      .filter((l) => !q || [nomeLic(l), l.tipo, l.orgao, l.protocolo, l.observacao].some((t) => (t ?? '').toLowerCase().includes(q)))
      .filter((l) => !filt.situacao || situacaoEfetiva(l) === filt.situacao)
      .filter((l) => {
        const d = diasAte(l.validade);
        if (filt.validade === 'venc') return d !== null && d < 0;
        if (filt.validade === '30') return d !== null && d >= 0 && d <= 30;
        if (filt.validade === '60') return d !== null && d >= 0 && d <= 60;
        return true;
      })
      .sort((a, b) => val(a).localeCompare(val(b), 'pt-BR', { numeric: true }) * (ordem.asc ? 1 : -1));
  }, [licencas, filt, ordem]);

  const th = (col: Col, t: string) => (
    <th className="cursor-pointer select-none py-1.5 hover:text-marca-600" onClick={() => setOrdem((o) => ({ col, asc: o.col === col ? !o.asc : true }))}>
      {t}{ordem.col === col ? (ordem.asc ? ' ↓' : ' ↑') : ''}
    </th>
  );
  async function renovar(l: Licenca) {
    if (!l.validade) return toast('erro', 'Cadastre a validade antes de renovar.');
    const nova = new Date(`${l.validade.slice(0, 10)}T00:00:00Z`); nova.setUTCFullYear(nova.getUTCFullYear() + 1);
    if (!confirm(`Renovar ${nomeLic(l)} — ${l.tipo} até ${dataBR(nova.toISOString().slice(0, 10))}?`)) return;
    try { await alvApi.renovar(l.id); toast('ok', 'Licença renovada por mais 1 ano.'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function kanban(l: Licenca) {
    try { await alvApi.paraKanban(l.id); toast('ok', 'Renovação enviada ao Kanban (Consulta / protocolo).'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function salvarObs(l: Licenca, v: string) {
    if (v === (l.observacao ?? '')) return;
    try { await alvApi.obsLicenca(l.id, v); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold text-slate-700">Vencimentos e renovações</div>
          <div className="text-[12px] text-slate-500">Mantendo a validade atualizada (↻ +1 ano), cada licença volta aos alertas na mesma data do ano seguinte.</div>
        </div>
        <div className="flex gap-2">
          <Selo cor={COR.info}>{ativas.length} licenças ativas</Selo>
          <Selo cor={vencidasN ? COR.erro : COR.neutro}>{vencidasN} vencidas</Selo>
          <Selo cor={vencem30 ? COR.aviso : COR.neutro}>{vencem30} vencem em 30 dias</Selo>
        </div>
      </div>
      <div className="card p-3">
        <div className="mb-2 flex flex-wrap justify-center gap-1.5">
          <Botao tipo="neutro" onClick={modeloExcel}><Download size={13} /> Modelo Excel</Botao>
          <Botao tipo="neutro" onClick={() => exportarExcel(licencas)}><Download size={13} /> Exportar</Botao>
          {podeOperar && <BotaoImportar onFeito={recarregar} />}
          {podeOperar && <Botao tipo="info" onClick={() => setCorrigir(true)}>⇄ Corrigir tipo</Botao>}
          {podeOperar && <Botao tipo="novo" onClick={() => setEditar('novo')}><Plus size={13} /> Novo registro</Botao>}
        </div>
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <input className={`${INP} w-64`} placeholder="Pesquisar" value={filt.q} onChange={(e) => setFilt({ ...filt, q: e.target.value })} />
          <select className={`${INP} w-48`} value={filt.situacao} onChange={(e) => setFilt({ ...filt, situacao: e.target.value })}><option value="">Todas as situações</option>{LIC_SITUACOES.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={`${INP} w-44`} value={filt.validade} onChange={(e) => setFilt({ ...filt, validade: e.target.value })}>
            <option value="">Todas as validades</option><option value="venc">Vencidas</option><option value="30">Vencem em 30 dias</option><option value="60">Vencem em 60 dias</option>
          </select>
          <select className={`${INP} w-48`} value={filt.inativas ? 'sim' : ''} onChange={(e) => setFilt({ ...filt, inativas: !!e.target.value })}>
            <option value="">Empresas inativas: ocultar</option><option value="sim">Empresas inativas: mostrar</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500">
              {th('cliente', 'Cliente')}{th('tipo', 'Licença / tipo')}{th('protocolo', 'Protocolo / nº')}{th('validade', 'Validade')}{th('situacao', 'Situação')}{th('observacao', 'Observações')}<th />
            </tr></thead>
            <tbody>
              {lista.map((l) => {
                const d = diasAte(l.validade);
                return (
                  <tr key={l.id} className={`border-b border-slate-100 ${l.inativo ? 'opacity-60' : ''}`}>
                    <td className="py-1.5"><div className="text-slate-700">{nomeLic(l)} {l.inativo && <Selo cor={COR.aviso}>inativa</Selo>}</div>
                      <div className="text-[11px] text-slate-400">{l.orgao ?? ''}{l.inativo ? ` · ${l.inativoMotivo ?? ''} · ${dataBR(l.inativoEm?.slice(0, 10))}` : ''}</div></td>
                    <td>{l.tipo}</td>
                    <td className="text-slate-600">{l.protocolo || '—'}</td>
                    <td><Selo cor={corValidade(l.validade)}>{l.validade ? `${dataBR(l.validade.slice(0, 10))}${d !== null ? ` · ${d < 0 ? `há ${-d}d` : `${d}d`}` : ''}` : 'sem validade'}</Selo></td>
                    <td><Selo cor={corSituacao(situacaoEfetiva(l))}>{situacaoEfetiva(l)}</Selo></td>
                    <td><input className={`${INP} min-w-[180px]`} defaultValue={l.observacao ?? ''} disabled={!podeOperar} onBlur={(e) => salvarObs(l, e.target.value)} key={l.observacao ?? ''} /></td>
                    <td className="space-x-1 whitespace-nowrap text-right">
                      {podeOperar && <Botao tipo="salvar" title="Renovar +1 ano" onClick={() => renovar(l)}><RefreshCw size={12} /> +1 ano</Botao>}
                      <Botao tipo="info" onClick={() => setEditar(l)}>Abrir</Botao>
                      {podeOperar && <Botao tipo="novo" onClick={() => kanban(l)}>→ Kanban</Botao>}
                      {podeOperar && l.empresaId && <Botao tipo="neutro" title={l.inativo ? 'Reativar empresa' : 'Inativar empresa'} onClick={() => setInativar({ empresaId: l.empresaId!, nome: nomeLic(l), inativo: l.inativo })}>{l.inativo ? '▶' : '⏸'}</Botao>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-center text-[12px] text-slate-500">
          {lista.length} de {licencas.length} registro(s).{!filt.inativas && inativasOcultas > 0 && ` ${inativasOcultas} de empresa(s) inativa(s) oculto(s) — mude o filtro para ver e reativar.`}
        </div>
      </div>
      <LicencaModal aberto={editar !== null} licenca={editar === 'novo' ? null : editar} empresas={empresas} onFechar={() => setEditar(null)} onSalvo={recarregar} podeOperar={podeOperar} />
      <CorrigirTipoModal aberto={corrigir} licencas={licencas} onFechar={() => setCorrigir(false)} onFeito={recarregar} />
      <InativarModal alvo={inativar} onFechar={() => setInativar(null)} onFeito={recarregar} licencas={licencas} legalizacoes={legalizacoes} />
    </div>
  );
}
