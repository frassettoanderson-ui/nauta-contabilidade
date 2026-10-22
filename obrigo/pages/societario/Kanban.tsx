// Societario › Kanban dos processos (tela inicial do modulo). Regras do painel da Atuan.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Eye, EyeOff, Plus, Archive, ExternalLink } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import {
  COR, ETAPAS, CONCLUIDOS, FRENTES, LINK_REGIN, HONORARIO_SIT, socApi, semaforo, diasAte, nomeCliente, rotuloNatureza, idxEtapa,
  emSoneca, arquivado, voltaEm, travaMovimento, frenteSalva, salvarFrente, daFrente, mascaraMoeda, moedaParaNumero, numeroParaMoeda,
  mascaraCpf, type Processo,
} from './comum';
import { NovoProcessoModal, FichaProcessoModal, ChecklistModal, ConfirmarAlteracaoModal, ConclusaoModal, ForaDoQuadroModal, BotaoCopiar, Botao, erroMsg, INP } from './modais';

export function SeletorFrente({ valor, onMudar }: { valor: string; onMudar: (v: string) => void }) {
  const ops = [{ v: 'todas', t: 'Todas' }, ...FRENTES];
  return (
    <div className="inline-flex overflow-hidden rounded border border-slate-300 bg-white text-[12px]">
      {ops.map((o) => (
        <button key={o.v} onClick={() => { salvarFrente(o.v); onMudar(o.v); }}
          className={`px-2.5 py-1 ${valor === o.v ? 'bg-marinho-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          style={valor === o.v ? { background: COR.marinho, color: '#fff' } : undefined}>{o.t}</button>
      ))}
    </div>
  );
}

export function Anel({ pct, tamanho = 64 }: { pct: number; tamanho?: number }) {
  const cor = pct >= 85 ? COR.ok : pct >= 60 ? COR.aviso : COR.erro;
  const r = tamanho / 2 - 6; const c = 2 * Math.PI * r;
  return (
    <svg width={tamanho} height={tamanho}>
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={cor} strokeWidth={6} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`} strokeLinecap="round" />
      <text x="50%" y="54%" textAnchor="middle" fontSize={tamanho / 4.2} fontWeight={600} fill="#334155">{pct}%</text>
    </svg>
  );
}

export function useProcessos() {
  const [lista, setLista] = useState<Processo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(() => socApi.listar().then(setLista).catch(() => undefined).finally(() => setCarregando(false)), []);
  useEffect(() => { recarregar(); }, [recarregar]);
  const trocar = useCallback((p: Processo) => setLista((l) => l.map((x) => (x.id === p.id ? p : x))), []);
  return { lista, carregando, recarregar, trocar };
}

export default function KanbanSocietario() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'societario_operar');
  const toast = useToast();
  const { lista, carregando, recarregar, trocar } = useProcessos();
  const [frente, setFrente] = useState(frenteSalva());
  const [modo, setModo] = useState<'compact' | 'full'>('compact');
  const [mostrarOcultos, setMostrarOcultos] = useState(false);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [novo, setNovo] = useState(false);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Processo | null>(null);
  const [confirmarAlt, setConfirmarAlt] = useState<{ p: Processo; destino: string } | null>(null);
  const [concluir, setConcluir] = useState<Processo | null>(null);
  const [fora, setFora] = useState(false);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 60_000); return () => clearInterval(t); }, []);

  const daF = useMemo(() => lista.filter((p) => daFrente(p, frente)), [lista, frente]);
  const noQuadro = daF.filter((p) => !p.foraDoQuadro);
  const ativosQuadro = noQuadro.filter((p) => p.situacao !== 'Finalizado');
  const atrasados = ativosQuadro.filter((p) => semaforo(p.prazo).rotulo === 'Atrasado').length;
  const vencem7 = ativosQuadro.filter((p) => { const d = diasAte(p.prazo); return d !== null && d >= 0 && d <= 7; }).length;
  const pct = ativosQuadro.length ? Math.round(((ativosQuadro.length - atrasados) / ativosQuadro.length) * 100) : 100;
  const foraLista = daF.filter((p) => p.foraDoQuadro && p.situacao !== 'Finalizado');
  const visiveis = noQuadro.filter((p) => mostrarOcultos || !emSoneca(p));
  const ocultosQtd = noQuadro.filter((p) => emSoneca(p) && p.situacao !== 'Finalizado').length;
  const colunas = [...ETAPAS, CONCLUIDOS];
  const arquivadosQtd = noQuadro.filter((p) => arquivado(p)).length;

  const negar = () => { toast('erro', 'Seu nível de acesso é somente de consulta.'); return false; };

  async function soltar(p: Processo, destino: string) {
    if (!podeOperar) return negar();
    if (destino === (p.situacao === 'Finalizado' ? CONCLUIDOS : p.etapa)) return;
    if (p.situacao !== 'Finalizado') {
      const erro = travaMovimento(p, destino);
      if (erro) return toast('erro', erro);
      if (p.servico === 'Alteração' && p.etapa === 'Viabilidade' && idxEtapa(destino) > idxEtapa('Viabilidade')) return setConfirmarAlt({ p, destino });
    }
    await executarMovimento(p, destino);
  }
  async function executarMovimento(p: Processo, destino: string, alteracao?: { mudaEndereco: boolean; mudaMunicipio: boolean; mudaAtividade: boolean }) {
    try {
      const r = await socApi.mover(p.id, destino, alteracao);
      trocar(r.processo);
      if (r.precisa === 'concluir') setConcluir(r.processo);
      else if (r.precisa === 'confirmarAlteracao') setConfirmarAlt({ p: r.processo, destino });
      else if (destino !== CONCLUIDOS) toast('ok', `${p.codigo} → ${destino}`);
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function campo(p: Processo, c: string, v: unknown, msg?: string) {
    if (!podeOperar) return negar();
    try {
      const r = await socApi.campo(p.id, c, v); trocar(r.processo);
      if (r.travado) toast('erro', 'Informe o protocolo do REGIN para avançar além da Viabilidade.');
      if (msg) toast('ok', msg);
    } catch (e) { toast('erro', erroMsg(e)); }
  }

  const alternar = (id: string) => setAbertos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const quadroRef = useRef<HTMLDivElement>(null);

  return (
    <div className="-m-6 min-h-full bg-fundo p-4 text-[13px]">
      {/* topo */}
      <div className="mb-3 grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr_auto]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Societário · quadro</div>
            <div className="text-lg font-semibold">Kanban dos processos</div>
            <div className="text-[12px] text-slate-300">{ativosQuadro.length - atrasados} de {ativosQuadro.length} cartão(ões) sem atraso</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 'Atrasados', n: atrasados, d: atrasados ? 'puxe para o topo do quadro' : 'nenhum cartão vencido', c: COR.erro },
            { t: 'Vencem em 7 dias', n: vencem7, d: vencem7 ? 'programe a semana' : 'nada vencendo nesta semana', c: COR.aviso },
            { t: 'Cartões no quadro', n: ativosQuadro.length, d: 'processos em andamento', c: COR.info },
          ].map((k) => (
            <div key={k.t} className="rounded bg-white/10 p-2 text-center">
              <div className="text-[11px] text-slate-300">{k.t}</div>
              <div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div>
              <div className="text-[11px] text-slate-300">{k.d}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SeletorFrente valor={frente} onMudar={setFrente} />
          <div className="flex gap-2">
            {foraLista.length > 0 && <Botao tipo="neutro" onClick={() => setFora(true)}><Archive size={14} /> {foraLista.length} fora do quadro</Botao>}
            {podeOperar && <Botao tipo="novo" onClick={() => setNovo(true)}><Plus size={14} /> Novo processo</Botao>}
          </div>
        </div>
      </div>

      {/* controles */}
      <div className="mb-2 flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-white p-2 text-[12px] text-slate-600">
        <span>Para avançar, arraste o cartão para a etapa seguinte. Concluir pede o tipo de cliente.</span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1">Exibição
            <select className="rounded border border-slate-300 px-1 py-0.5" value={modo} onChange={(e) => setModo(e.target.value as 'compact' | 'full')}>
              <option value="compact">Resumido (só o nome)</option><option value="full">Completo</option>
            </select>
          </label>
          <label className="flex items-center gap-1">Cartões ocultos
            <select className="rounded border border-slate-300 px-1 py-0.5" value={mostrarOcultos ? '1' : ''} onChange={(e) => setMostrarOcultos(!!e.target.value)}>
              <option value="">Esconder os ocultos</option><option value="1">Mostrar tudo</option>
            </select>
          </label>
          <label className="flex items-center gap-1">Concluídos arquivados
            <select className="rounded border border-slate-300 px-1 py-0.5" value={mostrarArquivados ? '1' : ''} onChange={(e) => setMostrarArquivados(!!e.target.value)}>
              <option value="">Ocultar</option><option value="1">Mostrar</option>
            </select>
          </label>
        </div>
      </div>

      {/* quadro */}
      {carregando ? <div className="py-16 text-center text-slate-400">Carregando…</div> : (
        <div ref={quadroRef} className="flex gap-2.5 overflow-x-auto pb-3">
          {colunas.map((col, ci) => {
            const cartoes = col === CONCLUIDOS
              ? visiveis.filter((p) => p.situacao === 'Finalizado' && (mostrarArquivados || !arquivado(p)))
              : visiveis.filter((p) => p.situacao !== 'Finalizado' && p.etapa === col);
            return (
              <div key={col}
                onDragOver={(e) => { e.preventDefault(); setSobre(col); }} onDragLeave={() => setSobre((s) => (s === col ? null : s))}
                onDrop={(e) => { e.preventDefault(); setSobre(null); const p = lista.find((x) => x.id === arrastando); setArrastando(null); if (p) soltar(p, col); }}
                className={`flex min-w-[180px] flex-1 flex-col rounded-lg border ${sobre === col ? 'border-marca-400 bg-marca-50' : 'border-slate-200 bg-slate-100/70'}`}>
                <div className="flex items-center justify-between rounded-t-lg px-2.5 py-2 text-[12px] font-semibold text-white" style={{ background: col === CONCLUIDOS ? COR.ok : COR.marinho }}>
                  <span>{col}</span><span className="rounded bg-white/20 px-1.5">{cartoes.length}</span>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {ci === 0 && ocultosQtd > 0 && !mostrarOcultos && <div className="text-center text-[11px] text-slate-500">{ocultosQtd} cartão(ões) oculto(s) por algumas horas — veja em “Cartões ocultos”.</div>}
                  {col === CONCLUIDOS && arquivadosQtd > 0 && !mostrarArquivados && <div className="text-center text-[11px] text-slate-500">{arquivadosQtd} concluído(s) arquivado(s) — continuam na lista de Processos.</div>}
                  {cartoes.length === 0 && <div className="py-4 text-center text-[12px] text-slate-400">Sem processos</div>}
                  {cartoes.map((p) => (
                    <Cartao key={p.id} p={p} modo={modo} aberto={abertos.has(p.id)} onAlternar={() => alternar(p.id)} podeOperar={podeOperar}
                      onArrastar={() => setArrastando(p.id)} onFicha={() => setFichaId(p.id)} onChecklist={() => setChecklist(p)}
                      onCampo={(c, v, m) => campo(p, c, v, m)} onTrocar={trocar}
                      onEncerrar={() => soltar(p, CONCLUIDOS)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovoProcessoModal aberto={novo} onFechar={() => setNovo(false)} onCriado={() => recarregar()} frentePadrao={frente} />
      <FichaProcessoModal processoId={fichaId} onFechar={() => setFichaId(null)} onSalvo={recarregar} podeOperar={podeOperar} />
      <ChecklistModal processo={checklist} onFechar={() => { setChecklist(null); }} onMudou={trocar} podeOperar={podeOperar} onAbrirFicha={setFichaId} />
      <ConfirmarAlteracaoModal processo={confirmarAlt?.p ?? null} onCancelar={() => setConfirmarAlt(null)}
        onConfirmar={(a) => { const c = confirmarAlt!; setConfirmarAlt(null); executarMovimento(c.p, c.destino, a); }} />
      <ConclusaoModal processo={concluir} onCancelar={() => setConcluir(null)} onConcluido={(p) => { trocar(p); setConcluir(null); recarregar(); }} />
      <ForaDoQuadroModal aberto={fora} processos={foraLista} onFechar={() => setFora(false)} onMudou={recarregar} podeOperar={podeOperar} />
    </div>
  );
}

// ─── Cartao ─────────────────────────────────────────────────────────────────
function Cartao({ p, modo, aberto, onAlternar, podeOperar, onArrastar, onFicha, onChecklist, onCampo, onTrocar, onEncerrar }: {
  p: Processo; modo: 'compact' | 'full'; aberto: boolean; onAlternar: () => void; podeOperar: boolean; onArrastar: () => void;
  onFicha: () => void; onChecklist: () => void; onCampo: (c: string, v: unknown, msg?: string) => void; onTrocar: (p: Processo) => void; onEncerrar: () => void;
}) {
  const toast = useToast();
  const fin = p.situacao === 'Finalizado';
  const [renomeando, setRenomeando] = useState(false);
  const [nome, setNome] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [focado, setFocado] = useState(false);
  const [balao, setBalao] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const semCnpj = !(p.empresa?.cnpj && p.empresa.cnpj.length === 14);
  const sem = semaforo(p.prazo);
  const etapaI = idxEtapa(p.etapa);
  const progEtapa = (() => {
    const t = p.checklist.filter((i) => !i.na && i.etapa === p.etapa);
    if (!t.length) return p.progresso === 100 ? 100 : 0;
    return Math.round((t.filter((i) => i.feito).length / t.length) * 100);
  })();

  async function gravarNome() {
    const n = nome.trim(); setRenomeando(false);
    if (!n || n === p.empresa?.razaoSocial) return;
    try { onTrocar(await socApi.renomear(p.id, n)); toast('ok', 'Nome alterado.'); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const stop = { onMouseDown: (e: React.MouseEvent) => e.stopPropagation(), onFocus: () => setFocado(true), onBlur: () => setFocado(false), 'data-sem-arrastar': true } as const;

  const nomeEl = renomeando ? (
    <input autoFocus className={INP} value={nome} {...stop} onChange={(e) => setNome(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') gravarNome(); if (e.key === 'Escape') setRenomeando(false); }} onBlur={() => { setFocado(false); gravarNome(); }} />
  ) : (
    <button onClick={onFicha} className="text-left text-[13px] font-semibold text-slate-800 hover:text-marca-600">{modo === 'full' ? p.codigo : nomeCliente(p)}</button>
  );

  const reginEl = !fin && p.etapa === 'Viabilidade' ? (
    <Campinho rotulo="Protocolo REGIN (JUCESC)" valor={p.protocoloRegin ?? ''} onGravar={(v) => onCampo('protocoloRegin', v)} stop={stop} dis={!podeOperar} />
  ) : p.protocoloRegin ? <div className="flex items-center gap-1 text-[11px] text-slate-500">Protocolo REGIN: {p.protocoloRegin} <BotaoCopiar texto={p.protocoloRegin} rotulo={`Protocolo copiado: ${p.protocoloRegin}`} /></div> : null;

  const reqEl = etapaI >= idxEtapa('Requerimento') || fin ? (
    !fin && p.etapa === 'Requerimento'
      ? <Campinho rotulo="Nº do requerimento" valor={p.requerimento ?? ''} onGravar={(v) => onCampo('requerimento', v)} stop={stop} dis={!podeOperar} />
      : p.requerimento ? <div className="flex items-center gap-1 text-[11px] text-slate-500">Requerimento: {p.requerimento} <BotaoCopiar texto={p.requerimento} rotulo={`Nº do requerimento copiado: ${p.requerimento}`} /></div>
        : p.natureza !== 'MEI' ? <div className="text-[11px]" style={{ color: COR.erro }}>⚠ sem nº de requerimento</div> : null
  ) : null;

  const ticks = !fin && (
    <>
      {p.etapa === 'Formulário' && (
        <label className="flex items-center gap-1.5 text-[12px]" style={{ color: p.formularioRecebido ? COR.ok : COR.novo }} {...stop}>
          <input type="checkbox" className="accent-marca-600" checked={p.formularioRecebido} onChange={(e) => onCampo('formularioRecebido', e.target.checked)} disabled={!podeOperar} />
          {p.formularioRecebido ? 'Formulário recebido' : 'Estou com o formulário'}
        </label>
      )}
      {p.etapa === 'Viabilidade' && p.servico === 'Alteração' && (
        <div className="rounded border border-slate-200 p-1.5 text-[11px] text-slate-600" {...stop}>
          A alteração muda:
          <label className="flex items-center gap-1"><input type="checkbox" checked={p.mudaEndereco} disabled={!podeOperar} onChange={(e) => onCampo('mudaEndereco', e.target.checked)} /> Endereço</label>
          {p.mudaEndereco && <label className="ml-4 flex items-center gap-1"><input type="checkbox" checked={p.mudaMunicipio} disabled={!podeOperar} onChange={(e) => onCampo('mudaMunicipio', e.target.checked)} /> … e de município</label>}
          <label className="flex items-center gap-1"><input type="checkbox" checked={p.mudaAtividade} disabled={!podeOperar} onChange={(e) => onCampo('mudaAtividade', e.target.checked)} /> Atividade (CNAE)</label>
        </div>
      )}
      {p.etapa === 'Pagamento' && (p.servico === 'Abertura' || p.servico === 'Alteração') && (
        <label className="flex items-center gap-1.5 text-[12px]" style={{ color: p.pagamentoFeito ? COR.ok : COR.novo }} {...stop}>
          <input type="checkbox" className="accent-marca-600" checked={p.pagamentoFeito} disabled={!podeOperar} onChange={(e) => onCampo('pagamentoFeito', e.target.checked)} />
          {p.pagamentoFeito ? 'Pagamento efetuado' : 'Marcar quando for pago'}
        </label>
      )}
    </>
  );

  const soneca = !fin && (
    <label className="flex items-center gap-1 text-[11px] text-slate-500" {...stop}>
      <input type="checkbox" checked={emSoneca(p)} disabled={!podeOperar} onChange={(e) => onCampo('ocultar', e.target.checked, e.target.checked ? `${p.codigo} oculto por 10h.` : `${p.codigo} de volta ao quadro.`)} />
      {emSoneca(p) ? `volta em ${voltaEm(p.ocultoAte!)}` : 'ocultar 10h'}
    </label>
  );

  return (
    <div draggable={podeOperar && !focado && !renomeando}
      onDragStart={(e) => { if (!podeOperar) { e.preventDefault(); toast('erro', 'Seu nível de acesso é somente de consulta.'); return; } e.dataTransfer.effectAllowed = 'move'; onArrastar(); }}
      onMouseEnter={() => { if (p.observacao) timer.current = setTimeout(() => setBalao(true), 2000); }}
      onMouseLeave={() => { clearTimeout(timer.current); setBalao(false); }}
      className={`relative cursor-grab space-y-1.5 rounded-md border bg-white p-2 shadow-sm active:cursor-grabbing ${emSoneca(p) ? 'opacity-60' : ''}`}
      style={{ borderLeft: `3px solid ${fin ? COR.ok : sem.cor}` }}>
      {balao && !focado && p.observacao && (
        <div className="absolute left-full top-0 z-30 ml-2 w-64 whitespace-pre-wrap rounded bg-slate-800 p-2 text-[12px] text-white shadow-lg">📝 {p.observacao}</div>
      )}
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">{nomeEl}{modo === 'full' && p.observacao && ' 📝'}</div>
        {!fin && semCnpj && !renomeando && podeOperar && modo === 'compact' && (
          <button title="Renomear" onClick={() => { setNome(p.empresa?.razaoSocial ?? ''); setRenomeando(true); }} className="text-slate-400 hover:text-marca-600"><Pencil size={12} /></button>
        )}
        {modo === 'compact' && <button onClick={onAlternar} className="text-slate-400 hover:text-slate-600">{aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>}
      </div>

      {modo === 'compact' ? (
        <>
          {reginEl}{reqEl}{ticks}
          {!fin && <button onClick={onChecklist} className="text-[11px] text-marca-600 hover:underline">☑ ver checklist ({p.progresso}%)</button>}
          {!fin && aberto && (
            <div className="space-y-1.5 border-t border-slate-100 pt-1.5" {...stop}>
              <div className="flex gap-1">
                <Campinho rotulo="Valor (R$)" valor={numeroParaMoeda(p.honorario)} mascara={mascaraMoeda} onGravar={(v) => onCampo('honorario', moedaParaNumero(v))} stop={stop} dis={!podeOperar} />
                <label className="w-28">
                  <span className="text-[10px] text-slate-500">Honorário</span>
                  <select className="w-full rounded border border-slate-300 px-1 py-1 text-[11px]" value={p.honorarioSit} disabled={!podeOperar} onChange={(e) => onCampo('honorarioSit', e.target.value)}>
                    {HONORARIO_SIT.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                {semCnpj ? 'sem CNPJ no cadastro do cliente' : <>CNPJ: {p.empresa!.cnpj} <BotaoCopiar texto={p.empresa!.cnpj} /></>}
              </div>
              <Campinho rotulo="CPF" valor={p.cpf ?? ''} mascara={mascaraCpf} onGravar={(v) => onCampo('cpf', v)} stop={stop} dis={!podeOperar} />
              <label className="block">
                <span className="text-[10px] text-slate-500">Senha gov.br</span>
                <div className="flex items-center gap-1">
                  <SenhaInput valor={p.senhaGov ?? ''} ver={verSenha} onGravar={(v) => onCampo('senhaGov', v)} stop={stop} dis={!podeOperar} />
                  <button type="button" onClick={() => setVerSenha((v) => !v)} className="text-slate-400">{verSenha ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                  {p.senhaGov && <BotaoCopiar texto={p.senhaGov} />}
                </div>
              </label>
              <Observacao p={p} onCampo={onCampo} stop={stop} dis={!podeOperar} />
            </div>
          )}
          {(!aberto || fin) && p.observacao && <Observacao p={p} onCampo={onCampo} stop={stop} dis={!podeOperar || fin} amarela />}
        </>
      ) : (
        <>
          {soneca}{ticks}{reqEl}
          {!fin && <button onClick={onChecklist} className="text-[11px] text-marca-600 hover:underline">☑ ver checklist</button>}
          <Observacao p={p} onCampo={onCampo} stop={stop} dis={!podeOperar || fin} />
          <div className="text-[12px] text-slate-700">{nomeCliente(p)}</div>
          <div className="text-[11px] text-slate-500"><b>{rotuloNatureza(p.natureza)}</b> · {p.servico}</div>
          <div className="text-[11px] text-slate-500">{p.proximaAcao || 'Sem próxima ação'}</div>
          <div className="h-1 rounded bg-slate-200"><div className="h-1 rounded" style={{ width: `${progEtapa}%`, background: COR.ok }} /></div>
          {!fin && p.etapa === 'Viabilidade' && (
            <>
              {reginEl}
              <a href={LINK_REGIN} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-marca-600 hover:underline">Consultar viabilidade na JUCESC <ExternalLink size={11} /></a>
            </>
          )}
          {!fin && podeOperar && <Botao tipo="salvar" className="w-full" onClick={onEncerrar}>✓ Encerrar processo</Botao>}
        </>
      )}
      {modo === 'compact' && soneca}
    </div>
  );
}

function Campinho({ rotulo, valor, onGravar, stop, dis, mascara }: { rotulo: string; valor: string; onGravar: (v: string) => void; stop: object; dis: boolean; mascara?: (v: string) => string }) {
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  return (
    <label className="block flex-1">
      <span className="text-[10px] text-slate-500">{rotulo}</span>
      <input className="w-full rounded border border-slate-300 px-1.5 py-1 text-[12px]" value={v} disabled={dis} {...stop}
        onChange={(e) => setV(mascara ? mascara(e.target.value) : e.target.value)}
        onBlur={(e) => { (stop as { onBlur: () => void }).onBlur(); if (v !== valor) onGravar(v); e.currentTarget.blur(); }}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />
    </label>
  );
}
function SenhaInput({ valor, ver, onGravar, stop, dis }: { valor: string; ver: boolean; onGravar: (v: string) => void; stop: object; dis: boolean }) {
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  return <input type={ver ? 'text' : 'password'} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[12px]" value={v} disabled={dis} {...stop}
    onChange={(e) => setV(e.target.value)} onBlur={() => { (stop as { onBlur: () => void }).onBlur(); if (v !== valor) onGravar(v); }} />;
}
function Observacao({ p, onCampo, stop, dis, amarela }: { p: Processo; onCampo: (c: string, v: unknown, msg?: string) => void; stop: object; dis: boolean; amarela?: boolean }) {
  const [v, setV] = useState(p.observacao ?? '');
  useEffect(() => setV(p.observacao ?? ''), [p.observacao]);
  return (
    <textarea rows={Math.min(8, Math.max(2, v.split('\n').length))} placeholder="Observação" disabled={dis} {...stop}
      className={`w-full resize-none rounded border px-1.5 py-1 text-[11px] text-slate-700 ${amarela ? 'border-amber-200 bg-amber-50' : 'border-slate-300'}`}
      value={v} onChange={(e) => setV(e.target.value)}
      onBlur={() => { (stop as { onBlur: () => void }).onBlur(); if (v.trim() !== (p.observacao ?? '').trim()) onCampo('observacao', v, 'Observação salva.'); }} />
  );
}
