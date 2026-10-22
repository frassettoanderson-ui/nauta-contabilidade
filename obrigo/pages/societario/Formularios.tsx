// Societario › Formulario do cliente — o que o cliente preencheu no site vira cliente, processo e cartao no Kanban.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, ExternalLink, RefreshCw, Paperclip, Printer, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth, temPermissao } from '../../lib/auth';
import { Modal, useToast } from '../../components/ui';
import { COR, rotuloNatureza, dataHoraBR, copiar, abrirArquivo } from './comum';
import { Botao, INP, erroMsg } from './modais';
import { Selo } from './Gestao';

const LINK_FORM = 'https://atuancontabilidade.com.br/formulario-societario.html';

interface Payload {
  servico?: string; natureza?: string; enviadoEm?: string; alteracao?: { endereco?: boolean; atividade?: boolean; outro?: boolean };
  empresa?: Record<string, string>; contato?: { responsavel?: string; telefone?: string; email?: string };
  socios?: { nome?: string; cpf?: string; pct?: string; funcao?: string; email?: string }[]; observacao?: string;
}
interface Form {
  id: string; servidorId: string | null; protocolo: string | null; recebidoEm: string; servico: string; empresaNome: string;
  contato: string | null; telefone: string | null; dados: Payload; temDocumento: boolean; documentoNome: string | null; documentoTamanho: number | null;
  processoId: string | null; processoCodigo: string | null; empresaId: string | null; empresaNova: boolean; aprovadoEm: string | null; aprovadoPor: string | null;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function fichaHTML(f: Form) {
  const d = f.dados; const e = d.empresa ?? {}; const c = d.contato ?? {};
  const linha = (k: string, v?: string) => `<tr><th>${k}</th><td>${esc(v || '—')}</td></tr>`;
  const muda = [d.alteracao?.endereco && 'Endereço', d.alteracao?.atividade && 'Atividade (CNAE)', d.alteracao?.outro && 'Contrato, sócios ou capital'].filter(Boolean).join(', ');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Formulário ${esc(f.empresaNome)}</title><style>
body{font-family:Arial,sans-serif;color:#1e293b;margin:24px;font-size:13px}h1{font-size:18px;margin:4px 0}.cab{background:#0e2240;color:#fff;padding:12px 16px;border-radius:6px}
h2{font-size:14px;margin:18px 0 6px;color:#0e2240;border-bottom:2px solid #F47920;padding-bottom:3px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e2e8f0;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f8fafc;width:200px}
.pre{white-space:pre-wrap;border:1px solid #e2e8f0;padding:8px;border-radius:4px}.rod{margin-top:20px;font-size:11px;color:#64748b;text-align:center}</style></head><body>
<div class="cab">Formulário societário do cliente<h1>${esc(e.razao || f.empresaNome)}</h1>${esc(d.servico)} · ${esc(rotuloNatureza(d.natureza))} · enviado em ${esc(dataHoraBR(d.enviadoEm || f.recebidoEm))}${f.protocolo ? ' · protocolo ' + esc(f.protocolo) : ''}</div>
<h2>Empresa</h2><table>${linha('Razão social', e.razao)}${linha('Nome fantasia', e.fantasia)}${linha('CNPJ', e.cnpj)}${linha('Capital social (R$)', e.capital)}${linha('Endereço', e.endereco)}${linha('Cidade / UF', `${e.cidade ?? ''}/${e.uf ?? ''}`)}${linha('CEP', e.cep)}${linha('Inscrição imobiliária (IPTU)', e.iptu)}${linha('O imóvel é', e.imovel)}</table>
<h2>Atividades informadas</h2><div class="pre">${esc(e.atividades || '—')}</div>
<h2>Contato</h2><table>${linha('Responsável', c.responsavel)}${linha('Telefone / WhatsApp', c.telefone)}${linha('E-mail', c.email)}</table>
<h2>Sócios / titular</h2><table><tr><th>Nome</th><th>CPF</th><th>%</th><th>Função</th><th>E-mail</th></tr>${(d.socios ?? []).map((s) => `<tr><td>${esc(s.nome)}</td><td>${esc(s.cpf)}</td><td>${esc(s.pct)}</td><td>${esc(s.funcao)}</td><td>${esc(s.email)}</td></tr>`).join('')}</table>
${d.servico === 'Alteração' ? `<h2>O que muda</h2><div class="pre">${esc(muda || '—')}</div>` : ''}
${d.observacao ? `<h2>Observações do cliente</h2><div class="pre">${esc(d.observacao)}</div>` : ''}
<h2>Documento anexado</h2><div>${f.temDocumento ? `${esc(f.documentoNome)} — baixe pelo botão de anexo no Obrigô.` : f.servidorId ? 'Sem documento.' : 'Veio por código colado: peça o arquivo ao cliente.'}</div>
<div class="rod">Documento gerado pelo Obrigô em ${new Date().toLocaleString('pt-BR')}. Reproduz o que o cliente preencheu no formulário, sem alterações.</div></body></html>`;
}
function imprimir(f: Form) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(fichaHTML(f)); w.document.close(); setTimeout(() => w.print(), 300);
  return true;
}
function word(f: Form) {
  const nome = `Formulario-${f.empresaNome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w ]+/g, '').slice(0, 60).trim().replace(/\s+/g, '-')}-${f.recebidoEm.slice(0, 10)}.doc`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + fichaHTML(f)], { type: 'application/msword' })); a.download = nome; a.click();
  return nome;
}

export default function FormulariosSocietario() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'societario_operar');
  const toast = useToast();
  const navigate = useNavigate();
  const [lista, setLista] = useState<Form[]>([]);
  const [status, setStatus] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erroCodigo, setErroCodigo] = useState('');
  const [aprovar, setAprovar] = useState<Form | null>(null);
  const [ver, setVer] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const carregar = () => api.get<Form[]>('/societario/formularios').then(setLista).catch(() => undefined);
  async function buscar(manual: boolean) {
    if (!podeOperar) { carregar(); return; }
    setStatus('Buscando envios…');
    try {
      const r = await api.post<{ novos: number; jaEstavam: number }>('/societario/formularios/buscar');
      setStatus(r.novos ? `${r.novos} formulário(s) recebido(s) — aguardando sua aprovação abaixo.` : `Nenhum envio novo.${manual ? ' (conferido agora)' : ''}`);
      if (r.novos) toast('ok', `${r.novos} formulário(s) na fila de aprovação.`);
    } catch (e) { setStatus(erroMsg(e)); }
    carregar();
  }
  useEffect(() => { buscar(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function colar() {
    setErroCodigo('');
    try { await api.post('/societario/formularios/colar', { codigo }); setCodigo(''); toast('ok', 'Formulário na fila de aprovação.'); carregar(); }
    catch (e) { setErroCodigo(erroMsg(e)); }
  }
  async function confirmarAprovacao() {
    if (!aprovar) return;
    setBusy(true);
    try {
      const r = await api.post<{ codigo: string }>(`/societario/formularios/${aprovar.id}/aprovar`);
      toast('ok', `Processo ${r.codigo} criado — já está no Kanban.`); setAprovar(null); carregar();
    } catch (e) { toast('erro', erroMsg(e)); } finally { setBusy(false); }
  }
  async function excluir(f: Form) {
    const txt = f.processoId
      ? `Remover o formulário de ${f.empresaNome} da lista? O processo ${f.processoCodigo ?? ''} continua onde está.`
      : `Remover o formulário de ${f.empresaNome}? Nada mais será apagado junto.`;
    if (!confirm(txt)) return;
    try { await api.del(`/societario/formularios/${f.id}`); toast('ok', 'Formulário excluído.'); carregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const doc = (f: Form, baixar = false) => abrirArquivo(`/societario/formularios/${f.id}/documento`, baixar, f.documentoNome ?? 'documento').catch((e) => toast('erro', erroMsg(e)));
  const pend = lista.filter((f) => !f.processoId);
  const aprov = lista.filter((f) => f.processoId);
  const resumoMuda = (d: Payload) => [d.alteracao?.endereco && 'endereço', d.alteracao?.atividade && 'atividade', d.alteracao?.outro && 'contrato/sócios'].filter(Boolean).join(', ');

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="card p-4 text-center">
        <div className="text-base font-semibold text-slate-700">Formulário do cliente</div>
        <p className="mb-3 text-slate-500">O que os clientes enviaram chega aqui e fica aguardando a sua aprovação. Nada vira processo sozinho.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Botao tipo="info" onClick={async () => { const ok = await copiar(LINK_FORM); toast(ok ? 'ok' : 'erro', ok ? `Link copiado: ${LINK_FORM}` : `Copie à mão: ${LINK_FORM}`); }}><Copy size={14} /> Copiar link do formulário</Botao>
          <Botao tipo="neutro" onClick={() => window.open(LINK_FORM, '_blank')}><ExternalLink size={14} /> Abrir formulário</Botao>
          {podeOperar && <Botao tipo="novo" onClick={() => buscar(true)}><RefreshCw size={14} /> Buscar envios</Botao>}
          <Botao tipo="cancelar" onClick={() => navigate('/societario')}>Voltar ao Kanban</Botao>
        </div>
        {status && <div className="mt-2 text-[12px] text-slate-500">{status}</div>}
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-center gap-2 font-semibold text-slate-700">Aguardando aprovação <Selo cor={COR.aviso}>{pend.length}</Selo></div>
        {pend.length === 0 && <div className="py-4 text-center text-slate-400">Nenhum formulário aguardando. Mande o link para o cliente e clique em “Buscar envios” quando ele avisar que enviou.</div>}
        {pend.map((f) => (
          <div key={f.id} className="mb-2 rounded border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-slate-700">{f.empresaNome}</div>
              <div className="text-[12px] text-slate-400">{dataHoraBR(f.recebidoEm)} · {f.protocolo ? `protocolo ${f.protocolo}` : 'colado à mão'}</div>
            </div>
            <div className="mt-1 text-[12px] text-slate-600">
              <Selo cor={COR.info}>{f.servico}</Selo> {rotuloNatureza(f.dados.natureza)}{f.servico === 'Alteração' && resumoMuda(f.dados) ? ` · muda ${resumoMuda(f.dados)}` : ''}
            </div>
            <div className="text-[12px] text-slate-500">{f.dados.contato?.responsavel} · {f.dados.contato?.telefone} · {f.dados.contato?.email}</div>
            <div className="text-[12px] text-slate-500">{f.dados.empresa?.endereco} — {f.dados.empresa?.cidade}/{f.dados.empresa?.uf}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {podeOperar && <Botao tipo="salvar" onClick={() => setAprovar(f)}>✓ Aprovar</Botao>}
              <Botao tipo="info" onClick={() => setVer(f)}><FileText size={13} /> Ver formulário</Botao>
              <Botao tipo="neutro" onClick={() => imprimir(f) || toast('erro', 'Permita pop-ups para imprimir o formulário.')}><Printer size={13} /> PDF</Botao>
              {f.temDocumento ? <Botao tipo="neutro" onClick={() => doc(f)}><Paperclip size={13} /> Ver documento</Botao> : <span className="self-center text-[12px] text-slate-400">✉ documento pedido à parte</span>}
              {podeOperar && <Botao tipo="excluir" onClick={() => excluir(f)}>Excluir</Botao>}
            </div>
          </div>
        ))}
      </div>

      {podeOperar && (
        <div className="card p-4">
          <div className="mb-1 text-center font-semibold text-slate-700">Receber por código (plano B)</div>
          <p className="mb-2 text-center text-[12px] text-slate-500">Quando o envio automático falha, o cliente recebe um código para mandar por WhatsApp ou e-mail. Cole a mensagem inteira aqui.</p>
          <textarea className={INP} rows={3} placeholder="ATUAN-SOC:…" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          {erroCodigo && <div className="mt-1 rounded bg-red-50 p-2 text-center text-[12px]" style={{ color: COR.erro }}>{erroCodigo}</div>}
          <div className="mt-2 flex justify-center gap-2">
            <Botao tipo="cancelar" onClick={() => { setCodigo(''); setErroCodigo(''); }}>Limpar</Botao>
            <Botao tipo="salvar" onClick={colar} disabled={!codigo.trim()}>Colocar na fila</Botao>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="mb-2 text-center font-semibold text-slate-700">Já aprovados</div>
        {aprov.length === 0 ? <div className="py-4 text-center text-slate-400">Nenhum formulário aprovado ainda.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-[13px]">
              <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Recebido</th><th>Empresa</th><th>Tipo</th><th>Contato</th><th>Processo</th><th /></tr></thead>
              <tbody>
                {aprov.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500">{dataHoraBR(f.recebidoEm)}</td>
                    <td><div className="text-slate-700">{f.empresaNome}</div><div className="text-[11px] text-slate-400">{f.protocolo ? `protocolo ${f.protocolo}` : ''}{f.empresaNova ? ' · cliente novo' : ''}</div></td>
                    <td>{f.servico}</td>
                    <td><div>{f.contato}</div><div className="text-[11px] text-slate-400">{f.telefone}</div></td>
                    <td>{f.processoCodigo ? <><Selo cor={COR.ok}>{f.processoCodigo}</Selo><div className="text-[11px] text-slate-400">por {f.aprovadoPor ?? '—'}</div></> : <Selo cor={COR.erro}>processo excluído</Selo>}</td>
                    <td className="space-x-1 whitespace-nowrap text-right">
                      <Botao tipo="info" onClick={() => setVer(f)}>Ver</Botao>
                      {f.temDocumento && <Botao tipo="neutro" onClick={() => doc(f, true)}><Paperclip size={13} /></Botao>}
                      <Botao tipo="neutro" onClick={() => imprimir(f)}><Printer size={13} /></Botao>
                      {podeOperar && <Botao tipo="excluir" onClick={() => excluir(f)}>Excluir</Botao>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal aberto={!!aprovar} titulo="Aprovar formulário" onFechar={() => setAprovar(null)} largura="max-w-2xl">
        {aprovar && (
          <>
            <div className="space-y-1 text-center text-[13px] text-slate-600">
              <div><b>Cliente:</b> {aprovar.empresaNome}</div>
              <div><b>Processo:</b> {aprovar.servico} · {rotuloNatureza(aprovar.dados.natureza)} · entra em “Formulário”</div>
              <div>Cartão no Kanban: sim, na primeira etapa</div>
              {aprovar.servico === 'Abertura' && <Selo cor={COR.novo}>abertura — vai para o Kanban de alvarás ao concluir</Selo>}
              {aprovar.servico === 'Alteração' && <div>Muda: {resumoMuda(aprovar.dados) || '—'} {(aprovar.dados.alteracao?.endereco || aprovar.dados.alteracao?.atividade) && <Selo cor={COR.novo}>vai para o Kanban de alvarás ao concluir</Selo>}</div>}
              <div className="text-[12px] text-slate-400">Se já existir empresa com o mesmo CNPJ (ou o mesmo nome, sem CNPJ), ela é reaproveitada.</div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Botao tipo="cancelar" onClick={() => setAprovar(null)}>Cancelar</Botao>
              <Botao tipo="salvar" onClick={confirmarAprovacao} disabled={busy}>{busy ? 'Criando…' : 'Aprovar e criar'}</Botao>
            </div>
          </>
        )}
      </Modal>

      <Modal aberto={!!ver} titulo="Formulário do cliente" onFechar={() => setVer(null)} largura="max-w-3xl">
        {ver && (
          <>
            <iframe title="ficha" srcDoc={fichaHTML(ver)} className="h-[60vh] w-full rounded border border-slate-200" />
            <div className="mt-3 flex justify-center gap-2">
              {ver.temDocumento && <Botao tipo="neutro" onClick={() => doc(ver, true)}><Paperclip size={13} /> Baixar anexo</Botao>}
              <Botao tipo="info" onClick={() => toast('ok', `Arquivo gerado: ${word(ver)}`)}>Word (.doc)</Botao>
              <Botao tipo="info" onClick={() => imprimir(ver) || toast('erro', 'Permita pop-ups para imprimir o formulário.')}><Printer size={13} /> Imprimir / PDF</Botao>
              <Botao tipo="cancelar" onClick={() => setVer(null)}>Fechar</Botao>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
