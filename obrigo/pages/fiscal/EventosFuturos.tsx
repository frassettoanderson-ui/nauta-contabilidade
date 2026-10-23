// Situação Fiscal › Eventos futuros (Simples) — Consulta Optantes da Receita, feita pelo robô no PC
// do escritório: situação no Simples e no SIMEI e os EVENTOS FUTUROS (exclusão de ofício,
// desenquadramento, opção deferida) com a data de efeito. Observação por empresa fica na ponte.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { Botao, INP, erroMsg } from '../societario/modais';
import { Anel } from '../societario/Kanban';
import {
  COR, GRUPOS, fiscalApi, useFiscal, digits, fmtCnpj, soData, soHora, dataHora, diasAtras, baixarCsv, hojeArq, espera,
  type Grupo, type LinhaOptante, type ObsOptante, type EmpresaCarteira, type JobOptante,
} from './comum';

const GRUPOS_FILTRO: Grupo[] = ['nauta', 'digital', 'mei', 'esporadico'];
const CHAVE_OCULTOS = 'obrigo.fiscal.gruposOcultos';
const lerOcultos = (): Grupo[] => { try { const a = JSON.parse(localStorage.getItem(CHAVE_OCULTOS) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };

// O robô entrega o bloco numa linha só, com as linhas da tabela juntadas por " | ".
// Pedaço sem data é cabeçalho (ou "Não Existem"); no resto, a data é a Data Efeito.
interface Evento { regime: 'Simples' | 'SIMEI'; descricao: string; data: string; ordem: number; critico: boolean }
function lerEventos(bloco: string, regime: Evento['regime']): Evento[] {
  if (!bloco) return [];
  const out: Evento[] = [];
  String(bloco).split('|').forEach((pedaco) => {
    const p = pedaco.trim();
    if (!p || /^n[ãa]o existem/i.test(p)) return;
    const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(p);
    if (!m) return;
    const desc = p.replace(m[0], ' ').replace(/\s{2,}/g, ' ').trim() || '(sem descrição)';
    out.push({ regime, descricao: desc, data: m[0], ordem: Number(m[3] + m[2] + m[1]), critico: /exclus|desenquadr|impedi|cancelamento|baixa/i.test(desc) });
  });
  return out;
}
const eventosDe = (l?: LinhaOptante | null) => (l ? [...lerEventos(l.ev_simples, 'Simples'), ...lerEventos(l.ev_simei, 'SIMEI')].sort((a, b) => a.ordem - b.ordem) : []);
function curtoSimples(t?: string) { const s = String(t || ''); if (!s) return ''; if (/n[ãa]o optante/i.test(s)) return s.trim(); const m = s.match(/desde\s+(\d{2}\/\d{2}\/\d{4})/i); return /optante/i.test(s) && m ? `Optante desde ${m[1]}` : s; }
function curtoSimei(t?: string) { const s = String(t || ''); if (!s) return ''; if (/n[ãa]o enquadrado/i.test(s)) return 'Não'; const m = s.match(/desde\s+(\d{2}\/\d{2}\/\d{4})/i); return m ? `Sim, desde ${m[1]}` : s; }

type Coluna = 'nome' | 'simples' | 'simei' | 'evento' | 'quando' | 'obs';

export default function EventosFuturos() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'ecac_operar');
  const toast = useToast();
  const { carteira } = useFiscal();
  const [dados, setDados] = useState<Record<string, LinhaOptante>>({});
  const [obs, setObs] = useState<Record<string, ObsOptante>>({});
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [soEventos, setSoEventos] = useState(false);
  const [ocultos, setOcultos] = useState<Grupo[]>(lerOcultos);
  const [ordem, setOrdem] = useState<{ k: Coluna; asc: boolean }>({ k: 'evento', asc: true }); // nasce por evento: o que urge primeiro
  const [estado, setEstado] = useState<{ html: React.ReactNode; tipo: 'andando' | 'pronto' | 'erro' | 'aviso' } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const carregar = useCallback(async (avisar = false) => {
    try {
      const m = await fiscalApi.optantes();
      setDados(m ?? {});
      try { setObs((await fiscalApi.obs()) ?? {}); } catch { /* sem observações a tela segue útil */ }
      if (avisar) toast('ok', `${Object.keys(m ?? {}).length} empresa(s) com consulta guardada.`);
    } catch (e) { setEstado({ html: `Não consegui ler as consultas guardadas: ${erroMsg(e)}`, tipo: 'erro' }); }
  }, [toast]);
  useEffect(() => { carregar(); }, [carregar]);

  const lista = useMemo(() => carteira.filter((e) => e.cnpj.length === 14), [carteira]);
  const linhaDe = (e: EmpresaCarteira) => dados[e.cnpj] ?? null;
  const comEvento = lista.filter((e) => eventosDe(linhaDe(e)).length > 0);
  const criticas = comEvento.filter((e) => eventosDe(linhaDe(e)).some((v) => v.critico)).length;
  const consultadas = lista.filter((e) => !!linhaDe(e)).length;
  const pct = lista.length ? Math.round((consultadas / lista.length) * 100) : 0;

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase(), qd = digits(q);
    const valor = (e: EmpresaCarteira, k: Coluna): string | number => {
      const l = dados[e.cnpj];
      if (k === 'simples') return curtoSimples(l?.sit_simples);
      if (k === 'simei') return curtoSimei(l?.sit_simei);
      if (k === 'quando') return l?.em || 0;
      if (k === 'obs') return obs[e.cnpj]?.texto ? obs[e.cnpj].texto.toLowerCase() : '~'; // vazia vai pro fim
      if (k === 'evento') { const ev = eventosDe(l); return ev.length ? ev[0].ordem : 99999999; }
      return e.nome;
    };
    return lista.filter((e) => !ocultos.includes(e.grupo) && (!soEventos || eventosDe(dados[e.cnpj]).length > 0) && (!q || e.nome.toLowerCase().includes(q) || (!!qd && e.cnpj.includes(qd))))
      .sort((a, b) => {
        const va = valor(a, ordem.k), vb = valor(b, ordem.k);
        let r = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'pt-BR');
        if (!r && ordem.k !== 'nome') r = a.nome.localeCompare(b.nome, 'pt-BR');
        return ordem.asc ? r : -r;
      });
  }, [lista, ocultos, soEventos, busca, ordem, dados, obs]);

  function alternarGrupo(g: Grupo) {
    setOcultos((o) => { const n = o.includes(g) ? o.filter((x) => x !== g) : [...o, g]; try { localStorage.setItem(CHAVE_OCULTOS, JSON.stringify(n)); } catch { /* ok */ } return n; });
  }
  function csv() {
    const itens = lista.flatMap((e) => eventosDe(dados[e.cnpj]).map((v) => ({ e, l: dados[e.cnpj]!, v }))).sort((a, b) => a.v.ordem - b.v.ordem);
    if (!itens.length) return toast('erro', 'Nenhum evento futuro para exportar.');
    baixarCsv([['Data Efeito', 'Regime', 'Evento', 'CNPJ', 'CNPJ (nº)', 'Cliente', 'Carteira', 'Situação Simples', 'Consultado em', 'Observação', 'Obs. por'],
      ...itens.map(({ e, l, v }) => [v.data, v.regime, v.descricao, fmtCnpj(e.cnpj), e.cnpj, e.nome, GRUPOS[e.grupo], l.sit_simples || '', dataHora(l.em), obs[e.cnpj]?.texto || '', obs[e.cnpj]?.por || ''])],
    `Eventos_Futuros_Simples_${hojeArq()}.csv`);
    toast('ok', `${itens.length} evento(s) exportado(s).`);
  }
  async function consultar() {
    const cnpjs = [...sel];
    if (!cnpjs.length) return setEstado({ html: 'Selecione ao menos um cliente.', tipo: 'erro' });
    setOcupado(true);
    try {
      setEstado({ html: `Enviando o pedido (${cnpjs.length} cliente(s))…`, tipo: 'andando' });
      const job = await fiscalApi.pedirOptantes(cnpjs);
      setEstado({ html: `Pedido na fila do robô (~${Math.max(1, Math.ceil((cnpjs.length * 7) / 60))} min para ${cnpjs.length} empresa(s)).`, tipo: 'andando' });
      let st: JobOptante | null = null;
      for (;;) {
        await espera(8000);
        st = await fiscalApi.jobOptantes(job.id).catch(() => null);
        if (!st) continue;
        const p = st.total ? Math.round(((st.feitos || 0) / st.total) * 100) : 0;
        setEstado({ html: (<><strong>Robô consultando a Receita.</strong> Pode fechar esta tela — o resultado fica guardado.
          <div className="my-1.5 h-2 overflow-hidden rounded-full bg-sky-100"><div className="h-full bg-sky-600 transition-all" style={{ width: `${p}%` }} /></div>
          <div className="text-[12px]">{st.feitos || 0} de {st.total || cnpjs.length} consultado(s) · {p}%</div></>), tipo: 'andando' });
        if (st.status === 'done') break;
      }
      await carregar();
      const s = st.summary ?? {};
      const n = s.consultados ?? st.feitos ?? 0;
      // rodada que quebrou no meio NÃO pode aparecer como "Pronto"
      if (s.quebrou) setEstado({ html: <><strong>A consulta quebrou no meio.</strong> {s.erros || 0} de {n} empresa(s) não foram consultadas (o navegador do robô caiu). O que aparece na lista é <strong>parcial</strong> — mande consultar de novo para completar.</>, tipo: 'erro' });
      else setEstado({
        html: <><strong>Pronto.</strong> {n} empresa(s) consultada(s){s.com_evento ? <> · <strong>{s.com_evento} com evento futuro</strong></> : ' · nenhum evento futuro'}{s.erros ? ` · ${s.erros} sem resposta da Receita` : ''}{s.captcha ? ' · a Receita pediu verificação e o robô parou — o resto fica para a próxima rodada' : ''}.</>,
        tipo: s.captcha ? 'aviso' : 'pronto',
      });
      setSel(new Set());
    } catch (e) { setEstado({ html: `Erro: ${erroMsg(e)}`, tipo: 'erro' }); }
    setOcupado(false);
  }

  const todosOn = visiveis.length > 0 && visiveis.every((e) => sel.has(e.cnpj));
  const corEstado = { andando: 'bg-sky-50 text-sky-900', pronto: 'bg-emerald-50 text-emerald-900', erro: 'bg-red-50 text-red-900', aviso: 'bg-amber-50 text-amber-900' };
  const COLS: { k: Coluna; t: string; dica: string }[] = [
    { k: 'nome', t: 'Cliente', dica: 'Ordenar pelo nome da empresa' }, { k: 'simples', t: 'Simples Nacional', dica: 'Ordenar pela situação no Simples' },
    { k: 'simei', t: 'SIMEI', dica: 'Ordenar pelo enquadramento no SIMEI' }, { k: 'evento', t: 'Eventos futuros', dica: 'Ordenar pela data do evento mais próximo' },
    { k: 'quando', t: 'Consultado', dica: 'Ordenar pela data e hora da consulta' }, { k: 'obs', t: 'Observação', dica: 'Ordenar pelas observações escritas (as vazias vão para o fim)' },
  ];
  const GRID = 'grid-cols-[20px_minmax(0,1fr)_150px_90px_minmax(0,1.3fr)_100px_minmax(0,0.9fr)]';

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Simples Nacional · Consulta Optantes</div>
            <div className="text-lg font-semibold">Eventos futuros</div>
            <div className="text-[12px] text-slate-300">{lista.length} cliente(s) com CNPJ na carteira</div>
            <div className="text-[12px] text-slate-300">{consultadas ? `${pct}% já consultado na Receita` : 'nenhuma consulta ainda — marque e mande consultar'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 'Exclusão / desenquadramento', n: criticas, d: criticas ? 'empresas com data marcada' : 'nada marcado', c: COR.erro },
            { t: 'Com evento futuro', n: comEvento.length, d: comEvento.length ? 'inclui opção já deferida' : 'nenhum evento futuro', c: COR.aviso },
            { t: 'Selecionados', n: sel.size, d: 'vão para o robô', c: COR.info },
          ].map((k) => <div key={k.t} className="rounded bg-white/10 p-2 text-center"><div className="text-[11px] text-slate-300">{k.t}</div><div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div><div className="text-[11px] text-slate-300">{k.d}</div></div>)}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="max-w-3xl"><div className="font-semibold text-slate-700">Clientes</div><div className="text-[12px] text-slate-500">Situação no Simples Nacional e no SIMEI de cada empresa, com os <strong>eventos futuros</strong> (exclusão de ofício, desenquadramento, opção já deferida) e a data em que passam a valer. Marque quem você quer reconsultar — o robô roda no PC do escritório. Clique na coluna <strong>Observação</strong> para anotar o que já foi feito: fica gravado no servidor e aparece para todo o escritório.</div></div>
          <div className="flex flex-wrap gap-1.5">
            <Botao tipo="neutro" onClick={csv} title="Planilha com os eventos futuros"><Download size={13} /> Baixar .csv</Botao>
            <Botao tipo="info" onClick={() => carregar(true)} title="Rebusca o que a ponte já tem, sem rodar o robô"><RefreshCw size={13} /> Atualizar</Botao>
            {podeOperar && <Botao tipo="novo" disabled={ocupado} onClick={consultar}><Search size={13} /> Consultar selecionados{sel.size ? ` (${sel.size})` : ''}</Botao>}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          <input className={`${INP} w-72`} placeholder="Nome da empresa ou CNPJ" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className={`${INP} w-56`} value={soEventos ? '1' : ''} onChange={(e) => setSoEventos(e.target.value === '1')}><option value="">Todas as empresas</option><option value="1">Só quem tem evento futuro</option></select>
          <span className="text-[12px] text-slate-500">Ocultar grupos:</span>
          {GRUPOS_FILTRO.map((g) => (
            <button key={g} onClick={() => alternarGrupo(g)} title={ocultos.includes(g) ? 'Oculto — clique para mostrar' : 'Clique para ocultar este grupo'}
              className={`rounded border px-2 py-1 text-[12px] ${ocultos.includes(g) ? 'border-slate-300 bg-slate-100 text-slate-400 line-through' : 'border-slate-300 bg-white text-slate-600'}`}>
              {ocultos.includes(g) ? '☑' : '☐'} {GRUPOS[g]} <span className="opacity-70">{lista.filter((e) => e.grupo === g).length}</span>
            </button>
          ))}
          <Botao tipo="neutro" onClick={() => setSel((s) => { const n = new Set(s); visiveis.forEach((e) => (todosOn ? n.delete(e.cnpj) : n.add(e.cnpj))); return n; })}>{todosOn ? 'Limpar seleção' : 'Selecionar todos'}</Botao>
        </div>
        {estado && <div className={`mb-2 rounded-lg px-3 py-2.5 ${corEstado[estado.tipo]}`}>{estado.html}</div>}
        <div className={`grid ${GRID} gap-2 border-b border-slate-200 px-2 py-1.5 text-[12px] text-slate-500`}>
          <span />
          {COLS.map((c) => (
            <button key={c.k} title={c.dica} className={`text-left uppercase ${ordem.k === c.k ? 'font-semibold text-marca-600' : ''}`}
              onClick={() => setOrdem((o) => (o.k === c.k ? { k: c.k, asc: !o.asc } : { k: c.k, asc: c.k !== 'quando' }))}>
              {c.t}{ordem.k === c.k ? (ordem.asc ? ' ▲' : ' ▼') : ''}
            </button>
          ))}
        </div>
        <div className="max-h-[560px] overflow-auto">
          {!lista.length ? <div className="py-8 text-center text-slate-500">Nenhuma empresa com CNPJ cadastrada neste escritório.</div>
            : !visiveis.length ? <div className="py-8 text-center text-slate-500">Nenhum cliente neste filtro ou nesta busca.</div>
              : visiveis.map((e) => {
                const l = dados[e.cnpj], on = sel.has(e.cnpj), ev = eventosDe(l), dias = l?.em ? diasAtras(l.em) : null;
                return (
                  <div key={e.id} onClick={() => podeOperar && setSel((s) => { const n = new Set(s); if (n.has(e.cnpj)) n.delete(e.cnpj); else n.add(e.cnpj); return n; })}
                    className={`grid ${GRID} cursor-pointer items-center gap-2 border-b border-slate-100 px-2 py-1.5 ${on ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                    <span className={`grid h-[18px] w-[18px] place-items-center rounded border text-[11px] ${on ? 'border-marca-500 text-marca-600' : 'border-slate-300'}`}>{on ? '✓' : ''}</span>
                    {/* CNPJ só com os números: é assim que se cola num portal ou numa planilha */}
                    <span className="min-w-0"><span className="block font-medium leading-tight text-slate-700">{e.nome}</span><span className="block text-[11px] text-slate-400"><span className="select-all" title={fmtCnpj(e.cnpj)} onClick={(x) => x.stopPropagation()}>{e.cnpj}</span> · {GRUPOS[e.grupo]}</span></span>
                    <span className="text-[12px]" title={l?.sit_simples || ''}>{l ? curtoSimples(l.sit_simples) || '—' : <span className="text-slate-400">—</span>}</span>
                    <span className="text-[12px]" title={l?.sit_simei || ''}>{l ? curtoSimei(l.sit_simei) || '—' : <span className="text-slate-400">—</span>}</span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      {!l ? <span className="text-[12px] text-slate-400">não consultado</span> : !ev.length ? <span className="text-[12px] text-slate-400">nenhum</span>
                        : ev.map((v, i) => (
                          <span key={i} title={`${v.regime}: ${v.descricao} — efeito em ${v.data}`} className={`inline-flex max-w-full items-baseline gap-1.5 rounded-full px-2 py-0.5 text-[12px] ${v.critico ? 'bg-red-50 font-medium text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                            <b className="whitespace-nowrap">{v.data}</b><span className="break-words">{v.descricao}</span>
                          </span>
                        ))}
                    </span>
                    <span className={`text-[12px] leading-tight ${l ? '' : 'text-amber-700'}`} title={l?.em ? `Consultado na Receita em ${dataHora(l.em)}` : 'Esta empresa nunca foi consultada'}>
                      {l?.em ? <><span className="block">{soData(l.em)}</span><span className="block text-[11px] text-slate-400">{soHora(l.em)} · {dias === 0 ? 'hoje' : `há ${dias} dia(s)`}</span></> : <><span className="block">nunca</span><span className="block text-[11px] text-slate-400">sem consulta</span></>}
                    </span>
                    <CelulaObs cnpj={e.cnpj} obs={obs[e.cnpj]} editando={editando === e.cnpj} podeOperar={podeOperar}
                      onEditar={() => setEditando(e.cnpj)} onFim={() => setEditando(null)}
                      onSalvo={(texto) => setObs((o) => { const n = { ...o }; if (texto) n[e.cnpj] = { texto, por: sessao?.usuario?.nome, em: Date.now() }; else delete n[e.cnpj]; return n; })} />
                  </div>
                );
              })}
        </div>
        <p className="mt-2 text-[12px] text-slate-500">{visiveis.length} cliente(s) na lista · {sel.size} selecionado(s)</p>
      </div>
    </div>
  );
}

