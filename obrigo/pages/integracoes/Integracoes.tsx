// Sistema › Integrações — API e webhooks para sistemas externos (bot de boas-vindas, n8n, Zapier...).
// Tudo por perfil (Atuan / Nauta / MEIs, o do topo). Os dados moram no ERP (/api/integracoes).
import { useCallback, useEffect, useState } from 'react';
import { Plus, Send, Pencil, Trash2, KeyRound, RefreshCw, Eye, EyeOff, RotateCcw, Copy } from 'lucide-react';
import { useToast, Modal } from '../../components/ui';
import { Botao, INP, Campo, BotaoCopiar } from '../societario/modais';
import { Selo } from '../societario/Gestao';
import { COR } from '../alvaras/comum';

interface Evento { id: string; label: string; descricao: string }
interface Chave { id: string; nome: string; prefixo: string; escrita: boolean; criado_por: string | null; criado_em: string; ultimo_uso: string | null; revogada_em: string | null }
interface Webhook {
  id: string; nome: string; url: string; eventos: string[]; segredo: string; ativo: boolean; falhas_seguidas: number; criado_por: string | null; criado_em: string;
  entregues_30d: number; pendentes: number; falhas_30d: number; ultimo_aviso: string | null;
}
interface Entrega {
  id: string; webhook_id: string; webhook_nome: string; evento: string; status: 'pendente' | 'entregue' | 'falhou'; tentativas: number; proxima_em: string;
  ultimo_codigo: number | null; ultima_resposta: string | null; ultimo_erro: string | null; criado_em: string; entregue_em: string | null; payload: unknown;
}
interface Visao { perfil: { slug: string; nome: string } | null; chaves: Chave[]; webhooks: Webhook[]; eventos: Evento[] }

async function erp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`/api/integracoes${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }, credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || `Erro ${r.status}`);
  return j as T;
}
const dt = (v: string | null) => (v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const corStatus = (s: string) => (s === 'entregue' ? COR.ok : s === 'falhou' ? COR.erro : COR.aviso);
type Aba = 'webhooks' | 'chaves' | 'historico' | 'docs';

export default function Integracoes() {
  const toast = useToast();
  const [v, setV] = useState<Visao | null>(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState<Aba>('webhooks');
  const carregar = useCallback(() => erp<Visao>('').then((x) => { setV(x); setErro(''); }).catch((e) => setErro((e as Error).message)), []);
  useEffect(() => { carregar(); }, [carregar]);

  if (erro) return <div className="-m-6 min-h-full bg-fundo p-4"><div className="card p-6 text-center text-slate-600">{erro}</div></div>;
  if (!v) return <div className="-m-6 min-h-full bg-fundo p-4 text-center text-slate-400">Carregando…</div>;

  const ativos = v.webhooks.filter((w) => w.ativo).length;
  const chavesAtivas = v.chaves.filter((c) => !c.revogada_em).length;
  const falhas = v.webhooks.reduce((s, w) => s + w.falhas_30d, 0);
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[1fr_auto]" style={{ background: COR.marinho }}>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-300">Sistema · Integrações · perfil {v.perfil?.nome ?? ''}</div>
          <div className="text-lg font-semibold">API e webhooks</div>
          <div className="text-[12px] text-slate-300">Ligue outros sistemas ao Obrigô: o webhook avisa na hora (cliente no onboarding, lead novo, contrato assinado…) e a API deixa o outro sistema consultar e gravar.</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ t: 'Webhooks ativos', n: ativos, c: COR.ok }, { t: 'Chaves de API', n: chavesAtivas, c: COR.info }, { t: 'Falhas (30 dias)', n: falhas, c: falhas ? COR.erro : '#fff' }].map((k) => (
            <div key={k.t} className="min-w-[110px] rounded bg-white/10 p-2 text-center"><div className="text-[11px] text-slate-300">{k.t}</div><div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div></div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1">
        {([['webhooks', 'Webhooks'], ['chaves', 'Chaves de API'], ['historico', 'Histórico de avisos'], ['docs', 'Como usar']] as const).map(([k, t]) => (
          <button key={k} onClick={() => setAba(k)} className={`rounded px-3 py-1.5 text-[13px] ${aba === k ? 'bg-marca-500 font-semibold text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{t}</button>
        ))}
      </div>
      {aba === 'webhooks' && <Webhooks v={v} recarregar={carregar} toast={toast} irHistorico={() => setAba('historico')} />}
      {aba === 'chaves' && <Chaves v={v} recarregar={carregar} toast={toast} />}
      {aba === 'historico' && <Historico v={v} toast={toast} />}
      {aba === 'docs' && <Docs eventos={v.eventos} />}
    </div>
  );
}

