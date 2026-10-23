// Situação Fiscal › Puxar do e-CAC — escolhe os clientes, manda para o robô (ponte ecac-bridge),
// acompanha o andamento e importa os PDFs que voltam. Também: parar robô, limpar fila, reimportar.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Square, Trash2, RotateCcw, Upload } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { Botao, INP, erroMsg } from '../societario/modais';
import { Selo } from '../societario/Gestao';
import { Anel } from '../societario/Kanban';
import {
  COR, GRUPOS, ORDEM_GRUPOS, fiscalApi, useFiscal, digits, fmtCnpj, soData, dataHora, diasAtras, falhasDoJob, mapaUltimoPuxado, baixarCsv, hojeArq, espera,
  type JobRobo, type Grupo, type Relatorio, type EmpresaCarteira,
} from './comum';

// ─── Relatório de acessos (pé da tela de puxar e tela própria) ──────────────
export function useExecucoes() {
  const [execucoes, setExecucoes] = useState<JobRobo[]>([]);
  const [erro, setErro] = useState('');
  const [carregado, setCarregado] = useState(false);
  const recarregar = useCallback(() => fiscalApi.jobs().then((j) => { setExecucoes(j ?? []); setErro(''); }).catch((e) => setErro(erroMsg(e))).finally(() => setCarregado(true)), []);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { execucoes, erro, carregado, recarregar };
}

