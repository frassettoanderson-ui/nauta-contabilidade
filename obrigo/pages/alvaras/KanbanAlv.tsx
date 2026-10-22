// Alvaras › Kanban de legalizacao — alimentado automaticamente pelo Societario concluido.
import { useRef, useState } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { Anel } from '../societario/Kanban';
import { Selo } from '../societario/Gestao';
import { COR, ETAPAS_LEGAL, TIPOS_PROCESSO, alvApi, nomeLic, diasAte, dataBR, arquivado, corValidade, type Legalizacao } from './comum';
import { NovaLegalizacaoModal, CartaoModal, InativarModal, Botao, erroMsg } from './modais';
import { useAlvaras } from './Painel';

export default function KanbanAlvaras() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'alvaras_operar');
  const toast = useToast();
  const { licencas, legalizacoes, empresas, recarregar, setLegalizacoes } = useAlvaras();
  const [ui, setUi] = useState({ tipo: '', arquivados: false, inativos: false, exibicao: 'auto' as 'auto' | 'compact' | 'full' });
  const [nova, setNova] = useState(false);
  const [cartao, setCartao] = useState<Legalizacao | null>(null);
  const [inativar, setInativar] = useState<{ empresaId: string; nome: string; inativo: boolean } | null>(null);
  const [faltaVenc, setFaltaVenc] = useState<Set<string>>(new Set());
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  const ativos = legalizacoes.filter((c) => !c.inativo && !c.ocultoNoIniciar && c.etapa !== 'Concluído');
  const emExig = licencas.filter((l) => !l.inativo && l.situacao === 'Em exigência').length;
  const vencidas = licencas.filter((l) => !l.inativo && l.validade && (diasAte(l.validade) ?? 0) < 0).length;
  const pct = ativos.length ? Math.round(((ativos.length - Math.min(emExig, ativos.length)) / ativos.length) * 100) : 100;
  const visiveis = legalizacoes.filter((c) => !c.ocultoNoIniciar && (!ui.tipo || (c.tipoProcesso || 'Manual') === ui.tipo) && (ui.inativos || !c.inativo) && (ui.arquivados || !arquivado(c)));
  const arquivadosQtd = legalizacoes.filter((c) => arquivado(c)).length;

  function atualizarLocal(id: string, patch: Partial<Legalizacao>) { setLegalizacoes((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x))); }
  async function soltar(c: Legalizacao, destino: string) {
    if (!podeOperar) return toast('erro', 'Seu nível de acesso é somente de consulta.');
    if (c.etapa === destino) return;
    if (c.etapa === 'A iniciar') return toast('erro', 'Clique na empresa e marque os alvarás — cada um vira um cartão em “Consulta / protocolo”.');
    try {
      const r = await alvApi.mover(c.id, destino);
      toast('ok', r.aviso || `${nomeLic(c)} → ${destino}`);
      setFaltaVenc((s) => { const n = new Set(s); n.delete(c.id); return n; });
      recarregar();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'FALTA_VENCIMENTO') { setFaltaVenc((s) => new Set(s).add(c.id)); toast('erro', e.message); }
      else toast('erro', erroMsg(e));
    }
  }
  async function taxa(c: Legalizacao, paga: boolean) {
    if (!podeOperar) return toast('erro', 'Seu nível de acesso é somente de consulta.');
    try { await alvApi.taxa(c.id, paga); atualizarLocal(c.id, { taxaPaga: paga }); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function vencimento(c: Legalizacao, v: string) {
    try {
      await alvApi.vencimento(c.id, v || null); atualizarLocal(c.id, { vencimento: v || null });
      if (v && faltaVenc.has(c.id)) { setFaltaVenc((s) => { const n = new Set(s); n.delete(c.id); return n; }); toast('ok', 'Data registrada — agora dá para mover o cartão para Concluído.'); }
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function tirar(c: Legalizacao) {
    if (!confirm(`Tirar ${nomeLic(c)} do Kanban? O cartão sai do quadro, mas o alvará continua em Vencimentos e renovações.`)) return;
    try { await alvApi.tirar(c.id); toast('ok', 'Cartão retirado do quadro.'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function puxar() {
    try {
      const p = await alvApi.pendentes();
      if (!p.length) return toast('ok', 'Nenhum concluído pendente para puxar.');
      if (!confirm(`${p.length} processo(s) concluído(s) do Societário ainda não têm cartão aqui. Puxar para “A iniciar”?`)) return;
      const r = await alvApi.puxar(); toast('ok', `${r.criados} cartão(ões) criado(s).`); recarregar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  const sel = 'rounded border border-slate-300 px-1 py-0.5';

  return (
    <div className="-m-6 min-h-full bg-fundo p-4 text-[13px]">
      <div className="mb-3 grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr_auto]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div><div className="text-[11px] uppercase tracking-wide text-slate-300">Alvarás · legalização</div><div className="text-lg font-semibold">Kanban de legalização</div>
            <div className="text-[12px] text-slate-300">Alimentado automaticamente pelo Societário concluído.</div></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ t: 'No quadro', n: ativos.length, c: COR.info }, { t: 'Em exigência', n: emExig, c: COR.aviso }, { t: 'Licenças vencidas', n: vencidas, c: COR.erro }].map((k) => (
            <div key={k.t} className="rounded bg-white/10 p-2 text-center"><div className="text-[11px] text-slate-300">{k.t}</div><div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div></div>
          ))}
        </div>
        <div className="flex flex-col items-end gap-2">
          {podeOperar && <Botao tipo="info" onClick={puxar}><RotateCcw size={13} /> Puxar concluídos</Botao>}
          {podeOperar && <Botao tipo="novo" onClick={() => setNova(true)}><Plus size={13} /> Nova legalização</Botao>}
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-center justify-end gap-3 rounded border border-slate-200 bg-white p-2 text-[12px] text-slate-600">
        <label>Tipo <select className={sel} value={ui.tipo} onChange={(e) => setUi({ ...ui, tipo: e.target.value })}><option value="">Todos</option>{TIPOS_PROCESSO.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Concluídos arquivados <select className={sel} value={ui.arquivados ? '1' : ''} onChange={(e) => setUi({ ...ui, arquivados: !!e.target.value })}><option value="">Ocultar</option><option value="1">Mostrar</option></select></label>
        <label>Clientes inativos <select className={sel} value={ui.inativos ? '1' : ''} onChange={(e) => setUi({ ...ui, inativos: !!e.target.value })}><option value="">Ocultar</option><option value="1">Mostrar</option></select></label>
        <label>Exibição <select className={sel} value={ui.exibicao} onChange={(e) => setUi({ ...ui, exibicao: e.target.value as typeof ui.exibicao })}><option value="auto">Automática</option><option value="compact">Só o nome</option><option value="full">Completa</option></select></label>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-3">
        {ETAPAS_LEGAL.map((col, ci) => {
          const cartoes = visiveis.filter((c) => c.etapa === col);
          return (
            <div key={col} onDragOver={(e) => { e.preventDefault(); setSobre(col); }} onDragLeave={() => setSobre((s) => (s === col ? null : s))}
              onDrop={(e) => { e.preventDefault(); setSobre(null); const c = legalizacoes.find((x) => x.id === arrastando); setArrastando(null); if (c) soltar(c, col); }}
              className={`flex min-w-[200px] flex-1 flex-col rounded-lg border ${sobre === col ? 'border-marca-400 bg-marca-50' : 'border-slate-200 bg-slate-100/70'}`}>
              <div className="flex items-center justify-between rounded-t-lg px-2.5 py-2 text-[12px] font-semibold text-white" style={{ background: col === 'Concluído' ? COR.ok : COR.marinho }}>
                <span>{col}</span><span className="rounded bg-white/20 px-1.5">{cartoes.length}</span>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {col === 'Concluído' && !ui.arquivados && arquivadosQtd > 0 && <div className="text-center text-[11px] text-slate-500">{arquivadosQtd} concluído(s) arquivado(s) — já constam em Vencimentos.</div>}
                {cartoes.length === 0 && <div className="py-4 text-center text-[12px] text-slate-400">Sem processos</div>}
                {cartoes.map((c) => {
                  const compacto = !faltaVenc.has(c.id) && ci !== 1 && ci !== 2 && (ui.exibicao === 'compact' || (ui.exibicao === 'auto' && cartoes.length > 6));
                  return (
                    <Cartao key={c.id} c={c} compacto={compacto} falta={faltaVenc.has(c.id)} podeOperar={podeOperar}
                      onArrastar={() => setArrastando(c.id)} onAbrir={() => setCartao(c)} onTirar={() => tirar(c)}
                      onTaxa={(v) => taxa(c, v)} onVencimento={(v) => vencimento(c, v)} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <NovaLegalizacaoModal aberto={nova} empresas={empresas} onFechar={() => setNova(false)} onCriada={(c) => { recarregar(); setCartao({ ...c, empresa: null }); }} />
      <CartaoModal cartao={cartao} onFechar={() => setCartao(null)} onSalvo={recarregar} podeOperar={podeOperar}
        onInativar={(c) => c.empresaId && setInativar({ empresaId: c.empresaId, nome: nomeLic(c), inativo: c.inativo })} />
      <InativarModal alvo={inativar} onFechar={() => setInativar(null)} onFeito={recarregar} licencas={licencas} legalizacoes={legalizacoes} />
    </div>
  );
}

function Cartao({ c, compacto, falta, podeOperar, onArrastar, onAbrir, onTirar, onTaxa, onVencimento }: {
  c: Legalizacao; compacto: boolean; falta: boolean; podeOperar: boolean; onArrastar: () => void; onAbrir: () => void; onTirar: () => void;
  onTaxa: (v: boolean) => void; onVencimento: (v: string) => void;
}) {
  const [balao, setBalao] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const iniciar = c.etapa === 'A iniciar';
  const i = ETAPAS_LEGAL.indexOf(c.etapa as never);
  const desc = iniciar ? ((c.alvarasPrevistos ?? []).length ? `${c.alvarasPrevistos!.length} alvará(s) selecionado(s)` : 'Marque os alvarás desta empresa') : `${c.tipo}${c.orgao ? ` · ${c.orgao}` : ''}`;
  const pare = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div draggable={podeOperar && !iniciar} onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onArrastar(); }} onClick={onAbrir}
      onMouseEnter={() => { timer.current = setTimeout(() => setBalao(true), 2000); }} onMouseLeave={() => { clearTimeout(timer.current); setBalao(false); }}
      className={`relative cursor-pointer space-y-1 rounded-md border bg-white p-2 shadow-sm ${c.inativo ? 'opacity-60' : ''}`} style={{ borderLeft: `3px solid ${c.etapa === 'Concluído' ? COR.ok : COR.info}` }}>
      {balao && (
        <div className="absolute left-full top-0 z-30 ml-2 w-64 rounded bg-slate-800 p-2 text-[12px] text-white shadow-lg">
          <b>{nomeLic(c)}</b><div>{c.tipo}{c.orgao ? ` · ${c.orgao}` : ''}</div>
          {(c.alvarasPrevistos ?? []).length > 0 && <div className="mt-1">{c.alvarasPrevistos!.join(' · ')}</div>}
          <div className="mt-1 whitespace-pre-wrap text-slate-300">{c.observacao || 'Sem observação registrada'}</div>
        </div>
      )}
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1 text-[13px] font-semibold text-slate-800">{nomeLic(c)}</div>
        {podeOperar && <button title="Tirar do quadro" onClick={(e) => { pare(e); onTirar(); }} className="text-slate-300 hover:text-red-500"><X size={13} /></button>}
      </div>
      <div className="text-[11px] text-slate-500">{desc}</div>
      {iniciar && <div className="text-[11px]" style={{ color: COR.info }}>👆 Clique para marcar os alvarás e avançar</div>}
      {!compacto && (
        <>
          {c.protocolo && <div className="text-[11px] text-slate-500">Protocolo: {c.protocolo}</div>}
          {(i === 1 || i === 2) && (
            <label className="flex items-center gap-1.5 text-[12px]" style={{ color: c.taxaPaga ? COR.ok : COR.novo }} onClick={pare}>
              <input type="checkbox" className="accent-marca-600" checked={c.taxaPaga} disabled={!podeOperar} onChange={(e) => onTaxa(e.target.checked)} />
              {c.taxaPaga ? '✓ Taxa paga' : 'Marcar quando a taxa for paga'}
            </label>
          )}
          <div className="flex flex-wrap gap-1">
            <Selo cor={COR.neutro}>{c.tipoProcesso || 'Manual'}</Selo>
            {c.prazo && <Selo cor={corValidade(c.prazo)}>{dataBR(c.prazo.slice(0, 10))}</Selo>}
            {c.inativo && <Selo cor={COR.aviso}>cliente inativo</Selo>}
          </div>
          {falta && <div className="rounded border border-red-200 bg-red-50 p-1.5 text-[11px]" style={{ color: COR.erro }}>⚠ Obrigatório: informe a data de vencimento antes de mover para Concluído.</div>}
          {(i >= 3 || falta) && (
            <label className="block text-[11px] text-slate-500" onClick={pare}>
              Validade da nova licença
              <input type="date" className="w-full rounded border border-slate-300 px-1.5 py-1 text-[12px]" defaultValue={c.vencimento?.slice(0, 10) ?? ''} disabled={!podeOperar}
                onChange={(e) => onVencimento(e.target.value)} />
            </label>
          )}
        </>
      )}
    </div>
  );
}
