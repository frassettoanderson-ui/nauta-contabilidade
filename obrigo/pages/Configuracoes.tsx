import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Settings, Trash2, Mail, Pencil, ChevronsRight } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth, temPermissao } from '../lib/auth';
import { useToast } from '../components/ui';
import type { Departamento } from '../lib/tipos';
import EmailModeloModal, { type ModeloEmail } from './EmailModeloModal';

const INP = 'block w-full rounded border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none focus:border-marca-400 focus:ring-1 focus:ring-marca-100';
const LBL = 'mb-0.5 block text-[12px] font-medium text-slate-600';

type Bloco = { modo: string; ini: string; fim: string };
interface Cfg {
  mailFromName?: string;
  sabadoEhUtil?: boolean;
  smtp?: { host?: string; port?: number; user?: string; pass?: string; fromEmail?: string };
  entregas?: { aoAnexar?: string; marcarLida?: string; aoOkResponsavel?: string; enviarEmailPadrao?: string };
  expediente?: { domingo?: Bloco; semana?: Bloco; sabado?: Bloco };
  responsaveisPadrao?: Record<string, string>;
  caminhoDownloadEcontinuo?: string;
  email?: { fromExemplo?: string; responderPara?: string; dispararVia?: string; diasLembreteGuias?: string; prefixoTituloGuias?: string; cabecalhoLembreteGuias?: string };
  modeloIndividual?: ModeloEmail;
  modeloAgendado?: ModeloEmail;
}
interface ConfigEscritorio { id: string; nome: string; cnpj: string | null; logoUrl: string | null; config: Cfg }

const OPC_ANEXAR = ['Ja considerar como entregue', 'So considerar entregue se informar protocolo'];
const OPC_LIDA = ['Somente quando cliente acessar TODOS os anexos', 'Ao acessar pelo menos UM dos anexos'];
const OPC_OK_RESP = ['Manter o responsavel ja definido', 'Atualizar para o usuario que esta realizando'];
const OPC_ENVIAR = ['Nao', 'Sim - Imediato', 'Sim - Agendado'];
// defaults (opcao que vem selecionada no Acessorias)
const DEF_ANEXAR = OPC_ANEXAR[1];
const DEF_LIDA = OPC_LIDA[1];
const DEF_OK_RESP = OPC_OK_RESP[0];
const DEF_ENVIAR = OPC_ENVIAR[2];
const OPC_RESPONDER = ['E-mail especificado no departamento', 'E-mail do responsavel', 'E-mail do escritorio'];
const OPC_DISPARAR = ['Departamento correspondente a obrigacao/tarefa', 'Um departamento fixo'];

const blocoVazio = (modo: string, fim = '23:59'): Bloco => ({ modo, ini: '08:00', fim });