export function RelatorioAcessos({ titulo = 'Relatório de acessos', execucoes, erro, carregado, recarregar, nomePorCnpj, podeOperar, aoReimportar }: {
  titulo?: string; execucoes: JobRobo[]; erro: string; carregado: boolean; recarregar: () => void; nomePorCnpj: (c: string) => string; podeOperar: boolean; aoReimportar: () => void;
}) {
  const toast = useToast();
  const [reimp, setReimp] = useState<string | null>(null);
  function csv() {
    const linhas: string[][] = [['Execução', 'Pedido por', 'CNPJ', 'Cliente', 'Motivo']];
    execucoes.forEach((j) => falhasDoJob(j, nomePorCnpj).forEach((f) => linhas.push([dataHora(j.created), j.by || 'painel', f.cnpj, f.nome || '(fora da carteira)', f.motivo])));
    if (linhas.length === 1) return toast('erro', 'Nenhuma falha de acesso registrada.');
    baixarCsv(linhas, `Acessos_eCAC_${hojeArq()}.csv`);
    toast('ok', `${linhas.length - 1} falha(s) exportada(s).`);
  }
  async function reimportar(j: JobRobo) {
    setReimp(j.id);
    try {
      const r = await fiscalApi.importarDoRobo((j.pdfs || []).map((nome) => ({ jobId: j.id, nome })));
      toast('ok', `${r.baixados ?? r.concluidos} relatório(s) reimportado(s) — ${r.novos} novo(s) · ${r.total} empresa(s) no Obrigô.`);
      aoReimportar();
    } catch (e) { toast('erro', `Não deu para reimportar: ${erroMsg(e)}`); }
    setReimp(null);
  }
  return (
    <div className="card p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div><div className="font-semibold text-slate-700">{titulo}</div><div className="text-[12px] text-slate-500">O que o robô conseguiu puxar em cada execução e, principalmente, quem ficou de fora — com o motivo. Guarda os últimos 15 pedidos.</div></div>
        <div className="flex gap-1.5"><Botao tipo="neutro" onClick={csv}><Download size={13} /> Baixar .csv</Botao><Botao tipo="info" onClick={() => { recarregar(); toast('ok', 'Execuções atualizadas.'); }}><RefreshCw size={13} /> Atualizar</Botao></div>
      </div>
      {erro ? <div className="py-6 text-center text-slate-500">Não foi possível ler as execuções: {erro}</div>
        : !carregado ? <div className="py-6 text-center text-slate-400">Carregando…</div>
          : !execucoes.length ? <div className="py-6 text-center text-slate-500">Nenhuma execução registrada ainda. Puxe os relatórios de alguns clientes e o resultado aparece aqui.</div>
            : (
              <div className="space-y-2">
                {execucoes.map((j, i) => {
                  const falhas = falhasDoJob(j, nomePorCnpj);
                  const baixados = Number(j.summary?.baixados || (j.pdfs || []).length) || 0;
                  const total = Number(j.summary?.total || j.total) || 0;
                  const mudos = Math.max(0, total - baixados - falhas.length);
                  return (
                    <div key={j.id} className={`rounded border p-2 ${j.status !== 'done' ? 'border-sky-200 bg-sky-50/40' : 'border-slate-200'}`}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-slate-700">{dataHora(j.created)}</span>
                        <Selo cor={falhas.length ? COR.aviso : COR.ok}>{baixados} de {total} baixado(s)</Selo>
                        {!!falhas.length && <Selo cor={COR.erro}>{falhas.length} sem acesso</Selo>}
                        {!!mudos && <Selo cor={COR.neutro}>{mudos} sem retorno</Selo>}
                        {j.status !== 'done' && <Selo cor={COR.info}>em andamento</Selo>}
                        <span className="ml-auto text-[11px] text-slate-400">pedido por {j.by || 'painel'}</span>
                      </div>
                      {podeOperar && !!(j.pdfs || []).length && (
                        <div className="mt-1.5"><Botao tipo="neutro" disabled={!!reimp} onClick={() => reimportar(j)}><RotateCcw size={12} /> {reimp === j.id ? 'Importando…' : `Reimportar ${(j.pdfs || []).length} relatório(s)`}</Botao></div>
                      )}
                      {falhas.length ? (
                        <div className="mt-1.5 divide-y divide-slate-100 rounded border border-slate-100">
                          {falhas.map((f, k) => (
                            <div key={k} className="flex items-center gap-2 px-2 py-1">
                              <div className="min-w-0 flex-1"><div className="truncate text-slate-700">{f.nome || '(fora da carteira)'}</div><div className="text-[11px] text-slate-400">{f.cnpj}</div></div>
                              <span className="text-[12px] text-red-700" title={f.motivoBruto}>{f.motivo}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="mt-1.5 text-[12px] text-slate-500">Todos os selecionados foram acessados.</p>}
                      {i === 0 && !!mudos && <p className="mt-1.5 text-[12px] text-slate-500">Os &quot;sem retorno&quot; são CNPJs que o robô não baixou e também não justificou — vale repetir o pedido só para eles.</p>}
                    </div>
                  );
                })}
              </div>
            )}
    </div>
  );
}

// nome do cliente pelo CNPJ (quem não está na carteira aparece sem nome)
export function useNomePorCnpj(carteira: EmpresaCarteira[]) {
  return useMemo(() => { const m = new Map(carteira.map((e) => [e.cnpj, e.nome])); return (c: string) => m.get(digits(c)) ?? ''; }, [carteira]);
}

type Coluna = 'nome' | 'data' | 'sit' | 'grupo';

export default function PuxarEcac() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'ecac_operar');
  const toast = useToast();
  const navigate = useNavigate();
  const { carteira, relatorios, recarregar } = useFiscal();
  const ex = useExecucoes();
  const nomePorCnpj = useNomePorCnpj(carteira);
  const [situacoes, setSituacoes] = useState<Record<string, { sit: string }>>({});
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | Grupo>('todos');
  const [ordem, setOrdem] = useState<{ k: Coluna; asc: boolean }>({ k: 'nome', asc: true });
  const [estado, setEstado] = useState<{ html: React.ReactNode; tipo: 'andando' | 'pronto' | 'erro' | 'aviso' } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { fiscalApi.situacoes().then((m) => setSituacoes(m ?? {})).catch(() => undefined); }, []);
  const lista = useMemo(() => carteira.filter((e) => e.cnpj.length === 14), [carteira]);
  const ultimos = useMemo(() => mapaUltimoPuxado(ex.execucoes, relatorios as Relatorio[]), [ex.execucoes, relatorios]);
  const contar = (g: 'todos' | Grupo) => lista.filter((e) => g === 'todos' || e.grupo === g).length;
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase(), qd = digits(q);
    const valor = (e: EmpresaCarteira, k: Coluna): string | number => k === 'data' ? ultimos[e.cnpj]?.ms ?? 0 : k === 'sit' ? situacoes[e.cnpj]?.sit ?? '' : k === 'grupo' ? GRUPOS[e.grupo] : e.nome;
    return lista.filter((e) => (filtro === 'todos' || e.grupo === filtro) && (!q || e.nome.toLowerCase().includes(q) || (!!qd && e.cnpj.includes(qd))))
      .sort((a, b) => {
        const va = valor(a, ordem.k), vb = valor(b, ordem.k);
        let r = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'pt-BR');
        if (!r && ordem.k !== 'nome') r = a.nome.localeCompare(b.nome, 'pt-BR'); // empate cai no nome
        return ordem.asc ? r : -r;
      });
  }, [lista, filtro, busca, ordem, ultimos, situacoes]);

  const lidas = relatorios.length;
  const pct = lista.length ? Math.min(100, Math.round((lidas / lista.length) * 100)) : 0;
  const alternar = (c: string) => setSel((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const todosOn = visiveis.length > 0 && visiveis.every((e) => sel.has(e.cnpj));
  const barra = (prontos: number, total: number) => {
    const p = total ? Math.round((prontos / total) * 100) : 0;
    return (<><strong>Robô rodando no PC do escritório.</strong> Não feche esta tela.
      <div className="my-1.5 h-2 overflow-hidden rounded-full bg-sky-100"><div className="h-full bg-sky-600 transition-all" style={{ width: `${p}%` }} /></div>
      <div className="text-[12px]">{prontos} de {total} relatório(s) prontos · {p}%</div></>);
  };

  async function puxar() {
    const cnpjs = [...sel];
    if (!cnpjs.length) return setEstado({ html: 'Selecione ao menos um cliente.', tipo: 'erro' });
    setOcupado(true);
    try {
      setEstado({ html: `Enviando o pedido (${cnpjs.length} cliente(s))…`, tipo: 'andando' });
      const job = await fiscalApi.pedir(cnpjs);
      setEstado({ html: <>Robô rodando no PC do escritório… <strong>não feche esta tela</strong> (~{Math.ceil(cnpjs.length * 0.9)} min).</>, tipo: 'andando' });
      let st: JobRobo | null = null;
      for (;;) {
        await espera(8000);
        st = await fiscalApi.job(job.id).catch(() => null);
        if (!st) continue;
        setEstado({ html: barra(st.pdfs?.length || 0, cnpjs.length), tipo: 'andando' });
        if (st.status === 'done') break;
      }
      if (!st.pdfs?.length) {
        const sem = st.summary?.sem_relatorio?.length || 0;
        setEstado({ html: `Nenhum relatório retornou. ${st.summary?.baixados || 0} baixado(s)${sem ? `, ${sem} sem procuração` : ''}. O motivo de cada um está no Relatório de acessos, aqui embaixo e no menu.`, tipo: 'erro' });
        ex.recarregar(); setOcupado(false); return;
      }
      setEstado({ html: `Baixando ${st.pdfs.length} relatório(s) e importando…`, tipo: 'andando' });
      const imp = await fiscalApi.importarDoRobo(st.pdfs.map((nome) => ({ jobId: st!.id, nome })));
      const falhas = falhasDoJob(st, nomePorCnpj);
      setEstado({
        html: (<><strong>Pronto.</strong> {imp.baixados ?? st.pdfs.length} relatório(s) importado(s) — {imp.novos} novo(s){imp.erros ? `, ${imp.erros} erro(s) de leitura` : ''} · {imp.total} empresa(s) no Obrigô. Veja em <strong>Painel Fiscal do cliente</strong>.
          {!!falhas.length && <> <strong>{falhas.length} cliente(s) não puderam ser acessados</strong> — estão no <strong>Relatório de acessos</strong>, aqui embaixo e no menu.</>}</>),
        tipo: falhas.length ? 'aviso' : 'pronto',
      });
      setSel(new Set()); recarregar(); ex.recarregar();
    } catch (e) { setEstado({ html: `Erro: ${erroMsg(e)}`, tipo: 'erro' }); }
    setOcupado(false);
  }
  async function parar() {
    if (!confirm('Parar o robô agora? O bloco que estiver baixando é descartado e a lista de espera é limpa. Os relatórios já baixados continuam salvos.')) return;
    try { const r = await fiscalApi.parar(); setEstado({ html: `Robô parando… encerra em alguns segundos. Lista de espera limpa${r?.pendentes_removidos ? ` — ${r.pendentes_removidos} removido(s)` : ''}.`, tipo: 'aviso' }); }
    catch (e) { setEstado({ html: `Erro ao parar: ${erroMsg(e)}`, tipo: 'erro' }); }
  }
  async function limpar() {
    try { const r = await fiscalApi.limparFila(); setEstado({ html: `Lista de espera limpa — ${r?.removidos || 0} pendente(s) removido(s). O que já roda continua.`, tipo: 'andando' }); }
    catch (e) { setEstado({ html: `Erro ao limpar: ${erroMsg(e)}`, tipo: 'erro' }); }
  }
  // Todos os lotes prontos (um pedido grande sai em vários); o mesmo arquivo em dois lotes entra uma vez
  async function reimportarProntos() {
    setOcupado(true);
    try {
      setEstado({ html: 'Buscando os resultados prontos…', tipo: 'andando' });
      const prontos = (await fiscalApi.jobs()).filter((j) => j.status === 'done' && j.pdfs?.length);
      if (!prontos.length) { setEstado({ html: 'Nenhum resultado pronto para reimportar.', tipo: 'erro' }); setOcupado(false); return; }
      const itens = prontos.flatMap((j) => j.pdfs.map((nome) => ({ jobId: j.id, nome })));
      setEstado({ html: `Baixando e importando os relatórios de ${prontos.length} lote(s)…`, tipo: 'andando' });
      const imp = await fiscalApi.importarDoRobo(itens);
      setEstado({ html: <><strong>Reimportado.</strong> {imp.baixados} relatório(s) — {imp.novos} novo(s){imp.erros ? `, ${imp.erros} erro(s) de leitura` : ''} · {imp.total} empresa(s) no Obrigô.</>, tipo: 'pronto' });
      recarregar(); ex.recarregar();
    } catch (e) { setEstado({ html: `Erro: ${erroMsg(e)}`, tipo: 'erro' }); }
    setOcupado(false);
  }

  const corEstado = { andando: 'bg-sky-50 text-sky-900', pronto: 'bg-emerald-50 text-emerald-900', erro: 'bg-red-50 text-red-900', aviso: 'bg-amber-50 text-amber-900' };
  const COLS: { k: Coluna; t: string; dica: string }[] = [
    { k: 'nome', t: 'Cliente', dica: 'Ordenar pelo nome da empresa' }, { k: 'data', t: 'Último relatório', dica: 'Ordenar pela data do último relatório' },
    { k: 'sit', t: 'Situação', dica: 'Situação cadastral que aparece ao acessar por procuração' }, { k: 'grupo', t: 'Carteira', dica: 'Ordenar pela carteira' },
  ];

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Situação Fiscal · e-CAC</div>
            <div className="text-lg font-semibold">Puxar relatórios</div>
            <div className="text-[12px] text-slate-300">{lista.length} cliente(s) com CNPJ na carteira · {lidas} já lida(s)</div>
            <div className="text-[12px] text-slate-300">o robô roda no PC do escritório; os PDFs voltam e entram sozinhos</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 'Selecionados', n: sel.size, d: sel.size ? 'vão para o robô' : 'marque na lista abaixo', c: COR.info },
            { t: 'Na lista', n: visiveis.length, d: filtro === 'todos' ? 'toda a carteira' : GRUPOS[filtro], c: '#fff' },
            { t: 'Já lidas', n: lidas, d: 'empresas com relatório importado', c: COR.ok },
          ].map((k) => <div key={k.t} className="rounded bg-white/10 p-2 text-center"><div className="text-[11px] text-slate-300">{k.t}</div><div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div><div className="text-[11px] text-slate-300">{k.d}</div></div>)}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div><div className="font-semibold text-slate-700">Clientes</div><div className="text-[12px] text-slate-500">Marque quem você quer puxar. O robô entra no e-CAC com a procuração do escritório e baixa o Relatório de Situação Fiscal de cada um.</div></div>
          {podeOperar && (
            <div className="flex flex-wrap gap-1.5">
              <Botao tipo="excluir" onClick={parar} title="Para o robô agora e limpa a lista de espera"><Square size={12} /> Parar robô</Botao>
              <Botao tipo="cancelar" onClick={limpar} title="Apaga a lista de espera (pedidos que ainda não começaram)"><Trash2 size={12} /> Limpar fila</Botao>
              <Botao tipo="info" disabled={ocupado} onClick={reimportarProntos} title="Reimporta os relatórios de todos os lotes já prontos, sem rodar o robô de novo"><RotateCcw size={12} /> Reimportar prontos</Botao>
              <Botao tipo="novo" disabled={ocupado} onClick={puxar}><Upload size={13} /> Puxar selecionados{sel.size ? ` (${sel.size})` : ''}</Botao>
            </div>
          )}
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          <input className={`${INP} w-80`} placeholder="Nome da empresa ou CNPJ" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="flex overflow-hidden rounded border border-slate-300">
            {ORDEM_GRUPOS.map((g) => (
              <button key={g} onClick={() => setFiltro(g)} className={`px-2.5 py-1.5 text-[12px] ${filtro === g ? 'bg-marca-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                {GRUPOS[g]} <span className="opacity-70">{contar(g)}</span>
              </button>
            ))}
          </div>
          <Botao tipo="neutro" onClick={() => setSel((s) => { const n = new Set(s); visiveis.forEach((e) => (todosOn ? n.delete(e.cnpj) : n.add(e.cnpj))); return n; })}>{todosOn ? 'Limpar seleção' : 'Selecionar todos'}</Botao>
        </div>
        {estado && <div className={`mb-2 rounded-lg px-3 py-2.5 ${corEstado[estado.tipo]}`}>{estado.html}</div>}
        <div className="grid grid-cols-[22px_minmax(0,1fr)_130px_110px_120px] gap-2 border-b border-slate-200 px-2 py-1.5 text-[12px] text-slate-500">
          <span />
          {COLS.map((c) => (
            <button key={c.k} title={c.dica} className={`text-left ${ordem.k === c.k ? 'font-semibold text-marca-600' : ''}`}
              onClick={() => setOrdem((o) => (o.k === c.k ? { k: c.k, asc: !o.asc } : { k: c.k, asc: c.k !== 'data' }))}>
              {c.t}{ordem.k === c.k ? (ordem.asc ? ' ▲' : ' ▼') : ''}
            </button>
          ))}
        </div>
        <div className="max-h-[520px] overflow-auto">
          {!lista.length ? <div className="py-8 text-center text-slate-500">Nenhuma empresa com CNPJ cadastrada neste escritório.</div>
            : !visiveis.length ? <div className="py-8 text-center text-slate-500">Nenhum cliente encontrado neste filtro ou nesta busca.</div>
              : visiveis.map((e) => {
                const on = sel.has(e.cnpj), u = ultimos[e.cnpj], dias = u ? diasAtras(u.ms) : null, sit = situacoes[e.cnpj]?.sit ?? '';
                // cor pelo tempo: até 1 mês fresco, até 3 meses envelhecendo, acima disso não vale mais
                const corData = !u ? '#b45309' : dias! <= 31 ? COR.ok : dias! <= 92 ? COR.aviso : COR.erro;
                const dica = !u ? 'Este CNPJ nunca foi puxado pelo robô' : u.fonte === 'robô' ? `Puxado pelo robô em ${soData(u.ms)} · há ${dias} dia(s)` : `Relatório emitido em ${soData(u.ms)} · há ${dias} dia(s)`;
                return (
                  <div key={e.id} onClick={() => podeOperar && alternar(e.cnpj)}
                    className={`grid cursor-pointer grid-cols-[22px_minmax(0,1fr)_130px_110px_120px] items-center gap-2 border-b border-slate-100 px-2 py-1.5 ${on ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                    <span className={`grid h-[18px] w-[18px] place-items-center rounded border text-[11px] ${on ? 'border-marca-500 text-marca-600' : 'border-slate-300'}`}>{on ? '✓' : ''}</span>
                    <span className="min-w-0"><span className="block truncate font-medium text-slate-700">{e.nome}</span><span className="block text-[11px] text-slate-400">{fmtCnpj(e.cnpj)}</span></span>
                    <span title={dica} style={{ color: corData }}>{u ? <><span className="block">{soData(u.ms)}</span><span className="block text-[11px] opacity-80">{dias === 0 ? 'hoje' : `há ${dias} dia(s)`}</span></> : <><span className="block">nunca</span><span className="block text-[11px] opacity-80">sem relatório</span></>}</span>
                    <span className="text-[12px]" title="Situação cadastral do último relatório" style={{ color: !sit ? COR.neutro : sit === 'ATIVA' ? '#3f7a36' : '#b45309' }}>{sit || '—'}</span>
                    <span><Selo cor={COR.neutro}>{GRUPOS[e.grupo]}</Selo></span>
                  </div>
                );
              })}
        </div>
        <p className="mt-2 text-[12px] text-slate-500">{visiveis.length} cliente(s) na lista · {sel.size} selecionado(s)</p>
      </div>

      <RelatorioAcessos {...ex} nomePorCnpj={nomePorCnpj} podeOperar={podeOperar} aoReimportar={recarregar} />
      <div className="text-center"><button className="text-[12px] text-marca-600 hover:underline" onClick={() => navigate('/fiscal/cliente')}>Abrir o Painel Fiscal do cliente →</button></div>
    </div>
  );
}