// Observação: parece texto, vira campo ao clicar. Enter grava, Esc desiste; se falhar, o campo
// FICA aberto com o texto (perder o que a pessoa escreveu por falha de rede seria imperdoável).
function CelulaObs({ cnpj, obs, editando, podeOperar, onEditar, onFim, onSalvo }: {
  cnpj: string; obs?: ObsOptante; editando: boolean; podeOperar: boolean; onEditar: () => void; onFim: () => void; onSalvo: (t: string) => void;
}) {
  const toast = useToast();
  const [texto, setTexto] = useState(obs?.texto ?? '');
  const [salvando, setSalvando] = useState(false);
  const fim = useRef(false);
  useEffect(() => { if (editando) { setTexto(obs?.texto ?? ''); fim.current = false; } }, [editando, obs?.texto]);
  async function encerrar(salvar: boolean) {
    if (fim.current) return;
    const t = texto.trim(), antigo = obs?.texto ?? '';
    if (!salvar || t === antigo) { fim.current = true; onFim(); return; }
    fim.current = true; setSalvando(true);
    try { await fiscalApi.gravarObs(cnpj, t); onSalvo(t); onFim(); toast('ok', t ? 'Observação salva.' : 'Observação apagada.'); }
    catch (e) { fim.current = false; toast('erro', `Não consegui salvar: ${erroMsg(e)}`); }
    setSalvando(false);
  }
  if (editando) {
    return (
      <input autoFocus maxLength={500} disabled={salvando} value={texto} placeholder="ex.: cliente avisado, parcelamento pedido"
        onClick={(e) => e.stopPropagation()} onChange={(e) => setTexto(e.target.value)} onBlur={() => encerrar(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); encerrar(true); } else if (e.key === 'Escape') { e.preventDefault(); encerrar(false); } }}
        className="w-full rounded border-2 border-marca-400 bg-white px-1.5 py-1 text-[12px] outline-none" />
    );
  }
  if (obs?.texto) {
    return (
      <span onClick={(e) => { e.stopPropagation(); if (podeOperar) onEditar(); }} title={`${obs.texto}${obs.por ? ` — ${obs.por}` : ''}${obs.em ? ` · ${dataHora(obs.em)}` : ''}${podeOperar ? ' (clique para editar)' : ''}`}
        className="cursor-text break-words border-b border-dashed border-slate-300 py-0.5 text-[12px] hover:bg-amber-50">{obs.texto}</span>
    );
  }
  return podeOperar
    ? <span onClick={(e) => { e.stopPropagation(); onEditar(); }} title="Clique para escrever uma observação" className="cursor-text text-[12px] text-slate-400 hover:text-slate-600">+ observação</span>
    : <span className="text-[12px] text-slate-300">—</span>;
}
