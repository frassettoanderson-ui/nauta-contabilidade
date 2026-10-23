// Situação Fiscal › Empresas — a carteira lida dos "Relatórios de Situação Fiscal" do e-CAC
// (o FiscalView do painel da Atuan): filtros, risco, ficha com resumo, débitos e certidão.
import { useMemo, useRef, useState } from 'react';
import { Download, Upload, X, Printer, Trash2, ChevronDown } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast, Modal } from '../../components/ui';
import { Botao, INP, erroMsg } from '../societario/modais';
import { Selo } from '../societario/Gestao';
import { xlsx } from '../alvaras/comum';
import {
  COR, fiscalApi, useFiscal, brl, rank, corRisco, corCertidao, dataBRparaDate, baixarCsv, hojeArq,
  type Relatorio, type Debito, type Parcelamento, type Pgfn, type ResultadoImport,
} from './comum';

type Ordem = { campo: keyof Relatorio; dir: 1 | -1 };

export default function EmpresasFiscal() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'ecac_operar');
  const { relatorios, carregando, recarregar } = useFiscal();
  const [f, setF] = useState({ q: '', risco: '', uf: '', origem: '', cert: '' });
  const [ordem, setOrdem] = useState<Ordem>({ campo: 'priority', dir: 1 });
  const [aberto, setAberto] = useState<Relatorio | null>(null);
  const [menuExp, setMenuExp] = useState(false);
  const imp = useImportador(recarregar);

  const ufs = useMemo(() => [...new Set(relatorios.map((x) => x.uf).filter(Boolean))].sort(), [relatorios]);
  const lista = useMemo(() => {
    const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const q = norm(f.q);
    const a = relatorios.filter((x) => (!q || norm(x.companyName + ' ' + x.cnpj).includes(q)) && (!f.risco || x.priority === f.risco) && (!f.uf || x.uf === f.uf)
      && (!f.cert || x.certificateType === f.cert)
      && (!f.origem || (f.origem === 'debt' && x.exigibleAmount) || (f.origem === 'susp' && x.suspendedAmount) || (f.origem === 'inst' && x.overdueInstallments) || (f.origem === 'pgfn' && x.pgfnCount)));
    const { campo, dir } = ordem;
    return a.sort((x, y) => campo === 'priority' ? (rank(x.priority) - rank(y.priority)) * dir
      : typeof x[campo] === 'number' ? ((x[campo] as number) - (y[campo] as number)) * dir
        : String(x[campo] ?? '').localeCompare(String(y[campo] ?? ''), 'pt-BR') * dir);
  }, [relatorios, f, ordem]);

  const total = relatorios.length;
  const criticas = relatorios.filter((x) => x.priority === 'Crítico').length;
  const atencao = relatorios.filter((x) => x.priority === 'Atenção').length;
  const exigivel = relatorios.reduce((s, x) => s + x.exigibleAmount, 0);
  const suspenso = relatorios.reduce((s, x) => s + x.suspendedAmount, 0);
  const parcelas = relatorios.reduce((s, x) => s + x.overdueInstallments, 0);
  const temFiltro = Object.values(f).some(Boolean);

  const TH = ({ campo, children }: { campo?: keyof Relatorio; children: React.ReactNode }) => (
    <th className={`py-1.5 pr-2 ${campo ? 'cursor-pointer select-none hover:text-marca-600' : ''}`}
      onClick={() => campo && setOrdem((o) => ({ campo, dir: o.campo === campo ? (-o.dir as 1 | -1) : 1 }))}>
      {children}{campo && ordem.campo === campo ? (ordem.dir === 1 ? ' ▲' : ' ▼') : ''}
    </th>
  );

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <RiscoAnel critico={criticas} atencao={atencao} total={total} />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Situação Fiscal · e-CAC</div>
            <div className="text-lg font-semibold">Carteira de empresas</div>
            <div className="text-[12px] text-slate-300">{total ? `${criticas} crítica(s), ${atencao} em atenção e ${total - criticas - atencao} regular(es)` : 'Nenhum CNPJ na base'}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { t: 'Empresas', n: String(total), d: 'relatórios lidos', c: '#fff' },
            { t: 'Débito exigível', n: brl(exigivel), d: suspenso ? `mais ${brl(suspenso)} suspenso/análise` : 'saldo consolidado', c: COR.erro },
            { t: 'Críticas', n: String(criticas), d: criticas && total ? `${Math.round((criticas / total) * 100)}% da carteira exige atuação` : 'sem empresas críticas', c: COR.erro },
            { t: 'Parcelas em atraso', n: String(parcelas), d: parcelas ? `em ${relatorios.filter((x) => x.overdueInstallments).length} empresa(s)` : 'nenhum parcelamento vencido', c: COR.aviso },
          ].map((k) => (
            <div key={k.t} className="rounded bg-white/10 p-2 text-center">
              <div className="text-[11px] text-slate-300">{k.t}</div><div className="text-lg font-semibold" style={{ color: k.c }}>{k.n}</div><div className="text-[11px] text-slate-300">{k.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div><div className="font-semibold text-slate-700">Carteira de empresas</div><div className="text-[12px] text-slate-500">Pesquisa, filtros e análise individual dos contribuintes. Clique numa empresa para abrir a análise.</div></div>
          <div className="flex flex-wrap gap-1.5">
            <div className="relative">
              <Botao tipo="neutro" onClick={() => setMenuExp((v) => !v)}><Download size={13} /> Exportar <ChevronDown size={12} /></Botao>
              {menuExp && (
                <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded border border-slate-200 bg-white text-slate-700 shadow-lg" onMouseLeave={() => setMenuExp(false)}>
                  <button className="block w-full px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setMenuExp(false); exportarExcel(relatorios); }}>Planilha Excel</button>
                  <button className="block w-full px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setMenuExp(false); exportarCsv(relatorios); }}>Resumo CSV</button>
                </div>
              )}
            </div>
            {podeOperar && <Botao tipo="novo" onClick={imp.escolher}><Upload size={13} /> Importar relatórios</Botao>}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <input className={`${INP} w-72`} placeholder="Pesquisar nome empresarial ou CNPJ" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
          <select className={`${INP} w-40`} value={f.risco} onChange={(e) => setF({ ...f, risco: e.target.value })}><option value="">Todos os riscos</option><option>Crítico</option><option>Atenção</option><option>Regular</option></select>
          <select className={`${INP} w-40`} value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })}><option value="">Todos os estados</option>{ufs.map((u) => <option key={u}>{u}</option>)}</select>
          <select className={`${INP} w-48`} value={f.origem} onChange={(e) => setF({ ...f, origem: e.target.value })}>
            <option value="">Todas as origens</option><option value="debt">Receita exigível</option><option value="susp">Suspenso ou análise</option><option value="inst">Parcelamentos</option><option value="pgfn">PGFN</option>
          </select>
          <select className={`${INP} w-56`} value={f.cert} onChange={(e) => setF({ ...f, cert: e.target.value })}>
            <option value="">Todas as certidões</option><option>Negativa</option><option>Positiva com efeitos de negativa</option><option>Positiva</option><option>Não identificada</option>
          </select>
          {temFiltro && <Botao tipo="cancelar" onClick={() => setF({ q: '', risco: '', uf: '', origem: '', cert: '' })}>Limpar</Botao>}
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500">
              <TH campo="companyName">Empresa</TH><TH campo="priority">Risco</TH><TH campo="exigibleAmount">Exigível</TH><TH campo="suspendedAmount">Suspenso/análise</TH>
              <TH campo="overdueInstallments">Parcelas</TH><TH campo="pgfnCount">PGFN</TH><TH campo="certificateType">Certidão</TH><TH campo="reportTimestamp">Relatório</TH><TH>Extração</TH>
            </tr></thead>
            <tbody>
              {lista.map((x) => (
                <tr key={x.id} onClick={() => setAberto(x)} className="cursor-pointer border-b border-slate-100 align-top hover:bg-slate-50">
                  <td className="py-1.5 pr-2"><div className="font-medium text-slate-700">{x.companyName}</div><div className="text-[11px] text-slate-400">{x.cnpj} · {x.municipality || 'Não identificado'}/{x.uf || '--'}</div></td>
                  <td className="pr-2"><Selo cor={corRisco(x.priority)}>{x.priority}</Selo></td>
                  <td className="pr-2"><div className="font-medium">{brl(x.exigibleAmount)}</div><div className="text-[11px] text-slate-400">{x.exigibleDebts.length} lançamento(s)</div></td>
                  <td className="pr-2"><div>{brl(x.suspendedAmount)}</div><div className="text-[11px] text-slate-400">{x.suspendedDebts.length} lançamento(s)</div></td>
                  <td className="pr-2">{x.overdueInstallments}</td>
                  <td className="pr-2"><Selo cor={x.pgfnCount ? '#7c5cbf' : COR.neutro}>{x.pgfnCount ? `${x.pgfnCount} inscrição(ões)` : 'Sem inscrição'}</Selo></td>
                  <td className="pr-2"><Selo cor={corCertidao(x.certificateType)}>{x.certificateType}</Selo><div className="text-[11px] text-slate-400">{x.certificateValidity ? `Validade: ${x.certificateValidity}` : 'Validade não identificada'}</div></td>
                  <td className="pr-2"><div>{x.reportDateTime || 'Não identificada'}</div><div className="max-w-[180px] truncate text-[11px] text-slate-400">{x.fileName}</div></td>
                  <td className="pr-2 text-slate-600">{x.qualityLabel} ({x.quality}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!carregando && !lista.length && (
            <div className="py-10 text-center text-slate-500">
              <div className="font-semibold text-slate-600">Nenhuma empresa encontrada</div>
              <div className="text-[12px]">Importe relatórios fiscais ou ajuste os filtros aplicados.</div>
              {podeOperar && !total && <Botao tipo="novo" className="mt-3" onClick={imp.escolher}><Upload size={13} /> Importar relatórios</Botao>}
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-between text-[12px] text-slate-500"><span>{lista.length} resultado(s) · {total} empresa(s) na base</span><span>Clique em uma empresa para abrir a análise</span></div>
      </div>

      {imp.elementos}
      {aberto && <FichaFiscal r={aberto} podeOperar={podeOperar} onFechar={() => setAberto(null)} onExcluido={() => { setAberto(null); recarregar(); }} />}
    </div>
  );
}

// Anel do risco (vermelho = crítico, amarelo = atenção, verde = regular), como no FiscalView
function RiscoAnel({ critico, atencao, total }: { critico: number; atencao: number; total: number }) {
  const t = total || 1, a = (critico / t) * 360, b = (atencao / t) * 360;
  const fundo = total ? `conic-gradient(${COR.erro} 0 ${a}deg, ${COR.aviso} ${a}deg ${a + b}deg, ${COR.ok} ${a + b}deg 360deg)` : '#e4e7ec';
  return (
    <div className="grid h-16 w-16 place-items-center rounded-full" style={{ background: fundo }}>
      <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-[15px] font-semibold text-slate-700">{total}</div>
    </div>
  );
}

// ─── Importação de PDFs (fila com andamento, como o FiscalView) ─────────────
export function useImportador(aoTerminar: () => void) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [lote, setLote] = useState<{ nomes: string[]; feitos: number; res: ResultadoImport | null; rodando: boolean } | null>(null);

  async function processar(arqs: File[]) {
    if (!arqs.length) return toast('erro', 'Nenhum arquivo foi selecionado.');
    setLote({ nomes: arqs.map((a) => a.name), feitos: 0, res: null, rodando: true });
    // lotes de 10 para o andamento andar (e não estourar o envio)
    const acum: ResultadoImport = { itens: [], total: 0, concluidos: 0, novos: 0, atualizados: 0, erros: 0 };
    try {
      for (let i = 0; i < arqs.length; i += 10) {
        const r = await fiscalApi.importar(arqs.slice(i, i + 10));
        acum.itens.push(...r.itens); acum.total = r.total; acum.concluidos += r.concluidos; acum.novos += r.novos; acum.atualizados += r.atualizados; acum.erros += r.erros;
        setLote({ nomes: arqs.map((a) => a.name), feitos: Math.min(arqs.length, i + 10), res: { ...acum }, rodando: true });
      }
      toast(acum.erros ? 'erro' : 'ok', acum.erros ? `${acum.concluidos} concluído(s) e ${acum.erros} erro(s).` : `${acum.concluidos} relatório(s) processado(s).`);
    } catch (e) { toast('erro', erroMsg(e)); }
    setLote((l) => (l ? { ...l, rodando: false, res: { ...acum } } : l));
    if (ref.current) ref.current.value = '';
    aoTerminar();
  }

  const elementos = (
    <>
      <input ref={ref} type="file" accept=".pdf,application/pdf" multiple hidden onChange={(e) => processar([...(e.target.files ?? [])])} />
      <Modal aberto={!!lote} titulo="Processando relatórios" onFechar={() => !lote?.rodando && setLote(null)} largura="max-w-2xl">
        {lote && (
          <div className="text-[13px]">
            <p className="mb-3 text-center text-slate-500">{lote.rodando ? 'Não feche esta janela durante a leitura.' : 'Leitura concluída.'}</p>
            <div className="mb-3 grid grid-cols-4 gap-2 text-center">
              {[['Total', lote.nomes.length], ['Concluídos', lote.res?.concluidos ?? 0], ['Atualizados', lote.res?.atualizados ?? 0], ['Erros', lote.res?.erros ?? 0]].map(([t, n]) => (
                <div key={t} className="rounded border border-slate-200 p-2"><div className="text-[11px] text-slate-500">{t}</div><div className="text-lg font-semibold text-slate-700">{n}</div></div>
              ))}
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-marca-500 transition-all" style={{ width: `${Math.round((lote.feitos / lote.nomes.length) * 100)}%` }} /></div>
            <div className="max-h-72 space-y-1 overflow-auto">
              {lote.nomes.map((n, i) => {
                const it = lote.res?.itens.find((x) => x.arquivo === n);
                const cor = !it ? COR.neutro : it.status === 'error' ? COR.erro : it.status === 'ignored' ? COR.aviso : COR.ok;
                return (
                  <div key={n + i} className="flex items-center gap-2 rounded border border-slate-100 px-2 py-1">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: cor }}>{!it ? i + 1 : it.status === 'error' ? '!' : '✓'}</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-slate-700">{n}</div><div className="truncate text-[11px] text-slate-500">{it ? it.mensagem : i < lote.feitos ? 'Lendo e analisando' : 'Aguardando'}</div></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center"><Botao tipo="cancelar" disabled={lote.rodando} onClick={() => setLote(null)}>Fechar</Botao></div>
          </div>
        )}
      </Modal>
    </>
  );
  return { escolher: () => ref.current?.click(), processar, elementos };
}

// ─── Ficha da empresa (o "drawer" do FiscalView) ────────────────────────────
function FichaFiscal({ r, podeOperar, onFechar, onExcluido }: { r: Relatorio; podeOperar: boolean; onFechar: () => void; onExcluido: () => void }) {
  const toast = useToast();
  const [aba, setAba] = useState<'resumo' | 'debitos' | 'dados'>('resumo');
  const [confirmar, setConfirmar] = useState(false);
  const validade = dataBRparaDate(r.certificateValidity);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = validade ? Math.ceil((validade.getTime() - hoje.getTime()) / 86400000) : null;

  async function excluir() {
    try { await fiscalApi.excluir(r.id); toast('ok', 'Empresa excluída.'); onExcluido(); }
    catch (e) { toast('erro', erroMsg(e)); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onFechar}>
      <aside className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl print:max-w-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-800">{r.companyName}</h2>
            <p className="text-[12px] text-slate-500">{r.cnpj} · {r.municipality || 'Não identificado'}/{r.uf || '--'} · Relatório de {r.reportDateTime || 'data não identificada'}</p>
          </div>
          <div className="flex shrink-0 gap-1.5 print:hidden">
            <Botao tipo="neutro" onClick={() => window.print()}><Printer size={13} /> Imprimir</Botao>
            {podeOperar && <Botao tipo="excluir" onClick={() => setConfirmar(true)}><Trash2 size={13} /> Excluir</Botao>}
            <button onClick={onFechar} className="px-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
        </div>
        <div className="flex gap-1 border-b border-slate-200 px-4 print:hidden">
          {([['resumo', 'Resumo executivo'], ['debitos', 'Débitos por grupo'], ['dados', 'Cadastro e certidão']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setAba(k)} className={`border-b-2 px-3 py-2 text-[13px] ${aba === k ? 'border-marca-500 font-semibold text-marca-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[13px]">
          {aba === 'resumo' && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border p-3" style={{ borderColor: corRisco(r.priority) + '66', background: corRisco(r.priority) + '14' }}>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-bold text-white" style={{ background: corRisco(r.priority) }}>{r.priority === 'Crítico' ? '!' : r.priority === 'Atenção' ? 'i' : '✓'}</div>
                <div><div className="font-semibold text-slate-800">Classificação: {r.priority}</div><p className="text-slate-600">{r.summary} Motivos: {r.reasons.join(', ')}.</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[['Exigível', brl(r.exigibleAmount)], ['Suspenso/análise', brl(r.suspendedAmount)], ['Parcelas', String(r.overdueInstallments)], ['PGFN', String(r.pgfnCount)]].map(([t, v]) => (
                  <div key={t} className="rounded border border-slate-200 p-2 text-center"><div className="text-[11px] text-slate-500">{t}</div><div className="text-[15px] font-semibold text-slate-800">{v}</div></div>
                ))}
              </div>
              <Secao titulo="Certidão fiscal" />
              <div className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div><div className="font-semibold text-slate-800">{r.certificateType}</div><div className="text-[12px] text-slate-500">Emissão: {r.certificateIssue || 'não identificada'} · Validade: {r.certificateValidity || 'não identificada'}</div></div>
                <div className="text-center"><div className="text-xl font-semibold" style={{ color: dias === null ? COR.neutro : dias < 0 ? COR.erro : COR.ok }}>{dias === null ? '—' : Math.abs(dias)}</div><div className="text-[11px] text-slate-500">{dias === null ? 'dias não calculados' : dias < 0 ? 'dias vencida' : 'dias restantes'}</div></div>
              </div>
              <Secao titulo="Controle" />
              <Grade itens={[['Data do relatório', r.reportDateTime], ['Arquivo', r.fileName], ['Qualidade da extração', `${r.qualityLabel} · ${r.quality}%`], ['Importado em', r.importedAt ? new Date(r.importedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '']]} />
            </div>
          )}
          {aba === 'debitos' && (
            <div className="space-y-2">
              <Grupo sigla="RF" nome="Receita Federal · débitos exigíveis" sub={`${r.exigibleDebts.length} lançamento(s)`} valor={brl(r.exigibleAmount)} aberto={!!r.exigibleDebts.length}><TabelaDebitos a={r.exigibleDebts} /></Grupo>
              <Grupo sigla="S" nome="Receita Federal · suspensos, a vencer ou em análise" sub={`${r.suspendedDebts.length} lançamento(s)`} valor={brl(r.suspendedAmount)} aberto={!!r.suspendedDebts.length}><TabelaDebitos a={r.suspendedDebts} /></Grupo>
              <Grupo sigla="P" nome="Parcelamentos" sub={`${r.overdueInstallments} parcela(s) em atraso`} valor={r.installmentSuspended ? `${brl(r.installmentSuspended)} suspenso` : `${r.installmentGroups.length} modalidade(s)`} aberto={!!r.installmentGroups.length}><TabelaParcelamentos a={r.installmentGroups} /></Grupo>
              <Grupo sigla="PG" nome="PGFN · dívida ativa da União" sub={`${r.pgfnCount} inscrição(ões)`} valor={r.pgfnActiveItems?.length ? 'Atuação prioritária' : r.pgfnCount ? 'Exigibilidade suspensa' : 'Sem inscrição'} aberto={!!r.pgfnCount}><TabelaPgfn a={r.pgfnItems} clear={r.pgfnClear} /></Grupo>
            </div>
          )}
          {aba === 'dados' && (
            <div className="space-y-4">
              <Secao titulo="Identificação" primeiro />
              <Grade itens={[['Nome empresarial', r.companyName], ['CNPJ', r.cnpj], ['Situação cadastral', r.cadastralStatus], ['Data de abertura', r.openingDate], ['Natureza jurídica', r.legalNature], ['Porte', r.companySize]]} />
              <Secao titulo="Atividade e localização" />
              <Grade itens={[['CNAE', r.cnae], ['Município/UF', `${r.municipality || 'Não informado'}/${r.uf || '--'}`], ['Endereço', r.address], ['Bairro e CEP', `${r.district || 'Não informado'} · ${r.zipCode || 'CEP não informado'}`], ['Responsável', r.responsible], ['Regime', `Simples: ${r.simples} · SIMEI: ${r.simei}`]]} />
              <Secao titulo="Certidão emitida" />
              <Grade itens={[['Tipo', r.certificateType], ['Código', r.certificateCode], ['Emissão', r.certificateIssue], ['Validade', r.certificateValidity]]} />
            </div>
          )}
        </div>
      </aside>
      <Modal aberto={confirmar} titulo={`Excluir ${r.companyName}?`} onFechar={() => setConfirmar(false)}>
        <p className="text-center text-slate-600">Sai do Obrigô o que foi lido do relatório desta empresa. O cadastro da empresa não é tocado; o relatório volta na próxima puxada do e-CAC.</p>
        <div className="mt-4 flex justify-center gap-2"><Botao tipo="cancelar" onClick={() => setConfirmar(false)}>Cancelar</Botao><Botao tipo="excluir" onClick={excluir}>Excluir</Botao></div>
      </Modal>
    </div>
  );
}

const Secao = ({ titulo, primeiro }: { titulo: string; primeiro?: boolean }) => <div className={`text-[12px] font-semibold uppercase tracking-wide text-slate-500 ${primeiro ? '' : 'pt-1'}`}>{titulo}</div>;
function Grade({ itens }: { itens: [string, string | undefined][] }) {
  return <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{itens.map(([l, v]) => <div key={l} className="rounded border border-slate-100 bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-500">{l}</div><div className="font-medium text-slate-700">{v || 'Não informado'}</div></div>)}</div>;
}
function Grupo({ sigla, nome, sub, valor, aberto, children }: { sigla: string; nome: string; sub: string; valor: string; aberto: boolean; children: React.ReactNode }) {
  return (
    <details open={aberto} className="rounded border border-slate-200">
      <summary className="flex cursor-pointer items-center gap-3 px-3 py-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded text-[11px] font-semibold text-white" style={{ background: COR.marinho }}>{sigla}</span>
        <span className="min-w-0 flex-1"><span className="block font-semibold text-slate-700">{nome}</span><span className="block text-[11px] text-slate-500">{sub}</span></span>
        <span className="font-semibold text-slate-700">{valor}</span><ChevronDown size={14} className="text-slate-400" />
      </summary>
      <div className="border-t border-slate-100 p-2">{children}</div>
    </details>
  );
}
const Vazio = ({ t }: { t: string }) => <div className="py-4 text-center text-[12px] text-slate-400">{t}</div>;
function TabelaDebitos({ a }: { a: Debito[] }) {
  if (!a.length) return <Vazio t="Nenhum item identificado neste grupo." />;
  return (
    <div className="overflow-auto"><table className="w-full min-w-[640px] text-[12px]">
      <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-1">Descrição</th><th>Período</th><th>Vencimento</th><th className="text-right">Original</th><th className="text-right">Consolidado</th><th className="pl-2">Situação</th></tr></thead>
      <tbody>{a.map((d, i) => (
        <tr key={i} className="border-b border-slate-100 align-top"><td className="py-1"><div className="font-medium text-slate-700">{d.description}</div>{d.note && <div className="text-[11px] text-slate-400">{d.note}</div>}</td>
          <td>{d.reference || '—'}</td><td>{d.dueDate || '—'}</td><td className="text-right">{brl(d.original)}</td><td className="text-right font-medium">{brl(d.amount)}</td><td className="pl-2"><Selo cor={COR.neutro}>{d.status}</Selo></td></tr>
      ))}</tbody>
    </table></div>
  );
}
function TabelaParcelamentos({ a }: { a: Parcelamento[] }) {
  if (!a.length) return <Vazio t="Nenhum parcelamento identificado." />;
  return (
    <div className="overflow-auto"><table className="w-full min-w-[600px] text-[12px]">
      <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-1">Modalidade</th><th>Sistema</th><th>Situação</th><th className="text-right">Parc. atraso</th><th className="text-right">Valor</th></tr></thead>
      <tbody>{a.map((d, i) => {
        const cond = d.suspended ? 'Exigibilidade suspensa' : d.count > 0 ? 'Em atraso' : 'Em parcelamento';
        const cor = d.suspended ? COR.neutro : d.count > 0 ? COR.erro : COR.aviso;
        const val = d.suspendedValue ? brl(d.suspendedValue) : d.atrasoValue ? brl(d.atrasoValue) : '—';
        return (
          <tr key={i} className="border-b border-slate-100 align-top"><td className="py-1"><div className="font-medium text-slate-700">{d.name}</div>{d.modality && <div className="text-[11px] text-slate-400">{d.modality}</div>}{d.note && <div className="text-[11px] text-slate-400">{d.note}</div>}</td>
            <td>{d.system || '—'}</td><td><Selo cor={cor}>{cond}</Selo></td><td className="text-right">{d.count || 0}</td><td className="text-right">{val}</td></tr>
        );
      })}</tbody>
    </table></div>
  );
}
function TabelaPgfn({ a, clear }: { a: Pgfn[]; clear: boolean }) {
  if (!a.length) return <Vazio t={clear ? 'O relatório informa que não há pendências na PGFN.' : 'Nenhuma inscrição foi identificada.'} />;
  return (
    <div className="overflow-auto"><table className="w-full min-w-[600px] text-[12px]">
      <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-1">Inscrição</th><th>Receita/Origem</th><th>Processo</th><th>Situação</th></tr></thead>
      <tbody>{a.map((d, i) => (
        <tr key={i} className="border-b border-slate-100 align-top"><td className="py-1"><div className="font-medium text-slate-700">{d.number}</div>{d.system && <div className="text-[11px] text-slate-400">{d.system}</div>}</td>
          <td>{d.source}</td><td>{d.process || '—'}</td><td><Selo cor={d.suspended ? COR.neutro : COR.erro}>{d.status}</Selo></td></tr>
      ))}</tbody>
    </table></div>
  );
}

// ─── Exportações (mesmas colunas do FiscalView) ─────────────────────────────
function exportarCsv(rs: Relatorio[]) {
  if (!rs.length) return;
  const n2 = (v: number) => v.toFixed(2).replace('.', ',');
  baixarCsv([['Nome empresarial', 'CNPJ', 'Município', 'UF', 'Risco', 'Exigível', 'Suspenso/análise', 'Parcelas', 'PGFN', 'Certidão', 'Validade', 'Relatório'],
    ...rs.map((x) => [x.companyName, x.cnpj, x.municipality, x.uf, x.priority, n2(x.exigibleAmount), n2(x.suspendedAmount), x.overdueInstallments, x.pgfnCount, x.certificateType, x.certificateValidity, x.reportDateTime])],
  `SituacaoFiscal_Resumo_${hojeArq()}.csv`);
}
async function exportarExcel(rs: Relatorio[]) {
  if (!rs.length) return;
  const X = await xlsx();
  const wb = X.utils.book_new();
  const aba = (nome: string, cab: string[], linhas: (string | number)[][]) => X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([cab, ...linhas]), nome);
  aba('Empresas', ['Empresa', 'CNPJ', 'Município', 'UF', 'Risco', 'Exigível', 'Suspenso', 'Parcelas', 'PGFN', 'Certidão', 'Validade', 'Relatório'],
    rs.map((x) => [x.companyName, x.cnpj, x.municipality, x.uf, x.priority, x.exigibleAmount, x.suspendedAmount, x.overdueInstallments, x.pgfnCount, x.certificateType, x.certificateValidity, x.reportDateTime]));
  aba('Débitos', ['Empresa', 'CNPJ', 'Grupo', 'Descrição', 'Período', 'Vencimento', 'Original', 'Consolidado', 'Situação'],
    rs.flatMap((x) => [...x.exigibleDebts.map((d) => [x.companyName, x.cnpj, 'Receita exigível', d.description, d.reference, d.dueDate, d.original, d.amount, d.status]), ...x.suspendedDebts.map((d) => [x.companyName, x.cnpj, 'Suspenso/análise', d.description, d.reference, d.dueDate, d.original, d.amount, d.status])]));
  aba('Parcelamentos', ['Empresa', 'CNPJ', 'Modalidade', 'Parcelas'], rs.flatMap((x) => x.installmentGroups.map((d) => [x.companyName, x.cnpj, d.name, d.count])));
  aba('PGFN', ['Empresa', 'CNPJ', 'Inscrição', 'Receita', 'Processo', 'Situação'], rs.flatMap((x) => x.pgfnItems.map((d) => [x.companyName, x.cnpj, d.number, d.source, d.process ?? '', d.status])));
  X.writeFile(wb, `SituacaoFiscal_Consolidado_${hojeArq()}.xlsx`);
}

