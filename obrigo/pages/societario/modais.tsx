// Janelas do Societario: novo processo, ficha, checklist, confirmacao de alteracao, conclusao e "fora do quadro".
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Copy, ExternalLink, Search } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Modal, useToast } from '../../components/ui';
import {
  COR, ETAPAS, SERVICOS, NATUREZAS, SITUACOES, DEPENDE_DE, HONORARIO_SIT, FRENTES, TIPOS_CLIENTE, LINK_REGIN,
  socApi, mascaraCnpj, mascaraCpf, mascaraMoeda, moedaParaNumero, numeroParaMoeda, nomeCliente, rotuloNatureza,
  precisaCadastroEconomico, mexeComAlvara, copiar, dataHoraBR, type Processo, type Historico,
} from './comum';

export const erroMsg = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro inesperado.');
export const INP = 'w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-marca-400 focus:ring-1 focus:ring-marca-100';
const LBL = 'mb-1 block text-[12px] font-medium text-slate-600';

// Botoes no padrao Obrigo (Salvar verde, Novo laranja, Cancelar/Voltar amarelo, Excluir vermelho)
export function Botao({ tipo = 'novo', children, className = '', ...rest }: { tipo?: 'salvar' | 'novo' | 'cancelar' | 'excluir' | 'info' | 'neutro' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cor = { salvar: COR.ok, novo: COR.novo, cancelar: COR.aviso, excluir: COR.erro, info: COR.info, neutro: '#64748b' }[tipo];
  return (
    <button {...rest} style={{ background: cor, color: '#fff' }}
      className={`inline-flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
      {children}
    </button>
  );
}
export function Campo({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className={LBL}>{label}</span>{children}</label>;
}

// ─── Busca de empresa (cliente) ─────────────────────────────────────────────
interface EmpresaBusca { id: string; razaoSocial: string; identificadores?: { tipo: string; valor: string }[] }
function BuscaEmpresa({ valor, onEscolher }: { valor: { id: string; nome: string } | null; onEscolher: (e: { id: string; nome: string }) => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<EmpresaBusca[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const t = setTimeout(() => {
      api.get<{ items?: EmpresaBusca[] } | EmpresaBusca[]>(`/empresas?busca=${encodeURIComponent(q.trim())}&status=todos&limit=12`)
        .then((r) => setRes(Array.isArray(r) ? r : r.items ?? [])).catch(() => setRes([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div>
      <div className="mb-1 text-[13px] font-medium text-slate-700">{valor?.nome ?? 'Nenhum cliente'}</div>
      <div className="relative">
        <Search size={14} className="absolute left-2 top-2 text-slate-400" />
        <input className={`${INP} pl-7`} placeholder="Trocar cliente: digite o nome ou CNPJ" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {res.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white text-[13px] shadow">
          {res.map((e) => (
            <button key={e.id} type="button" onClick={() => { onEscolher({ id: e.id, nome: e.razaoSocial }); setQ(''); setRes([]); }}
              className="block w-full px-3 py-1.5 text-left hover:bg-marca-50">
              {e.razaoSocial} <span className="text-slate-400">{e.identificadores?.find((i) => i.tipo === 'CNPJ')?.valor ?? ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Novo processo (rapido) ─────────────────────────────────────────────────
interface DadosCnpj { razaoSocial: string; nomeFantasia: string; cep: string; logradouro: string; numeroEndereco: string; complemento: string; bairro: string; cidade: string; uf: string; telefone: string; email: string; atividade: string }
export function NovoProcessoModal({ aberto, onFechar, onCriado, frentePadrao }: { aberto: boolean; onFechar: () => void; onCriado: (p: Processo) => void; frentePadrao?: string }) {
  const toast = useToast();
  const [cnpj, setCnpj] = useState('');
  const [dados, setDados] = useState<DadosCnpj | null>(null);
  const [msgCnpj, setMsgCnpj] = useState('');
  const [f, setF] = useState({ nome: '', carteira: '', servico: '', cpf: '', senhaGov: '', observacao: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (aberto) { setCnpj(''); setDados(null); setMsgCnpj(''); setF({ nome: '', carteira: frentePadrao && frentePadrao !== 'todas' ? frentePadrao : '', servico: '', cpf: '', senhaGov: '', observacao: '' }); }
  }, [aberto, frentePadrao]);
  async function buscarCnpj() {
    const d = cnpj.replace(/\D/g, '');
    if (d.length !== 14) { setMsgCnpj('Digite um CNPJ com 14 dígitos.'); return; }
    setMsgCnpj('Consultando a Receita…');
    try {
      const r = await api.get<DadosCnpj>(`/empresas/consulta-cnpj/${d}`);
      setDados(r); setF((s) => ({ ...s, nome: r.razaoSocial || s.nome })); setMsgCnpj('');
    } catch (e) { setDados(null); setMsgCnpj(erroMsg(e)); }
  }
  async function criar() {
    if (!f.nome.trim()) return toast('erro', 'Informe o nome da empresa.');
    if (!f.servico) return toast('erro', 'Escolha o tipo de processo.');
    if (!f.carteira) return toast('erro', 'Escolha a carteira.');
    setBusy(true);
    try {
      const d = cnpj.replace(/\D/g, '');
      const p = await socApi.criar({
        nome: f.nome.trim(), carteira: f.carteira, servico: f.servico, cpf: f.cpf || undefined, senhaGov: f.senhaGov || undefined,
        observacao: f.observacao || undefined,
        dados: { cnpj: d.length === 14 ? d : undefined, ...(dados ? {
          nomeFantasia: dados.nomeFantasia, email: dados.email, telefone: dados.telefone, cep: dados.cep, logradouro: dados.logradouro,
          numeroEndereco: dados.numeroEndereco, complemento: dados.complemento, bairro: dados.bairro, cidade: dados.cidade, uf: dados.uf, atividade: dados.atividade,
        } : {}) },
      });
      toast('ok', p.clienteJaCadastrado ? `Processo ${p.codigo} criado para ${nomeCliente(p)} — este CNPJ já tinha cadastro, e o processo foi ligado a ele.` : `Processo ${p.codigo} criado para ${nomeCliente(p)}.`);
      onCriado(p); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); } finally { setBusy(false); }
  }
  return (
    <Modal aberto={aberto} titulo="Novo processo" onFechar={onFechar} largura="max-w-xl">
      <p className="-mt-2 mb-4 text-center text-[13px] text-slate-500">Nome da empresa, tipo de processo e carteira — o resto entra depois.</p>
      <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3">
        <div className="mb-1 text-center text-[12px] font-medium text-slate-600">Importar dados pelo CNPJ (opcional)</div>
        <div className="flex gap-2">
          <input className={INP} placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(mascaraCnpj(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && buscarCnpj()} />
          <Botao tipo="info" type="button" onClick={buscarCnpj}>Buscar e preencher</Botao>
        </div>
        {msgCnpj && <div className="mt-1 text-center text-[12px] text-slate-500">{msgCnpj}</div>}
        {dados && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[12px] text-slate-600">
            <div className="col-span-2 text-center font-medium text-slate-700">Dados encontrados na Receita</div>
            <div><b>Razão social:</b> {dados.razaoSocial || '—'}</div><div><b>Fantasia:</b> {dados.nomeFantasia || '—'}</div>
            <div><b>Cidade/UF:</b> {dados.cidade}/{dados.uf}</div><div><b>Telefone:</b> {dados.telefone || '—'}</div>
            <div className="col-span-2"><b>Atividade:</b> {dados.atividade || '—'}</div>
            <div className="col-span-2 text-center text-slate-500">Tudo isso será salvo no cliente ao criar o processo.</div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nome da empresa *" className="col-span-2">
          <input className={INP} value={f.nome} autoFocus onChange={(e) => setF({ ...f, nome: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && criar()} />
        </Campo>
        <Campo label="Carteira *">
          <select className={INP} value={f.carteira} onChange={(e) => setF({ ...f, carteira: e.target.value })}>
            <option value="">— escolher —</option>{FRENTES.map((x) => <option key={x.v} value={x.v}>{x.t}</option>)}
          </select>
        </Campo>
        <Campo label="Tipo de processo *">
          <select className={INP} value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })}>
            <option value="">— escolher —</option>{SERVICOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo label="CPF do responsável"><input className={INP} value={f.cpf} onChange={(e) => setF({ ...f, cpf: mascaraCpf(e.target.value) })} placeholder="000.000.000-00" /></Campo>
        <Campo label="Senha gov.br"><input className={INP} value={f.senhaGov} onChange={(e) => setF({ ...f, senhaGov: e.target.value })} /></Campo>
        <Campo label="Observações" className="col-span-2"><textarea className={INP} rows={2} value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} /></Campo>
      </div>
      <div className="mt-5 flex justify-center gap-2">
        <Botao tipo="cancelar" onClick={onFechar}>Cancelar</Botao>
        <Botao tipo="salvar" onClick={criar} disabled={busy}>{busy ? 'Criando…' : 'Criar processo'}</Botao>
      </div>
    </Modal>
  );
}

// ─── Ficha do processo ──────────────────────────────────────────────────────
export function FichaProcessoModal({ processoId, onFechar, onSalvo, podeOperar, comExcluir = true }: { processoId: string | null; onFechar: () => void; onSalvo: () => void; podeOperar: boolean; comExcluir?: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [p, setP] = useState<(Processo & { historico: Historico[] }) | null>(null);
  const [f, setF] = useState<Record<string, string | boolean>>({});
  const [cliente, setCliente] = useState<{ id: string; nome: string } | null>(null);
  const [verSenha, setVerSenha] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aba, setAba] = useState<'dados' | 'historico'>('dados');
  function carregar() {
    if (!processoId) return;
    socApi.obter(processoId).then((x) => {
      setP(x); setCliente(x.empresa ? { id: x.empresa.id, nome: x.empresa.razaoSocial } : null);
      setF({
        grupo: x.grupo ?? '', servico: x.servico, natureza: x.natureza || 'LTDA', etapa: x.etapa, situacao: x.situacao === 'Finalizado' ? 'Em análise' : x.situacao,
        responsavel: x.responsavel ?? '', dependeDe: x.dependeDe, prazo: x.prazo?.slice(0, 10) ?? '', proximaAcao: x.proximaAcao ?? '',
        foraDoQuadro: x.foraDoQuadro, protocoloRegin: x.protocoloRegin ?? '', requerimento: x.requerimento ?? '', cpf: x.cpf ?? '',
        senhaGov: x.senhaGov ?? '', honorario: numeroParaMoeda(x.honorario), honorarioSit: x.honorarioSit, observacao: x.observacao ?? '',
        cnpj: x.empresa?.cnpj ? mascaraCnpj(x.empresa.cnpj) : '',
      });
    }).catch((e) => { toast('erro', erroMsg(e)); onFechar(); });
  }
  useEffect(() => { setP(null); setAba('dados'); setVerSenha(false); carregar(); }, [processoId]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = (k: string) => String(f[k] ?? '');
  const set = (k: string, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  async function salvar() {
    if (!p) return;
    if (!cliente) return toast('erro', 'Preencha: Cliente.');
    setBusy(true);
    try {
      await socApi.salvar(p.id, {
        empresaId: cliente.id, grupo: s('grupo') || null, servico: s('servico'), natureza: s('natureza'), etapa: s('etapa'),
        situacao: p.situacao === 'Finalizado' ? undefined : s('situacao'), responsavel: s('responsavel') || null, dependeDe: s('dependeDe'),
        prazo: s('prazo') || null, proximaAcao: s('proximaAcao') || null, foraDoQuadro: !!f.foraDoQuadro, protocoloRegin: s('protocoloRegin') || null,
        requerimento: s('requerimento') || null, cpf: s('cpf') || null, senhaGov: s('senhaGov') || null, honorario: moedaParaNumero(s('honorario')),
        honorarioSit: s('honorarioSit'), observacao: s('observacao') || null, cnpj: s('cnpj').replace(/\D/g, '') || null,
      });
      toast('ok', 'Registro salvo.'); onSalvo(); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); } finally { setBusy(false); }
  }
  async function alternarCarteira() {
    if (!p?.empresa) return;
    try { await socApi.carteira(p.id, !p.empresa.naCarteira); toast('ok', p.empresa.naCarteira ? 'Cliente retirado da carteira.' : 'Cliente adicionado à carteira.'); carregar(); onSalvo(); }
    catch (e) { toast('erro', erroMsg(e)); }
  }
  async function excluir() {
    if (!p || !confirm(`Excluir o processo ${p.codigo}? Não tem desfazer.`)) return;
    try { await socApi.excluir(p.id); toast('ok', 'Processo excluído.'); onSalvo(); onFechar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const dis = !podeOperar;
  return (
    <Modal aberto={!!processoId} titulo={p ? `Processo ${p.codigo}` : 'Processo'} onFechar={onFechar} largura="max-w-3xl">
      {!p ? <div className="py-10 text-center text-slate-400">Carregando…</div> : (
        <>
          <p className="-mt-2 mb-3 text-center text-[13px] text-slate-500">{nomeCliente(p)} · {rotuloNatureza(p.natureza)} · {p.servico}</p>
          <div className="mb-3 flex justify-center gap-1 text-[13px]">
            {(['dados', 'historico'] as const).map((a) => (
              <button key={a} onClick={() => setAba(a)} className={`rounded px-3 py-1 ${aba === a ? 'bg-marca-50 font-medium text-marca-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                {a === 'dados' ? 'Dados do processo' : 'Histórico'}
              </button>
            ))}
          </div>
          {aba === 'historico' ? (
            <div className="max-h-[60vh] overflow-y-auto text-[13px]">
              {p.historico.length === 0 && <div className="py-6 text-center text-slate-400">Sem registros.</div>}
              {p.historico.map((h) => (
                <div key={h.id} className="border-b border-slate-100 py-1.5">
                  <span className="text-slate-400">{dataHoraBR(h.createdAt)} · {h.usuarioNome ?? '—'}</span>
                  <div className="text-slate-700"><b>{h.acao}</b>{h.detalhe ? ` — ${h.detalhe}` : ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <fieldset disabled={dis}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Campo label="Cliente *" className="col-span-2 md:col-span-3"><BuscaEmpresa valor={cliente} onEscolher={setCliente} /></Campo>
                <Campo label="CNPJ (fica no cadastro do cliente)">
                  <input className={INP} value={s('cnpj')} onChange={(e) => set('cnpj', mascaraCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
                </Campo>
                <Campo label="Carteira (frente do processo)">
                  <select className={INP} value={s('grupo')} onChange={(e) => set('grupo', e.target.value)}>
                    <option value="">— segue a do cliente —</option>{FRENTES.map((x) => <option key={x.v} value={x.v}>{x.t}</option>)}
                  </select>
                </Campo>
                <Campo label="Tipo de processo">
                  <select className={INP} value={s('servico')} onChange={(e) => set('servico', e.target.value)}>{SERVICOS.map((x) => <option key={x}>{x}</option>)}</select>
                </Campo>
                <Campo label="Natureza">
                  <select className={INP} value={s('natureza')} onChange={(e) => set('natureza', e.target.value)}>
                    {NATUREZAS.map((x) => <option key={x.v} value={x.v}>{x.t} ({x.cod})</option>)}
                  </select>
                </Campo>
                <Campo label="Etapa">
                  <select className={INP} value={s('etapa')} onChange={(e) => set('etapa', e.target.value)}>{ETAPAS.map((x) => <option key={x}>{x}</option>)}</select>
                </Campo>
                <Campo label="Situação">
                  {p.situacao === 'Finalizado'
                    ? <div className="py-1.5 text-[13px] font-medium" style={{ color: COR.ok }}>Finalizado</div>
                    : <select className={INP} value={s('situacao')} onChange={(e) => set('situacao', e.target.value)}>{SITUACOES.filter((x) => x !== 'Finalizado').map((x) => <option key={x}>{x}</option>)}</select>}
                </Campo>
                <Campo label="Depende de">
                  <select className={INP} value={s('dependeDe')} onChange={(e) => set('dependeDe', e.target.value)}>{DEPENDE_DE.map((x) => <option key={x}>{x}</option>)}</select>
                </Campo>
                <Campo label="Prazo"><input type="date" className={INP} value={s('prazo')} onChange={(e) => set('prazo', e.target.value)} /></Campo>
                <Campo label="Responsável"><input className={INP} value={s('responsavel')} onChange={(e) => set('responsavel', e.target.value)} /></Campo>
                <Campo label="Próxima ação" className="col-span-2 md:col-span-3"><input className={INP} value={s('proximaAcao')} onChange={(e) => set('proximaAcao', e.target.value)} /></Campo>
                <Campo label="Protocolo REGIN (JUCESC)"><input className={INP} value={s('protocoloRegin')} onChange={(e) => set('protocoloRegin', e.target.value)} /></Campo>
                <Campo label="Nº do requerimento"><input className={INP} value={s('requerimento')} onChange={(e) => set('requerimento', e.target.value)} /></Campo>
                <Campo label="CPF do responsável"><input className={INP} value={s('cpf')} onChange={(e) => set('cpf', mascaraCpf(e.target.value))} placeholder="000.000.000-00" /></Campo>
                <Campo label="Senha gov.br">
                  <div className="flex gap-1">
                    <input type={verSenha ? 'text' : 'password'} className={INP} value={s('senhaGov')} onChange={(e) => set('senhaGov', e.target.value)} />
                    <button type="button" className="px-1 text-slate-500" onClick={() => setVerSenha((v) => !v)}>{verSenha ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </Campo>
                <Campo label="Honorário (R$)"><input className={INP} value={s('honorario')} onChange={(e) => set('honorario', mascaraMoeda(e.target.value))} placeholder="0,00" /></Campo>
                <Campo label="Situação do honorário">
                  <select className={INP} value={s('honorarioSit')} onChange={(e) => set('honorarioSit', e.target.value)}>{HONORARIO_SIT.map((x) => <option key={x}>{x}</option>)}</select>
                </Campo>
                <label className="col-span-2 flex items-center gap-2 text-[13px] text-slate-600 md:col-span-3">
                  <input type="checkbox" checked={!!f.foraDoQuadro} onChange={(e) => set('foraDoQuadro', e.target.checked)} className="accent-marca-600" />
                  Fora do quadro — não mostrar este processo no Kanban (volta pelo botão “fora do quadro”)
                </label>
                <Campo label="Observações" className="col-span-2 md:col-span-3"><textarea className={INP} rows={4} value={s('observacao')} onChange={(e) => set('observacao', e.target.value)} /></Campo>
              </div>
              {p.empresa && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded bg-slate-50 p-2 text-[13px]">
                  {p.empresa.naCarteira
                    ? <><span style={{ color: COR.ok }} className="font-medium">✓ Na carteira</span><Botao tipo="cancelar" type="button" onClick={alternarCarteira}>Tirar da carteira</Botao></>
                    : <Botao tipo="novo" type="button" onClick={alternarCarteira}>Adicionar na carteira</Botao>}
                  <Botao tipo="info" type="button" onClick={() => { onFechar(); navigate(`/empresas/${p.empresa!.id}`); }}>Ver cadastro do cliente</Botao>
                </div>
              )}
            </fieldset>
          )}
          <div className="mt-5 flex justify-center gap-2">
            {podeOperar && comExcluir && <Botao tipo="excluir" onClick={excluir}>Excluir</Botao>}
            <Botao tipo="cancelar" onClick={onFechar}>{podeOperar ? 'Cancelar' : 'Fechar'}</Botao>
            {podeOperar && aba === 'dados' && <Botao tipo="salvar" onClick={salvar} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</Botao>}
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Checklist ──────────────────────────────────────────────────────────────
export function ChecklistModal({ processo, onFechar, onMudou, podeOperar, onAbrirFicha }: { processo: Processo | null; onFechar: () => void; onMudou: (p: Processo) => void; podeOperar: boolean; onAbrirFicha: (id: string) => void }) {
  const toast = useToast();
  const [p, setP] = useState<Processo | null>(processo);
  const [obs, setObs] = useState('');
  const [regin, setRegin] = useState('');
  useEffect(() => { setP(processo); setObs(processo?.observacao ?? ''); setRegin(processo?.protocoloRegin ?? ''); }, [processo]);
  if (!p) return null;
  const atualizar = (np: Processo) => { setP(np); onMudou(np); };
  async function item(itemId: string, b: { feito?: boolean; na?: boolean }) {
    if (!podeOperar) return toast('erro', 'Seu nível de acesso é somente de consulta.');
    try {
      const r = await socApi.item(p!.id, itemId, b);
      atualizar(r.processo);
      if (r.travado) toast('erro', 'Informe o protocolo do REGIN para avançar além da Viabilidade.');
      else if (r.completo && b.feito) toast('ok', `${p!.codigo} concluído — checklist 100%.`);
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  async function campo(c: 'observacao' | 'protocoloRegin', v: string) {
    if (!podeOperar) return;
    try { const r = await socApi.campo(p!.id, c, v); atualizar(r.processo); toast('ok', c === 'observacao' ? 'Observação salva.' : 'Protocolo salvo.'); }
    catch (e) { toast('erro', erroMsg(e)); }
  }
  const etapas = ETAPAS.filter((e) => p.checklist.some((i) => i.etapa === e));
  return (
    <Modal aberto onFechar={onFechar} titulo={`${p.codigo} · ${nomeCliente(p)}`} largura="max-w-2xl">
      <p className="-mt-2 mb-3 text-center text-[13px] text-slate-500">{rotuloNatureza(p.natureza)} · {p.servico}</p>
      <div className="mb-3 text-center text-[13px] text-slate-600">
        Etapa atual: <b>{p.situacao === 'Finalizado' ? 'Concluído' : p.etapa}</b> · {p.situacao} · <b>{p.progresso}%</b>
        <div className="mx-auto mt-1 h-1.5 max-w-sm rounded bg-slate-200"><div className="h-1.5 rounded" style={{ width: `${p.progresso}%`, background: COR.ok }} /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Campo label="Observações">
          <textarea className={INP} rows={3} value={obs} disabled={!podeOperar} onChange={(e) => setObs(e.target.value)} onBlur={() => obs !== (p.observacao ?? '') && campo('observacao', obs)} />
        </Campo>
        <Campo label="Protocolo do REGIN">
          <input className={INP} value={regin} disabled={!podeOperar} onChange={(e) => setRegin(e.target.value)} onBlur={() => regin !== (p.protocoloRegin ?? '') && campo('protocoloRegin', regin)} />
          <div className="mt-1 text-[12px]" style={{ color: p.etapa === 'Viabilidade' && !regin.trim() ? COR.erro : '#64748b' }}>
            {p.etapa === 'Viabilidade' && !regin.trim() ? '⚠ Sem o protocolo, o processo não sai da Viabilidade.' : 'Vai junto para o Kanban de alvarás quando o processo for concluído.'}
          </div>
          <a href={LINK_REGIN} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-marca-600 hover:underline">
            Consultar viabilidade na JUCESC (REGIN) <ExternalLink size={12} />
          </a>
          <div className="text-[11px] text-slate-400">Faça login no gov.br antes de acessar.</div>
        </Campo>
      </div>
      <div className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto">
        {etapas.map((e) => {
          const itens = p.checklist.filter((i) => i.etapa === e);
          const conta = itens.filter((i) => !i.na);
          return (
            <div key={e} className="rounded border border-slate-200">
              <div className="flex justify-between bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-700">
                <span>{e}</span><span className="text-slate-500">{conta.filter((i) => i.feito).length}/{conta.length}</span>
              </div>
              {itens.map((i) => (
                <div key={i.id} className="flex items-center gap-2 border-t border-slate-100 px-3 py-1.5 text-[13px]">
                  <input type="checkbox" checked={i.feito} disabled={i.na || !podeOperar} onChange={(ev) => item(i.id, { feito: ev.target.checked })} className="accent-marca-600" />
                  <span className={`flex-1 ${i.feito ? 'text-slate-400 line-through' : i.na ? 'text-slate-400' : 'text-slate-700'}`}>{i.tarefa}</span>
                  {podeOperar && <button onClick={() => item(i.id, { na: !i.na })} className="rounded border border-slate-200 px-1.5 text-[11px] text-slate-500 hover:bg-slate-100">{i.na ? 'reativar' : 'N/A'}</button>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <Botao tipo="info" onClick={() => { onFechar(); onAbrirFicha(p.id); }}>Abrir o cadastro do processo</Botao>
        <Botao tipo="cancelar" onClick={onFechar}>Fechar</Botao>
      </div>
    </Modal>
  );
}

// ─── Confirmar o tipo de alteracao ──────────────────────────────────────────
export function ConfirmarAlteracaoModal({ processo, onCancelar, onConfirmar }: { processo: Processo | null; onCancelar: () => void; onConfirmar: (a: { mudaEndereco: boolean; mudaMunicipio: boolean; mudaAtividade: boolean }) => void }) {
  const [a, setA] = useState({ mudaEndereco: false, mudaMunicipio: false, mudaAtividade: false });
  useEffect(() => { if (processo) setA({ mudaEndereco: processo.mudaEndereco, mudaMunicipio: processo.mudaMunicipio, mudaAtividade: processo.mudaAtividade }); }, [processo]);
  if (!processo) return null;
  return (
    <Modal aberto onFechar={onCancelar} titulo="Confirmar o tipo de alteração">
      <p className="mb-3 text-center text-[13px] text-slate-600">{processo.codigo} · {nomeCliente(processo)}<br />Isso define se, ao concluir, o processo vai para o Kanban de alvarás.</p>
      <div className="mx-auto w-fit space-y-2 text-[13px] text-slate-700">
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-marca-600" checked={a.mudaEndereco} onChange={(e) => setA({ ...a, mudaEndereco: e.target.checked, mudaMunicipio: e.target.checked && a.mudaMunicipio })} /> Muda o endereço</label>
        {a.mudaEndereco && <label className="ml-5 flex items-center gap-2"><input type="checkbox" className="accent-marca-600" checked={a.mudaMunicipio} onChange={(e) => setA({ ...a, mudaMunicipio: e.target.checked })} /> … e muda de município</label>}
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-marca-600" checked={a.mudaAtividade} onChange={(e) => setA({ ...a, mudaAtividade: e.target.checked })} /> Muda a atividade (CNAE)</label>
      </div>
      <div className="mt-5 flex justify-center gap-2">
        <Botao tipo="cancelar" onClick={onCancelar}>Cancelar</Botao>
        <Botao tipo="salvar" onClick={() => onConfirmar(a)}>Confirmar e avançar</Botao>
      </div>
    </Modal>
  );
}

// ─── Conclusao (ate tres perguntas) ─────────────────────────────────────────
export function ConclusaoModal({ processo, onCancelar, onConcluido }: { processo: Processo | null; onCancelar: () => void; onConcluido: (p: Processo) => void }) {
  const toast = useToast();
  const [passo, setPasso] = useState<'cad' | 'carteira' | 'tipo'>('carteira');
  const [baixa, setBaixa] = useState<boolean | null>(null);
  const [tipo, setTipo] = useState('digital');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!processo) return;
    setPasso(precisaCadastroEconomico(processo) ? 'cad' : 'carteira'); setBaixa(null);
    setTipo(processo.empresa?.carteiraMei ? 'mei' : processo.empresa?.frente === 'nauta' ? 'nauta' : processo.empresa?.frente === 'esporadico' ? 'esporadico' : 'digital');
  }, [processo]);
  if (!processo) return null;
  const p = processo;
  async function finalizar(viraCliente: boolean) {
    setBusy(true);
    try {
      const r = await socApi.concluir(p.id, { baixaCadEconomico: precisaCadastroEconomico(p) ? baixa : undefined, viraCliente, tipo: viraCliente ? tipo : undefined });
      toast('ok', `${p.codigo} → Concluídos${r.alvara ? ' e Kanban de alvarás' : ''} · ${r.avisos.join(' · ')}`);
      onConcluido(r.processo);
    } catch (e) { toast('erro', erroMsg(e)); } finally { setBusy(false); }
  }
  return (
    <Modal aberto onFechar={onCancelar} titulo={passo === 'cad' ? 'Baixa no cadastro econômico' : `Concluir ${p.codigo}`}>
      {passo === 'cad' && (
        <>
          <p className="mb-2 text-center text-[13px] text-slate-600">{p.servico === 'Baixa' ? 'Esta é uma baixa de empresa.' : 'Esta alteração muda de município.'}</p>
          <p className="mb-4 text-center text-[14px] font-medium text-slate-700">Foi dada baixa no cadastro econômico da prefeitura?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Botao tipo="cancelar" onClick={onCancelar}>Cancelar</Botao>
            <Botao tipo="info" onClick={() => { setBaixa(false); setPasso('carteira'); }}>Ainda não — concluir assim mesmo</Botao>
            <Botao tipo="salvar" onClick={() => { setBaixa(true); setPasso('carteira'); }}>Sim, já foi dada baixa</Botao>
          </div>
        </>
      )}
      {passo === 'carteira' && (
        <>
          <p className="mb-1 text-center text-[14px] font-medium text-slate-700">Esta empresa vira cliente da carteira?</p>
          <p className="mb-4 text-center text-[12px] text-slate-500">{p.empresa?.naCarteira ? 'Ela já está na carteira.' : 'Hoje ela não está na carteira.'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Botao tipo="cancelar" onClick={onCancelar}>Cancelar</Botao>
            <Botao tipo="info" disabled={busy} onClick={() => finalizar(false)}>Não, só concluir</Botao>
            <Botao tipo="salvar" onClick={() => setPasso('tipo')}>Sim, é cliente</Botao>
          </div>
        </>
      )}
      {passo === 'tipo' && (
        <>
          <p className="mb-3 text-center text-[14px] font-medium text-slate-700">Tipo de cliente</p>
          <div className="mx-auto w-fit space-y-2 text-[13px]">
            {TIPOS_CLIENTE.map((t) => (
              <label key={t.v} className="flex items-center gap-2">
                <input type="radio" name="tipo" className="accent-marca-600" checked={tipo === t.v} onChange={() => setTipo(t.v)} />
                <b>{t.t}</b> <span className="text-slate-500">— {t.d}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-center text-[12px] text-slate-500">
            {p.empresa?.cnpj ? `CNPJ ${mascaraCnpj(p.empresa.cnpj)}` : 'Esta ficha não tem CNPJ — ela entra na carteira assim mesmo, mas vale completar depois.'}
          </p>
          {mexeComAlvara(p) && <p className="text-center text-[12px]" style={{ color: COR.novo }}>Ao concluir, vai também para o Kanban de alvarás.</p>}
          <div className="mt-4 flex justify-center gap-2">
            <Botao tipo="cancelar" onClick={onCancelar}>Cancelar</Botao>
            <Botao tipo="salvar" disabled={busy} onClick={() => finalizar(true)}>{busy ? 'Concluindo…' : 'Concluir processo'}</Botao>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Fora do quadro ─────────────────────────────────────────────────────────
export function ForaDoQuadroModal({ aberto, processos, onFechar, onMudou, podeOperar }: { aberto: boolean; processos: Processo[]; onFechar: () => void; onMudou: () => void; podeOperar: boolean }) {
  const toast = useToast();
  async function devolver(ids: string[]) {
    try { const r = await socApi.devolver(ids); toast('ok', `${r.devolvidos} processo(s) de volta ao quadro.`); onMudou(); if (ids.length === processos.length) onFechar(); }
    catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Fora do quadro">
      <p className="-mt-2 mb-3 text-center text-[13px] text-slate-500">Processos em andamento que não aparecem no Kanban.</p>
      <div className="max-h-[50vh] overflow-y-auto">
        {processos.map((p) => (
          <div key={p.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-[13px]">
            <div><b>{p.codigo}</b> · {nomeCliente(p)} <span className="text-slate-400">· {p.etapa} · {p.situacao}</span></div>
            {podeOperar && <Botao tipo="info" onClick={() => devolver([p.id])}>↩ Devolver</Botao>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <Botao tipo="cancelar" onClick={onFechar}>Fechar</Botao>
        {podeOperar && processos.length > 1 && <Botao tipo="salvar" onClick={() => devolver(processos.map((p) => p.id))}>Devolver todos</Botao>}
      </div>
    </Modal>
  );
}

export function BotaoCopiar({ texto, rotulo = 'Copiado.' }: { texto: string; rotulo?: string }) {
  const toast = useToast();
  return (
    <button type="button" title="Copiar" data-sem-arrastar
      onClick={async (e) => { e.stopPropagation(); const ok = await copiar(texto); toast(ok ? 'ok' : 'erro', ok ? rotulo : 'Não consegui copiar — copie à mão.'); }}
      className="inline-flex items-center text-slate-400 hover:text-marca-600"><Copy size={12} /></button>
  );
}