export default function Configuracoes() {
  const { sessao } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const pode = temPermissao(sessao, 'admin_escritorio');

  const [dados, setDados] = useState<ConfigEscritorio | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState<Record<string, boolean>>({ entregas: true });
  const [modal, setModal] = useState<'individual' | 'agendado' | null>(null);

  // Integracao WhatsApp (Evolution) - endpoints dedicados (a apikey nao volta no GET)
  const [evo, setEvo] = useState({ baseUrl: '', instance: '', apikey: '', versao: 'v2', ativo: false, configurado: false, minSeg: 8, maxSeg: 25, maxHora: 60 });
  const [salvandoEvo, setSalvandoEvo] = useState(false);
  const [testandoEvo, setTestandoEvo] = useState(false);
  function carregarEvolution() {
    api.get<{ baseUrl: string; instance: string; versao: string; ativo: boolean; configurado: boolean; minSeg: number; maxSeg: number; maxHora: number }>('/escritorio/evolution')
      .then((s) => setEvo({ ...s, apikey: '' })).catch(() => undefined);
  }
  function payloadEvo() {
    return { baseUrl: evo.baseUrl.trim(), instance: evo.instance.trim(), apikey: evo.apikey || undefined, versao: evo.versao, ativo: evo.ativo, minSeg: Number(evo.minSeg) || 8, maxSeg: Number(evo.maxSeg) || 25, maxHora: Number(evo.maxHora) || 60 };
  }
  async function salvarEvolution() {
    setSalvandoEvo(true);
    try {
      await api.put('/escritorio/evolution', payloadEvo());
      setEvo((e) => ({ ...e, apikey: '', configurado: e.configurado || !!e.apikey }));
      toast('ok', 'Integracao WhatsApp salva.');
    } catch (e) { toast('erro', e instanceof ApiError ? e.message : 'Erro ao salvar.'); }
    finally { setSalvandoEvo(false); }
  }
  async function testarEvolution() {
    const numero = window.prompt('Enviar WhatsApp de teste para qual numero? (com DDD, ex.: 4899...)');
    if (!numero) return;
    setTestandoEvo(true);
    try {
      await api.put('/escritorio/evolution', payloadEvo());
      setEvo((e) => ({ ...e, apikey: '' }));
      const r = await api.post<{ enviado: boolean }>('/escritorio/evolution/testar', { numero });
      toast(r.enviado ? 'ok' : 'erro', r.enviado ? 'WhatsApp de teste enviado. Confira o numero.' : 'Nao enviou.');
    } catch (e) { toast('erro', e instanceof ApiError ? e.message : 'Falha no teste (verifique URL/instancia/apikey e se a instancia esta conectada).'); }
    finally { setTestandoEvo(false); }
  }

  useEffect(() => {
    api.get<ConfigEscritorio>('/escritorio').then(setDados).catch(() => undefined);
    api.get<Departamento[]>('/departamentos').then(setDepartamentos).catch(() => undefined);
    api.get<{ id: string; nome: string }[]>('/usuarios').then(setUsuarios).catch(() => undefined);
    carregarEvolution();
  }, []);

  if (!dados) return <div className="text-slate-400">Carregando...</div>;
  const c = dados.config ?? {};

  function patch(p: Partial<Cfg>) { setDados((d) => (d ? { ...d, config: { ...d.config, ...p } } : d)); }
  function patchEntregas(p: Partial<NonNullable<Cfg['entregas']>>) { patch({ entregas: { ...c.entregas, ...p } }); }
  function patchEmail(p: Partial<NonNullable<Cfg['email']>>) { patch({ email: { ...c.email, ...p } }); }
  function setBloco(dia: 'domingo' | 'semana' | 'sabado', p: Partial<Bloco>) {
    const exp = c.expediente ?? {};
    const atual = exp[dia] ?? blocoVazio(dia === 'semana' ? 'Permitido' : 'Bloqueado', dia === 'semana' ? '22:00' : '23:59');
    patch({ expediente: { ...exp, [dia]: { ...atual, ...p } } });
  }
  function setResp(depId: string, userId: string) {
    patch({ responsaveisPadrao: { ...c.responsaveisPadrao, [depId]: userId } });
  }
  function toggle(k: string) { setAberto((a) => ({ ...a, [k]: !a[k] })); }

  async function salvar() {
    setSalvando(true);
    try {
      await api.put('/escritorio', { nome: dados!.nome, cnpj: dados!.cnpj, config: dados!.config });
      toast('ok', 'Configuracoes salvas.');
    } catch (e) { toast('erro', e instanceof ApiError ? e.message : 'Erro ao salvar.'); }
    finally { setSalvando(false); }
  }

  async function salvarModelo(tipo: 'individual' | 'agendado', v: ModeloEmail) {
    const novaConfig = { ...dados!.config, [tipo === 'individual' ? 'modeloIndividual' : 'modeloAgendado']: v };
    setDados((d) => (d ? { ...d, config: novaConfig } : d));
    setModal(null);
    try {
      await api.put('/escritorio', { nome: dados!.nome, cnpj: dados!.cnpj, config: novaConfig });
      toast('ok', 'Modelo de e-mail salvo.');
    } catch (e) { toast('erro', e instanceof ApiError ? e.message : 'Erro ao salvar.'); }
  }

  async function enviarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('logo', file);
    try {
      const r = await api.upload<{ logoUrl: string }>('/escritorio/logo', fd);
      setDados((d) => (d ? { ...d, logoUrl: r.logoUrl } : d));
      toast('ok', 'Logo atualizado.');
    } catch (err) { toast('erro', err instanceof ApiError ? err.message : 'Erro no upload.'); }
  }
  async function removerLogo() {
    if (!confirm('Remover o logo atual?')) return;
    try { await api.del('/escritorio/logo'); setDados((d) => (d ? { ...d, logoUrl: null } : d)); toast('ok', 'Logo removido.'); }
    catch (err) { toast('erro', err instanceof ApiError ? err.message : 'Erro.'); }
  }

  const exp = c.expediente ?? {};
  const dom = exp.domingo ?? blocoVazio('Bloqueado');
  const sem = exp.semana ?? blocoVazio('Permitido', '22:00');
  const sab = exp.sabado ?? blocoVazio('Bloqueado');

  return (
    <div className="-m-6 min-h-full bg-fundo p-5 text-[13px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          <Settings size={16} className="text-slate-400" />
          <span>Sistema</span><span className="text-slate-300">›</span>
          <span className="text-slate-700">Configuracoes gerais do Sistema [F1]</span>
        </div>
        <input className="w-56 rounded border border-slate-300 bg-white px-2 py-1 text-[12px]" placeholder="Central de ajuda" disabled />
      </div>

      <div className="space-y-1">
        {/* 1. Comportamento padrao nas entregas */}
        <Secao titulo="Comportamento padrao nas entregas" aberto={!!aberto.entregas} onToggle={() => toggle('entregas')}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
            <Campo label="Ao anexar um arquivo nas entregas">
              <select className={INP} value={c.entregas?.aoAnexar ?? DEF_ANEXAR} onChange={(e) => patchEntregas({ aoAnexar: e.target.value })}>
                {OPC_ANEXAR.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Campo>
            <Campo label="Marcar entregas de anexos como lida (envelope azul)">
              <select className={INP} value={c.entregas?.marcarLida ?? DEF_LIDA} onChange={(e) => patchEntregas({ marcarLida: e.target.value })}>
                {OPC_LIDA.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Campo>
            <Campo label="Ao dar OK em uma entrega, quanto ao responsavel:">
              <select className={INP} value={c.entregas?.aoOkResponsavel ?? DEF_OK_RESP} onChange={(e) => patchEntregas({ aoOkResponsavel: e.target.value })}>
                {OPC_OK_RESP.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Campo>
            <Campo label="Opcao padrao do 'Enviar por e-mail?' da Lista de entregas">
              <select className={INP} value={c.entregas?.enviarEmailPadrao ?? DEF_ENVIAR} onChange={(e) => patchEntregas({ enviarEmailPadrao: e.target.value })}>
                {OPC_ENVIAR.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Campo>
          </div>
        </Secao>

        {/* 2. Expediente padrao dos colaboradores */}
        <Secao titulo="Expediente padrao dos colaboradores" aberto={!!aberto.expediente} onToggle={() => toggle('expediente')}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
            <BlocoExp titulo="Expediente padrao Domingo" b={dom} onChange={(p) => setBloco('domingo', p)} />
            <BlocoExp titulo="Expediente padrao Semana" b={sem} onChange={(p) => setBloco('semana', p)} />
            <BlocoExp titulo="Expediente padrao Sabado" b={sab} onChange={(p) => setBloco('sabado', p)} />
          </div>
        </Secao>

        {/* 3. Responsaveis padrao por departamento */}
        <Secao titulo="Responsaveis padrao pelos departamentos em novos cadastros de empresas" aberto={!!aberto.resp} onToggle={() => toggle('resp')}>
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200 text-left text-[12px] font-semibold text-slate-600">
                <th className="px-4 py-2">
                  <span className="inline-flex items-center gap-1">Departamento
                    <button title="Cadastrar departamento" onClick={() => navigate('/cadastros')} className="text-marca-500 hover:text-marca-700"><Pencil size={13} /></button>
                  </span>
                </th>
                <th className="px-4 py-2">Responsavel padrao</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {departamentos.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <span className="flex items-center justify-between text-slate-700">
                        {d.nome}
                        <ChevronsRight size={14} className="text-slate-300" />
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <select className={`${INP} max-w-md`} value={c.responsaveisPadrao?.[d.id] ?? ''} onChange={(e) => setResp(d.id, e.target.value)}>
                        <option value="">Selecione...</option>
                        {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {departamentos.length === 0 && <tr><td colSpan={2} className="px-4 py-4 text-center text-slate-400">Nenhum departamento.</td></tr>}
              </tbody>
            </table>
          </div>
        </Secao>

        {/* 4. Caminho padrao da pasta de download e-Continuo */}
        <Secao titulo="Caminho padrao da pasta de download e-Continuo" aberto={!!aberto.caminho} onToggle={() => toggle('caminho')}>
          <input className={INP} placeholder="[Empresa]/[DocTipo]/[DocCompAno]-[DocCompMes]_[DocNome]"
            value={c.caminhoDownloadEcontinuo ?? ''} onChange={(e) => patch({ caminhoDownloadEcontinuo: e.target.value })} />
          <p className="mt-1 text-[11px] text-slate-400">Tags: [Empresa] [DocTipo] [DocCompAno] [DocCompMes] [DocNome]</p>
        </Secao>

        {/* 5. Logo da empresa */}
        <Secao titulo="Logo da empresa" aberto={!!aberto.logo} onToggle={() => toggle('logo')}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-marca-600">Logo (salvar imagem)</label>
              <input type="file" accept="image/*" onChange={enviarLogo} disabled={!pode} className="block w-full text-[12px] file:mr-2 file:rounded file:border-0 file:bg-marca-500 file:px-3 file:py-1 file:text-white" />
              <p className="mt-2 text-[11px] text-slate-400">*Cuidado com arquivos muito grandes para nao ter perda de qualidade</p>
              <p className="text-[11px] text-slate-400">*Recomendamos salvar os arquivos com no maximo 200px de Largura</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[12px] font-medium text-marca-600">
                Logo Atual {dados.logoUrl && <button onClick={removerLogo} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
              </div>
              {dados.logoUrl
                ? <img src={dados.logoUrl} alt="Logo" className="h-28 rounded border border-slate-200 bg-white object-contain p-2" />
                : <span className="text-[12px] text-slate-400">Nenhum logo enviado.</span>}
            </div>
          </div>
        </Secao>

        {/* 6. Configuracoes do envio de e-mails */}
        <Secao titulo="Configuracoes do envio de e-mails" aberto={!!aberto.emails} onToggle={() => toggle('emails')}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
            <Campo label="Exemplo de 'From' dos e-mails">
              <select className={INP} value={c.email?.fromExemplo ?? ''} onChange={(e) => patchEmail({ fromExemplo: e.target.value })}>
                <option value="">(selecione)</option>
                {usuarios.map((u) => <option key={u.id} value={u.nome}>{u.nome} - {dados.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Nome do escritorio no 'From' dos e-mails">
              <input className={INP} value={c.mailFromName ?? dados.nome} onChange={(e) => patch({ mailFromName: e.target.value })} />
            </Campo>
            <Campo label="Se o cliente responder, responder para:">
              <select className={INP} value={c.email?.responderPara ?? OPC_RESPONDER[0]} onChange={(e) => patchEmail({ responderPara: e.target.value })}>
                {OPC_RESPONDER.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Campo>
            <Campo label="Disparar os e-mails agendados atraves de qual departamento?">
              <select className={INP} value={c.email?.dispararVia ?? OPC_DISPARAR[0]} onChange={(e) => patchEmail({ dispararVia: e.target.value })}>
                {OPC_DISPARAR.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Campo>
            <Campo label="Conteudo dos e-mails do sistema">
              <div className="flex gap-2">
                <button onClick={() => setModal('individual')} className="flex flex-1 items-center justify-center gap-1 rounded bg-slate-200 py-1.5 text-[12px] text-slate-600 hover:bg-slate-300"><Mail size={13} /> E-mail individual</button>
                <button onClick={() => setModal('agendado')} className="flex flex-1 items-center justify-center gap-1 rounded bg-marca-500 py-1.5 text-[12px] text-white hover:bg-marca-600"><Mail size={13} /> E-mail agendado</button>
              </div>
            </Campo>
            <Campo label="Qtde de dias, antes do vcto, pro lembrete de guias nao acessadas">
              <input className={INP} placeholder="2,1,0" value={c.email?.diasLembreteGuias ?? ''} onChange={(e) => patchEmail({ diasLembreteGuias: e.target.value })} />
            </Campo>
            <Campo label="Prefixo do titulo do e-mail das guias nao acessadas">
              <input className={INP} placeholder="Em branco = [Lembrete de vencimento]" value={c.email?.prefixoTituloGuias ?? ''} onChange={(e) => patchEmail({ prefixoTituloGuias: e.target.value })} />
            </Campo>
            <Campo label="Cabecalho do e-mail de lembrete das guias nao acessadas (exibido em vermelho antes da mensagem)" full>
              <input className={INP} placeholder="Cabecalho da mensagem do e-mail das guias nao lidas" value={c.email?.cabecalhoLembreteGuias ?? ''} onChange={(e) => patchEmail({ cabecalhoLembreteGuias: e.target.value })} />
            </Campo>
          </div>
        </Secao>

        {/* 7. Integracao WhatsApp (Evolution) - nosso */}
        <Secao titulo="Integracao WhatsApp (Evolution)" aberto={!!aberto.whatsapp} onToggle={() => toggle('whatsapp')} nosso>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
            <Campo label="URL base do Evolution">
              <input className={INP} placeholder="https://evolution.seudominio.com" value={evo.baseUrl} onChange={(e) => setEvo((s) => ({ ...s, baseUrl: e.target.value }))} />
            </Campo>
            <Campo label="Instancia (numero da Nauta)">
              <input className={INP} placeholder="nauta" value={evo.instance} onChange={(e) => setEvo((s) => ({ ...s, instance: e.target.value }))} />
            </Campo>
            <Campo label="API key">
              <input className={INP} type="password" placeholder={evo.configurado ? '•••••• (mantem a atual)' : 'apikey do Evolution'} value={evo.apikey} onChange={(e) => setEvo((s) => ({ ...s, apikey: e.target.value }))} />
            </Campo>
            <Campo label="Versao do Evolution">
              <select className={INP} value={evo.versao} onChange={(e) => setEvo((s) => ({ ...s, versao: e.target.value }))}>
                <option value="v2">v2</option>
                <option value="v1">v1</option>
              </select>
            </Campo>
            <Campo label="Ativo (enviar guias por WhatsApp)">
              <select className={INP} value={evo.ativo ? 'sim' : 'nao'} onChange={(e) => setEvo((s) => ({ ...s, ativo: e.target.value === 'sim' }))}>
                <option value="nao">Nao</option>
                <option value="sim">Sim</option>
              </select>
            </Campo>
            <Campo label="Intervalo minimo (segundos)">
              <input className={INP} type="number" min={3} value={evo.minSeg} onChange={(e) => setEvo((s) => ({ ...s, minSeg: Number(e.target.value) }))} />
            </Campo>
            <Campo label="Intervalo maximo (segundos)">
              <input className={INP} type="number" min={5} value={evo.maxSeg} onChange={(e) => setEvo((s) => ({ ...s, maxSeg: Number(e.target.value) }))} />
            </Campo>
            <Campo label="Maximo de mensagens por hora">
              <input className={INP} type="number" min={1} value={evo.maxHora} onChange={(e) => setEvo((s) => ({ ...s, maxHora: Number(e.target.value) }))} />
            </Campo>
            <Campo label="Acoes" full>
              <div className="flex gap-2 md:w-1/2">
                <button onClick={salvarEvolution} disabled={salvandoEvo} className="flex-1 rounded bg-status-ok py-1.5 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-60">{salvandoEvo ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={testarEvolution} disabled={testandoEvo} className="flex-1 rounded bg-marca-500 py-1.5 text-[12px] font-medium text-white hover:bg-marca-600 disabled:opacity-60">{testandoEvo ? 'Enviando...' : 'Enviar teste'}</button>
              </div>
            </Campo>
            <p className="text-[11px] text-slate-400 md:col-span-3">⚠️ Conexao NAO oficial: as guias por WhatsApp NAO sao enviadas em lote. Elas entram numa fila e o sistema envia <b>uma de cada vez</b>, com intervalo aleatorio entre o minimo e o maximo + teto por hora (simulando digitacao) para reduzir risco de bloqueio do numero. O PDF vai como anexo (base64). A instancia precisa estar conectada/pareada no seu sistema.</p>
          </div>
        </Secao>
      </div>

      {pode && (
        <button onClick={salvar} disabled={salvando} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-status-ok py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60">
          <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar configuracoes'}
        </button>
      )}

      {modal && (
        <EmailModeloModal
          tipo={modal}
          valor={(modal === 'individual' ? c.modeloIndividual : c.modeloAgendado) ?? {}}
          onSalvar={(v) => salvarModelo(modal, v)}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Secao({ titulo, aberto, onToggle, children, nosso }: { titulo: string; aberto: boolean; onToggle: () => void; children: React.ReactNode; nosso?: boolean }) {
  return (
    <div className="border-b border-slate-200 py-3">
      <button onClick={onToggle} className="text-left text-[13px] font-semibold text-slate-700">
        {titulo}
        {nosso && <span className="ml-1 font-normal text-marca-400">(nosso)</span>}
        <span className="ml-2 text-[12px] font-normal text-marca-500">(clique para {aberto ? 'ocultar' : 'exibir'})</span>
      </button>
      {aberto && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Campo({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={full ? 'md:col-span-3' : ''}><label className={LBL}>{label}</label>{children}</div>;
}

function BlocoExp({ titulo, b, onChange }: { titulo: string; b: Bloco; onChange: (p: Partial<Bloco>) => void }) {
  return (
    <div>
      <label className="mb-0.5 block text-[12px] font-medium text-status-warn">{titulo}</label>
      <div className="flex gap-1">
        <select className={INP} value={b.modo} onChange={(e) => onChange({ modo: e.target.value })}>
          <option>Bloqueado</option><option>Permitido</option>
        </select>
        <input type="time" className={`${INP} w-24`} value={b.ini} onChange={(e) => onChange({ ini: e.target.value })} />
        <input type="time" className={`${INP} w-24`} value={b.fim} onChange={(e) => onChange({ fim: e.target.value })} />
      </div>
    </div>
  );
}