type Toast = ReturnType<typeof useToast>;

// ─── Webhooks ───────────────────────────────────────────────────────────────
function Webhooks({ v, recarregar, toast, irHistorico }: { v: Visao; recarregar: () => void; toast: Toast; irHistorico: () => void }) {
  const [editar, setEditar] = useState<Webhook | 'novo' | null>(null);
  const [verSegredo, setVerSegredo] = useState<string | null>(null);
  const [testando, setTestando] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<Webhook | null>(null);
  const nomeEvento = (id: string) => (id === '*' ? 'Todos os eventos' : v.eventos.find((e) => e.id === id)?.label ?? id);

  async function testar(w: Webhook) {
    setTestando(w.id);
    try {
      const r = await erp<{ status: string; ultimo_codigo: number | null; ultimo_erro: string | null }>(`/webhooks/${w.id}/testar`, { method: 'POST' });
      if (r.status === 'entregue') toast('ok', `Teste entregue (HTTP ${r.ultimo_codigo}).`);
      else toast('erro', `O destino não aceitou: ${r.ultimo_erro || `HTTP ${r.ultimo_codigo}`}`);
      recarregar();
    } catch (e) { toast('erro', (e as Error).message); }
    setTestando(null);
  }
  async function alternar(w: Webhook) {
    try { await erp(`/webhooks/${w.id}`, { method: 'PUT', body: JSON.stringify({ ativo: !w.ativo }) }); recarregar(); }
    catch (e) { toast('erro', (e as Error).message); }
  }
  async function novoSegredo(w: Webhook) {
    if (!confirm('Gerar outro segredo? O segredo atual para de valer na hora — atualize no outro sistema.')) return;
    try { await erp(`/webhooks/${w.id}`, { method: 'PUT', body: JSON.stringify({ novoSegredo: true }) }); setVerSegredo(w.id); recarregar(); toast('ok', 'Segredo novo gerado.'); }
    catch (e) { toast('erro', (e as Error).message); }
  }
  async function confirmarExcluir() {
    if (!excluir) return;
    try { await erp(`/webhooks/${excluir.id}`, { method: 'DELETE' }); setExcluir(null); recarregar(); toast('ok', 'Webhook excluído.'); }
    catch (e) { toast('erro', (e as Error).message); }
  }

  return (
    <div className="card p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><div className="font-semibold text-slate-700">Webhooks</div><div className="text-[12px] text-slate-500">Endereços que recebem um aviso (POST com JSON) quando o evento acontece. Ex.: o bot de boas-vindas recebe &quot;Cliente entrou no onboarding&quot; e manda a mensagem na hora.</div></div>
        <Botao tipo="novo" onClick={() => setEditar('novo')}><Plus size={13} /> Novo webhook</Botao>
      </div>
      {!v.webhooks.length ? <div className="py-8 text-center text-slate-500">Nenhum webhook ainda. Clique em <strong>Novo webhook</strong> e cole o endereço que o outro sistema te deu.</div> : (
        <div className="space-y-2">
          {v.webhooks.map((w) => (
            <div key={w.id} className="rounded-lg border border-slate-200 p-3" style={{ borderLeft: `4px solid ${w.ativo ? COR.ok : COR.neutro}` }}>
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5"><span className="font-semibold text-slate-700">{w.nome}</span><Selo cor={w.ativo ? COR.ok : COR.neutro}>{w.ativo ? 'Ativo' : 'Pausado'}</Selo>{w.falhas_seguidas >= 3 && <Selo cor={COR.erro}>{w.falhas_seguidas} falhas seguidas</Selo>}</div>
                  <div className="truncate font-mono text-[12px] text-slate-500">{w.url}</div>
                  <div className="mt-1 flex flex-wrap gap-1">{w.eventos.map((e) => <Selo key={e} cor={COR.info}>{nomeEvento(e)}</Selo>)}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                    <span>Segredo:</span>
                    <span className="font-mono">{verSegredo === w.id ? w.segredo : `${w.segredo.slice(0, 10)}••••••••`}</span>
                    <button className="text-slate-400 hover:text-marca-600" onClick={() => setVerSegredo(verSegredo === w.id ? null : w.id)} title={verSegredo === w.id ? 'Esconder' : 'Mostrar'}>{verSegredo === w.id ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                    <BotaoCopiar texto={w.segredo} rotulo="Segredo copiado." />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">Últimos 30 dias: {w.entregues_30d} entregue(s){w.falhas_30d ? ` · ${w.falhas_30d} com falha` : ''}{w.pendentes ? ` · ${w.pendentes} na fila` : ''} · último aviso {dt(w.ultimo_aviso)}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Botao tipo="info" disabled={testando === w.id} onClick={() => testar(w)}><Send size={12} /> {testando === w.id ? 'Enviando…' : 'Enviar teste'}</Botao>
                  <Botao tipo="neutro" onClick={irHistorico}>Histórico</Botao>
                  <Botao tipo={w.ativo ? 'cancelar' : 'salvar'} onClick={() => alternar(w)}>{w.ativo ? 'Pausar' : 'Ativar'}</Botao>
                  <Botao tipo="neutro" onClick={() => setEditar(w)}><Pencil size={12} /> Editar</Botao>
                  <Botao tipo="neutro" onClick={() => novoSegredo(w)} title="Gera outro segredo de assinatura"><RefreshCw size={12} /> Novo segredo</Botao>
                  <Botao tipo="excluir" onClick={() => setExcluir(w)}><Trash2 size={12} /></Botao>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {editar && <WebhookModal w={editar === 'novo' ? null : editar} eventos={v.eventos} onFechar={() => setEditar(null)} onSalvo={() => { setEditar(null); recarregar(); }} toast={toast} />}
      <Modal aberto={!!excluir} titulo="Excluir webhook?" onFechar={() => setExcluir(null)}>
        <p className="text-center text-slate-600"><strong>{excluir?.nome}</strong> para de receber avisos e o histórico dele é apagado.</p>
        <div className="mt-4 flex justify-center gap-2"><Botao tipo="cancelar" onClick={() => setExcluir(null)}>Cancelar</Botao><Botao tipo="excluir" onClick={confirmarExcluir}>Excluir</Botao></div>
      </Modal>
    </div>
  );
}

function WebhookModal({ w, eventos, onFechar, onSalvo, toast }: { w: Webhook | null; eventos: Evento[]; onFechar: () => void; onSalvo: () => void; toast: Toast }) {
  const [nome, setNome] = useState(w?.nome ?? '');
  const [url, setUrl] = useState(w?.url ?? '');
  const [sel, setSel] = useState<string[]>(w?.eventos ?? ['onboarding.iniciado']);
  const [salvando, setSalvando] = useState(false);
  const todos = sel.includes('*');
  const alternar = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s.filter((x) => x !== '*'), id]));
  async function salvar() {
    setSalvando(true);
    try {
      const body = JSON.stringify({ nome, url, eventos: sel });
      if (w) await erp(`/webhooks/${w.id}`, { method: 'PUT', body }); else await erp('/webhooks', { method: 'POST', body });
      toast('ok', w ? 'Webhook salvo.' : 'Webhook criado. Copie o segredo e use para conferir a assinatura dos avisos.');
      onSalvo();
    } catch (e) { toast('erro', (e as Error).message); }
    setSalvando(false);
  }
  return (
    <Modal aberto titulo={w ? 'Editar webhook' : 'Novo webhook'} onFechar={onFechar} largura="max-w-2xl">
      <div className="space-y-3">
        <Campo label="Nome"><input className={INP} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Bot de boas-vindas" /></Campo>
        <Campo label="URL que recebe os avisos (do outro sistema)"><input className={`${INP} font-mono`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Campo>
        <div>
          <div className="mb-1 flex items-center justify-between"><span className="text-[12px] font-medium text-slate-600">Eventos</span>
            <label className="flex items-center gap-1.5 text-[12px] text-slate-600"><input type="checkbox" checked={todos} onChange={() => setSel(todos ? [] : ['*'])} /> Todos (inclusive os que forem criados depois)</label></div>
          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {eventos.map((e) => (
              <label key={e.id} className={`flex cursor-pointer gap-2 rounded border p-2 ${todos || sel.includes(e.id) ? 'border-marca-300 bg-orange-50' : 'border-slate-200'}`}>
                <input type="checkbox" disabled={todos} checked={todos || sel.includes(e.id)} onChange={() => alternar(e.id)} className="mt-0.5" />
                <span><span className="block font-medium text-slate-700">{e.label}</span><span className="block font-mono text-[11px] text-slate-400">{e.id}</span><span className="block text-[11px] text-slate-500">{e.descricao}</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-2 pt-1"><Botao tipo="cancelar" onClick={onFechar}>Cancelar</Botao><Botao tipo="salvar" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar'}</Botao></div>
      </div>
    </Modal>
  );
}

// ─── Chaves de API ──────────────────────────────────────────────────────────
function Chaves({ v, recarregar, toast }: { v: Visao; recarregar: () => void; toast: Toast }) {
  const [criar, setCriar] = useState(false);
  const [nome, setNome] = useState('');
  const [escrita, setEscrita] = useState(false);
  const [nova, setNova] = useState<string | null>(null);
  const [revogar, setRevogar] = useState<Chave | null>(null);
  async function gerar() {
    try { const r = await erp<{ chave: string }>('/chaves', { method: 'POST', body: JSON.stringify({ nome, escrita }) }); setCriar(false); setNome(''); setEscrita(false); setNova(r.chave); recarregar(); }
    catch (e) { toast('erro', (e as Error).message); }
  }
  async function confirmarRevogar() {
    if (!revogar) return;
    try { await erp(`/chaves/${revogar.id}`, { method: 'DELETE' }); setRevogar(null); recarregar(); toast('ok', 'Chave revogada.'); }
    catch (e) { toast('erro', (e as Error).message); }
  }
  return (
    <div className="card p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><div className="font-semibold text-slate-700">Chaves de API</div><div className="text-[12px] text-slate-500">O outro sistema usa a chave para consultar (e, se permitido, gravar) dados deste perfil. Uma chave por sistema: se um vazar, você revoga só ela.</div></div>
        <Botao tipo="novo" onClick={() => setCriar(true)}><KeyRound size={13} /> Gerar chave</Botao>
      </div>
      {!v.chaves.length ? <div className="py-8 text-center text-slate-500">Nenhuma chave ainda.</div> : (
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1.5">Nome</th><th>Chave</th><th>Permissão</th><th>Criada</th><th>Último uso</th><th /></tr></thead>
          <tbody>{v.chaves.map((c) => (
            <tr key={c.id} className={`border-b border-slate-100 ${c.revogada_em ? 'text-slate-400' : ''}`}>
              <td className="py-1.5 font-medium">{c.nome}</td>
              <td className="font-mono text-[12px]">{c.prefixo}…</td>
              <td>{c.revogada_em ? <Selo cor={COR.neutro}>Revogada {dt(c.revogada_em)}</Selo> : <Selo cor={c.escrita ? COR.novo : COR.info}>{c.escrita ? 'Leitura e escrita' : 'Só leitura'}</Selo>}</td>
              <td className="text-[12px]">{dt(c.criado_em)}{c.criado_por ? ` · ${c.criado_por}` : ''}</td>
              <td className="text-[12px]">{dt(c.ultimo_uso)}</td>
              <td className="text-right">{!c.revogada_em && <Botao tipo="excluir" onClick={() => setRevogar(c)}>Revogar</Botao>}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
      <Modal aberto={criar} titulo="Gerar chave de API" onFechar={() => setCriar(false)}>
        <div className="space-y-3">
          <Campo label="Para qual sistema?"><input className={INP} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Bot de boas-vindas" /></Campo>
          <label className="flex items-start gap-2 rounded border border-slate-200 p-2 text-[13px]"><input type="checkbox" checked={escrita} onChange={(e) => setEscrita(e.target.checked)} className="mt-0.5" />
            <span><span className="block font-medium text-slate-700">Permitir escrita</span><span className="block text-[12px] text-slate-500">Criar lead e marcar/desmarcar itens do onboarding. Sem isso, a chave só consulta.</span></span></label>
          <div className="flex justify-center gap-2"><Botao tipo="cancelar" onClick={() => setCriar(false)}>Cancelar</Botao><Botao tipo="salvar" onClick={gerar}>Gerar</Botao></div>
        </div>
      </Modal>
      <Modal aberto={!!nova} titulo="Chave gerada" onFechar={() => setNova(null)}>
        <div className="space-y-3 text-center">
          <p className="text-slate-600">Copie agora: por segurança, a chave <strong>não aparece de novo</strong>. Se perder, revogue e gere outra.</p>
          <div className="break-all rounded border border-slate-200 bg-slate-50 p-3 font-mono text-[12px] text-slate-700">{nova}</div>
          <div className="flex justify-center gap-2">
            <Botao tipo="info" onClick={async () => { try { await navigator.clipboard.writeText(nova ?? ''); toast('ok', 'Chave copiada.'); } catch { toast('erro', 'Não consegui copiar — selecione e copie à mão.'); } }}><Copy size={12} /> Copiar</Botao>
            <Botao tipo="salvar" onClick={() => setNova(null)}>Já copiei</Botao>
          </div>
        </div>
      </Modal>
      <Modal aberto={!!revogar} titulo="Revogar chave?" onFechar={() => setRevogar(null)}>
        <p className="text-center text-slate-600">O sistema que usa <strong>{revogar?.nome}</strong> perde o acesso na hora.</p>
        <div className="mt-4 flex justify-center gap-2"><Botao tipo="cancelar" onClick={() => setRevogar(null)}>Cancelar</Botao><Botao tipo="excluir" onClick={confirmarRevogar}>Revogar</Botao></div>
      </Modal>
    </div>
  );
}

// ─── Histórico de avisos ────────────────────────────────────────────────────
function Historico({ v, toast }: { v: Visao; toast: Toast }) {
  const [lista, setLista] = useState<Entrega[]>([]);
  const [f, setF] = useState({ webhookId: '', status: '' });
  const [ver, setVer] = useState<Entrega | null>(null);
  const [mais, setMais] = useState(true);
  const [reenv, setReenv] = useState<string | null>(null);
  const carregar = useCallback(async (antes?: string) => {
    const q = new URLSearchParams(Object.entries({ ...f, antes: antes ?? '' }).filter(([, x]) => x));
    const r = await erp<Entrega[]>(`/entregas?${q}`).catch((e) => { toast('erro', (e as Error).message); return [] as Entrega[]; });
    setLista((l) => (antes ? [...l, ...r] : r)); setMais(r.length === 50);
  }, [f, toast]);
  useEffect(() => { carregar(); }, [carregar]);
  async function reenviar(e: Entrega) {
    setReenv(e.id);
    try {
      const r = await erp<{ status: string; ultimo_codigo: number | null; ultimo_erro: string | null }>(`/entregas/${e.id}/reenviar`, { method: 'POST' });
      toast(r.status === 'entregue' ? 'ok' : 'erro', r.status === 'entregue' ? 'Reenviado e entregue.' : `Ainda falhou: ${r.ultimo_erro || `HTTP ${r.ultimo_codigo}`}`);
      carregar();
    } catch (x) { toast('erro', (x as Error).message); }
    setReenv(null);
  }
  return (
    <div className="card p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div><div className="font-semibold text-slate-700">Histórico de avisos</div><div className="text-[12px] text-slate-500">Cada aviso enviado, com a resposta do outro sistema. Se falhar, o Obrigô tenta de novo sozinho (1, 5, 15 min, 1 h, 6 h e 24 h) e depois desiste — aí dá para reenviar daqui.</div></div>
        <Botao tipo="info" onClick={() => carregar()}><RefreshCw size={12} /> Atualizar</Botao>
      </div>
      <div className="mb-2 flex flex-wrap justify-center gap-2">
        <select className={`${INP} w-56`} value={f.webhookId} onChange={(e) => setF({ ...f, webhookId: e.target.value })}><option value="">Todos os webhooks</option>{v.webhooks.map((w) => <option key={w.id} value={w.id}>{w.nome}</option>)}</select>
        <select className={`${INP} w-44`} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Todas as situações</option><option value="entregue">Entregues</option><option value="pendente">Na fila / tentando</option><option value="falhou">Falharam</option></select>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1.5">Quando</th><th>Evento</th><th>Webhook</th><th>Situação</th><th>Resposta</th><th /></tr></thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 align-top">
                <td className="py-1.5 text-[12px]">{dt(e.criado_em)}</td>
                <td className="font-mono text-[12px]">{e.evento}</td>
                <td>{e.webhook_nome}</td>
                <td><Selo cor={corStatus(e.status)}>{e.status === 'pendente' ? (e.tentativas ? `tentando (${e.tentativas}x)` : 'na fila') : e.status}</Selo>{e.status === 'pendente' && e.tentativas > 0 && <div className="text-[11px] text-slate-400">próxima {dt(e.proxima_em)}</div>}</td>
                <td className="max-w-[260px] truncate text-[12px] text-slate-500">{e.ultimo_codigo ? `HTTP ${e.ultimo_codigo}` : ''}{e.ultimo_erro ? ` ${e.ultimo_erro}` : ''}</td>
                <td className="whitespace-nowrap text-right">
                  <button className="mr-2 text-[12px] text-marca-600 hover:underline" onClick={() => setVer(e)}>Ver</button>
                  <Botao tipo="neutro" disabled={reenv === e.id} onClick={() => reenviar(e)}><RotateCcw size={11} /> {reenv === e.id ? '…' : 'Reenviar'}</Botao>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lista.length && <div className="py-8 text-center text-slate-500">Nenhum aviso ainda.</div>}
      </div>
      {mais && lista.length > 0 && <div className="mt-2 text-center"><Botao tipo="neutro" onClick={() => carregar(lista[lista.length - 1].criado_em)}>Carregar mais</Botao></div>}
      <Modal aberto={!!ver} titulo={`Aviso ${ver?.evento ?? ''}`} onFechar={() => setVer(null)} largura="max-w-3xl">
        {ver && (
          <div className="space-y-2 text-[12px]">
            <div className="text-slate-500">Enviado para <strong>{ver.webhook_nome}</strong> · {ver.tentativas} tentativa(s) · {ver.entregue_em ? `entregue ${dt(ver.entregue_em)}` : ver.status}</div>
            <div className="font-medium text-slate-600">Corpo enviado</div>
            <pre className="max-h-80 overflow-auto rounded bg-slate-900 p-3 text-[11px] text-slate-100">{JSON.stringify(ver.payload, null, 2)}</pre>
            <div className="font-medium text-slate-600">Resposta do destino</div>
            <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-3 text-[11px] text-slate-700">{ver.ultimo_codigo ? `HTTP ${ver.ultimo_codigo}\n` : ''}{ver.ultima_resposta || ver.ultimo_erro || '—'}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Como usar (documentação para quem vai integrar) ────────────────────────
function Bloco({ children }: { children: string }) {
  return <div className="relative"><pre className="overflow-auto rounded bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">{children}</pre><span className="absolute right-2 top-2"><BotaoCopiar texto={children} rotulo="Copiado." /></span></div>;
}
function Docs({ eventos }: { eventos: Evento[] }) {
  const base = `${typeof window !== 'undefined' ? window.location.origin : 'https://obrigo.com.br'}/api/v1`;
  const H = ({ children }: { children: React.ReactNode }) => <div className="pt-2 font-semibold text-slate-700">{children}</div>;
  return (
    <div className="card space-y-2 p-4 text-[13px] text-slate-600">
      <div className="text-center"><div className="text-[15px] font-semibold text-slate-700">Como integrar com o Obrigô</div><div className="text-[12px] text-slate-500">Mande esta página para quem vai configurar o outro sistema.</div></div>

      <H>1. Webhook — o Obrigô avisa o seu sistema</H>
      <p>Cadastre a URL do seu sistema na aba <strong>Webhooks</strong> e escolha os eventos. Quando acontecer, o Obrigô faz um <strong>POST</strong> com JSON nesta forma:</p>
      <Bloco>{`{
  "id": "6f1c...",                 // id do evento (o mesmo em todas as tentativas: use para não processar 2x)
  "evento": "onboarding.iniciado",
  "criado_em": "2026-10-23T14:05:00.000Z",
  "perfil": "atuan",               // atuan | nauta | meis
  "dados": {
    "categoria": "abertura",
    "lead": {
      "id": "b2a4...", "nome": "Maria Souza", "whatsapp": "48999990000", "email": "maria@x.com",
      "interesse": "Abertura de empresa", "origem": "Site", "honorario": 350,
      "onboarding": { "ativo": true, "categoria": "abertura", "iniciado_em": "...", "concluido": false },
      "empresa": { "cliente_id": "...", "razao_social": "MARIA SOUZA LTDA", "cnpj": "...", "telefone": "...", "email": "...", "responsavel": "Maria Souza" }
    }
  }
}`}</Bloco>
      <p>Responda com <strong>HTTP 2xx em até 10 segundos</strong>. Qualquer outra resposta (ou demora) conta como falha e o Obrigô tenta de novo depois de 1, 5 e 15 minutos, 1 hora, 6 horas e 24 horas.</p>
      <p>Cabeçalhos enviados: <code>X-Obrigo-Evento</code>, <code>X-Obrigo-Entrega</code>, <code>X-Obrigo-Timestamp</code> e <code>X-Obrigo-Assinatura</code>.</p>

      <H>Conferir a assinatura (recomendado)</H>
      <p>A assinatura é <code>sha256=</code> + HMAC-SHA256 do texto <code>{'{timestamp}.{corpo}'}</code> com o segredo do webhook. Exemplo em Node.js:</p>
      <Bloco>{`const crypto = require('crypto')
function avisoValido(req, corpoBruto, segredo) {
  const ts = req.headers['x-obrigo-timestamp']
  const esperado = 'sha256=' + crypto.createHmac('sha256', segredo).update(ts + '.' + corpoBruto).digest('hex')
  const recebido = req.headers['x-obrigo-assinatura'] || ''
  const recente = Math.abs(Date.now() / 1000 - Number(ts)) < 300 // até 5 minutos
  return recente && recebido.length === esperado.length && crypto.timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado))
}`}</Bloco>

      <H>Eventos</H>
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {eventos.map((e) => <div key={e.id} className="rounded border border-slate-200 p-2"><div className="font-mono text-[12px] text-marca-600">{e.id}</div><div className="font-medium text-slate-700">{e.label}</div><div className="text-[12px] text-slate-500">{e.descricao}</div></div>)}
        <div className="rounded border border-slate-200 p-2"><div className="font-mono text-[12px] text-marca-600">teste.ping</div><div className="font-medium text-slate-700">Teste</div><div className="text-[12px] text-slate-500">Enviado pelo botão &quot;Enviar teste&quot;.</div></div>
      </div>
      <p className="text-[12px]">Nos eventos do onboarding vem também <code>setor</code>, <code>item</code>, <code>feito</code> e <code>por</code>; em <code>contrato.assinado</code> vem <code>contrato</code> (id, tipo, forma eletrônica/manual); em <code>empresa.cadastrada</code> vem <code>empresa</code> (id, razão social, CNPJ, origem manual/erp).</p>

      <H>2. API — o seu sistema consulta o Obrigô</H>
      <p>Gere uma chave na aba <strong>Chaves de API</strong> e envie em todo pedido no cabeçalho <code>Authorization: Bearer obr_...</code>. A chave só enxerga o perfil em que foi criada.</p>
      <Bloco>{`curl ${base} -H "Authorization: Bearer obr_SUA_CHAVE"`}</Bloco>
      <div className="overflow-auto">
        <table className="w-full text-[12px]">
          <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-1">Método</th><th>Endereço</th><th>O que faz</th></tr></thead>
          <tbody className="font-mono">
            {[
              ['GET', '/api/v1', 'confere a chave e lista os endpoints'],
              ['GET', '/api/v1/onboarding', 'clientes no onboarding, com o checklist por setor (?concluidos=1 inclui os concluídos)'],
              ['GET', '/api/v1/onboarding/{leadId}', 'um cliente do onboarding'],
              ['POST', '/api/v1/onboarding/{leadId}/itens', 'marca/desmarca item: {"item":"atendente:acessorias","feito":true} (escrita)'],
              ['GET', '/api/v1/leads', 'leads (?desde=ISO, ?etapa=, ?limite=até 200)'],
              ['POST', '/api/v1/leads', 'cria lead: {"nome","whatsapp","email","interesse","origem"} (escrita)'],
              ['GET', '/api/v1/leads/{id}', 'um lead, com empresa e contratos'],
              ['GET', '/api/v1/clientes', 'cadastro das empresas (?busca=, ?cnpj=, ?limite=)'],
              ['GET', '/api/v1/clientes/{id}', 'uma empresa'],
            ].map(([m, p, d]) => <tr key={p + m} className="border-b border-slate-100"><td className="py-1 pr-2 font-semibold" style={{ color: m === 'GET' ? COR.info : COR.novo }}>{m}</td><td className="pr-2">{p}</td><td className="font-sans text-slate-500">{d}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="text-[12px]">Erros vêm como <code>{'{ "erro": { "codigo": "...", "mensagem": "..." } }'}</code> (401 chave inválida, 403 chave só de leitura, 404 não encontrado, 422 dado inválido).</p>
      <Bloco>{`# marcar um item do checklist do onboarding (chave com escrita)
curl -X POST ${base}/onboarding/ID_DO_LEAD/itens \\
  -H "Authorization: Bearer obr_SUA_CHAVE" -H "Content-Type: application/json" \\
  -d '{"item":"atendente:acessorias","feito":true}'`}</Bloco>
      <p className="text-[12px] text-slate-500">Os códigos dos itens (ex.: <code>atendente:acessorias</code>) aparecem em <code>GET /api/v1/onboarding/{'{leadId}'}</code>, campo <code>setores[].itens[].item</code>.</p>
    </div>
  );
}
