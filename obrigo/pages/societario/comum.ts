// Societario — tipos, constantes e utilitarios compartilhados pelas telas.
// Regras do painel da Atuan (ver SPEC-SOCIETARIO.md).
import { api, BASE, getAccessToken } from '../../lib/api';

export const ETAPAS = ['Formulário', 'Viabilidade', 'Documento Básico', 'Requerimento', 'Pagamento', 'Assinatura e arquivamento'] as const;
export const CONCLUIDOS = 'Concluídos';
export const SITUACOES = ['Aguardando cliente', 'Em análise', 'Em exigência', 'Finalizado'];
export const SERVICOS = ['Abertura', 'Alteração', 'Baixa'];
export const NATUREZAS: { v: string; t: string; cod: string }[] = [
  { v: 'LTDA', t: 'Sociedade Limitada', cod: '206-2' },
  { v: 'EI', t: 'Empresário Individual', cod: '213-5' },
  { v: 'ASSOCIACAO', t: 'Associação Privada', cod: '399-9' },
  { v: 'MEI', t: 'Microempreendedor Individual', cod: '213-5' },
];
export const DEPENDE_DE = ['Escritório', 'Cliente', 'Junta Comercial', 'Receita Federal', 'Prefeitura', 'Cartório', 'Outro'];
export const HONORARIO_SIT = ['Não informado', 'Pendente', 'Parcial', 'Pago', 'Cortesia'];
export const FRENTES: { v: string; t: string }[] = [
  { v: 'digital', t: 'ATUAN Digital' },
  { v: 'nauta', t: 'NAUTA' },
  { v: 'esporadico', t: 'Esporádicos' },
];
export const TIPOS_CLIENTE: { v: string; t: string; d: string }[] = [
  { v: 'digital', t: 'ATUAN Digital', d: 'entra na carteira, frente ATUAN Digital' },
  { v: 'nauta', t: 'NAUTA', d: 'entra na carteira, frente NAUTA' },
  { v: 'mei', t: 'MEI', d: 'entra na carteira do MEI' },
  { v: 'esporadico', t: 'Esporádico', d: 'entra na carteira de esporádicos — serviço avulso' },
];
export const HORAS_ARQUIVO = 3;
export const LINK_REGIN = 'https://regin.jucesc.sc.gov.br/regin.externo/CON_ViabilidadeSelecaoExternoV4.aspx';
export const ROTULO_FRENTE: Record<string, string> = { digital: 'ATUAN Digital', nauta: 'NAUTA', esporadico: 'Esporádicos' };

// Cores Obrigô
export const COR = { ok: '#88b87f', novo: '#F47920', aviso: '#ffb752', erro: '#d15b47', info: '#69a8d9', neutro: '#94a3b8', marinho: '#0e2240' };

export interface ItemChecklist { id: string; ordem: number; etapa: string; tarefa: string; feito: boolean; na: boolean; nota: string | null }
export interface EmpresaResumo { id: string; razaoSocial: string; nomeFantasia: string | null; frente: string | null; naCarteira: boolean; carteiraMei: boolean; ativo: boolean; emAbertura: boolean; cnpj: string }
export interface Processo {
  id: string; codigo: string; empresaId: string | null; empresa: EmpresaResumo | null; grupo: string | null;
  servico: string; natureza: string; etapa: string; situacao: string; responsavel: string | null; dependeDe: string;
  prazo: string | null; proximaAcao: string | null; honorario: number | null; honorarioSit: string; cpf: string | null;
  senhaGov: string | null; observacao: string | null; protocoloRegin: string | null; requerimento: string | null;
  pagamentoFeito: boolean; mudaEndereco: boolean; mudaAtividade: boolean; mudaMunicipio: boolean;
  baixaCadEconomico: boolean | null; foraDoQuadro: boolean; ocultoAte: string | null; concluidoEm: string | null;
  origemFormularioId: string | null; createdAt: string; checklist: ItemChecklist[];
  progresso: number; formularioRecebido: boolean; passaPelaViabilidade: boolean;
}
export interface Historico { id: string; acao: string; detalhe: string | null; usuarioNome: string | null; createdAt: string }

export const rotuloNatureza = (k?: string | null) => (NATUREZAS.find((n) => n.v === k) ?? NATUREZAS[0]).t;
export const nomeCliente = (p: Processo) => p.empresa?.razaoSocial ?? '⚠ ficha removida';
export const idxEtapa = (e: string) => (e === CONCLUIDOS ? ETAPAS.length : (ETAPAS as readonly string[]).indexOf(e));
export const frenteDoProcesso = (p: Processo) => (p.grupo === 'digital' || p.grupo === 'nauta' ? p.grupo : p.empresa?.frente === 'digital' ? 'digital' : p.empresa?.frente === 'nauta' ? 'nauta' : p.empresa?.frente || 'digital');

// ─── Datas / prazo ──────────────────────────────────────────────────────────
export function hojeISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
export function diasAte(data?: string | null) {
  if (!data) return null;
  const a = new Date(`${hojeISO()}T00:00:00Z`).getTime();
  const b = new Date(`${data.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}
export type Semaforo = { rotulo: 'Atrasado' | 'Atenção' | 'No prazo' | 'Sem prazo'; cor: string; peso: number };
export function semaforo(prazo?: string | null): Semaforo {
  const d = diasAte(prazo);
  if (d === null) return { rotulo: 'Sem prazo', cor: COR.neutro, peso: 3 };
  if (d < 0) return { rotulo: 'Atrasado', cor: COR.erro, peso: 0 };
  if (d <= 30) return { rotulo: 'Atenção', cor: COR.aviso, peso: 1 };
  return { rotulo: 'No prazo', cor: COR.ok, peso: 2 };
}
export function prazoRelativo(prazo?: string | null) {
  const d = diasAte(prazo);
  if (d === null) return 'sem prazo';
  if (d < 0) return `há ${-d} dia(s)`;
  if (d === 0) return 'hoje';
  return `em ${d} dia(s)`;
}
export const dataBR = (d?: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '—');
export const dataHoraBR = (d?: string | null) => (d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
export const moeda = (v?: number | null) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function voltaEm(ate: string) {
  const min = Math.max(0, Math.round((new Date(ate).getTime() - Date.now()) / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60); const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}
export const emSoneca = (p: Processo) => !!p.ocultoAte && new Date(p.ocultoAte).getTime() > Date.now();
export const arquivado = (p: Processo) => p.situacao === 'Finalizado' && !!p.concluidoEm && Date.now() - new Date(p.concluidoEm).getTime() >= HORAS_ARQUIVO * 3600_000;

// ─── Mascaras ───────────────────────────────────────────────────────────────
const dig = (v: string) => v.replace(/\D/g, '');
export function mascaraCnpj(v: string) {
  const d = dig(v).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}
export function mascaraCpf(v: string) {
  const d = dig(v).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
export function mascaraMoeda(v: string) {
  const d = dig(v);
  if (!d) return '';
  return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export const moedaParaNumero = (v: string) => (v ? Number(dig(v)) / 100 : 0);
export const numeroParaMoeda = (n?: number | null) => (n ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');

export async function copiar(texto: string) {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
}

// Abre/baixa um arquivo protegido da API (precisa do token)
export async function abrirArquivo(caminho: string, baixar = false, nome = 'arquivo') {
  const r = await fetch(`${BASE}${caminho}${baixar ? '?baixar=1' : ''}`, { headers: { Authorization: `Bearer ${getAccessToken()}` }, credentials: 'include' });
  if (!r.ok) throw new Error('Arquivo indisponível.');
  const url = URL.createObjectURL(await r.blob());
  if (baixar) { const a = document.createElement('a'); a.href = url; a.download = nome; a.click(); }
  else window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ─── API ────────────────────────────────────────────────────────────────────
export const socApi = {
  listar: () => api.get<Processo[]>('/societario/processos'),
  obter: (id: string) => api.get<Processo & { historico: Historico[] }>(`/societario/processos/${id}`),
  criar: (b: unknown) => api.post<Processo & { clienteJaCadastrado: boolean }>('/societario/processos', b),
  salvar: (id: string, b: unknown) => api.put<Processo>(`/societario/processos/${id}`, b),
  campo: (id: string, campo: string, valor: unknown) => api.patch<{ processo: Processo; travado?: boolean; completo?: boolean }>(`/societario/processos/${id}/campo`, { campo, valor }),
  renomear: (id: string, nome: string) => api.post<Processo>(`/societario/processos/${id}/renomear`, { nome }),
  item: (id: string, itemId: string, b: { feito?: boolean; na?: boolean }) => api.post<{ processo: Processo; travado: boolean; completo: boolean }>(`/societario/processos/${id}/checklist/${itemId}`, b),
  mover: (id: string, destino: string, alteracao?: { mudaEndereco: boolean; mudaMunicipio: boolean; mudaAtividade: boolean }) =>
    api.post<{ processo: Processo; precisa?: 'confirmarAlteracao' | 'concluir' }>(`/societario/processos/${id}/mover`, { destino, alteracao }),
  concluir: (id: string, b: { baixaCadEconomico?: boolean | null; viraCliente: boolean; tipo?: string }) =>
    api.post<{ processo: Processo; alvara: boolean; avisos: string[] }>(`/societario/processos/${id}/concluir`, b),
  carteira: (id: string, naCarteira: boolean) => api.post<Processo>(`/societario/processos/${id}/carteira`, { naCarteira }),
  devolver: (ids: string[]) => api.post<{ devolvidos: number }>('/societario/devolver', { ids }),
  excluir: (id: string) => api.del(`/societario/processos/${id}`),
};

export const precisaCadastroEconomico = (p: Processo) => p.mudaMunicipio || p.servico === 'Baixa';
export const mexeComAlvara = (p: Processo) => p.servico === 'Abertura' || (p.servico === 'Alteração' && (p.mudaEndereco || p.mudaAtividade));

// Travas do quadro (as mesmas que o servidor aplica) — usadas so para avisar antes de chamar a API
export function travaMovimento(p: Processo, destino: string): string {
  const iDest = idxEtapa(destino); const iAtual = idxEtapa(p.etapa);
  const tf = p.checklist.filter((i) => !i.na && i.etapa === 'Formulário');
  if (p.etapa === 'Formulário' && destino !== 'Formulário' && tf.length && !tf.every((i) => i.feito)) return 'Marque “Estou com o formulário” antes de tirar o processo do Formulário.';
  if (p.natureza !== 'MEI' && iDest >= idxEtapa('Pagamento') && iDest > iAtual && !(p.requerimento ?? '').trim()) return 'Preencha o nº do requerimento no cartão antes de ir para Pagamento.';
  if (p.etapa === 'Pagamento' && (p.servico === 'Abertura' || p.servico === 'Alteração') && iDest > idxEtapa('Pagamento') && !p.pagamentoFeito) return 'Marque “Pagamento efetuado” antes de tirar o processo do Pagamento.';
  if (p.passaPelaViabilidade && iAtual <= idxEtapa('Viabilidade') && iDest > idxEtapa('Viabilidade') && !(p.protocoloRegin ?? '').trim()) return 'Informe o protocolo do REGIN no cartão da Viabilidade antes de avançar.';
  return '';
}

// Preferencia local: frente escolhida no seletor
export function frenteSalva(): string { try { return localStorage.getItem('obrigo.soc.frente') || 'todas'; } catch { return 'todas'; } }
export function salvarFrente(v: string) { try { localStorage.setItem('obrigo.soc.frente', v); } catch { /* sem storage */ } }
export const daFrente = (p: Processo, f: string) => f === 'todas' || frenteDoProcesso(p) === f;
