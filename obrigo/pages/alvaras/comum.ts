// Alvaras — tipos, API e utilitarios. Regras do painel da Atuan (SPEC-ALVARAS.md).
import { api } from '../../lib/api';
import { LICENCAS, LIC_SITUACOES, ETAPAS_LEGAL } from './dados';
import { CNAE_UFM } from './tabelaCnae';

export { LICENCAS, LIC_SITUACOES, ETAPAS_LEGAL };
export const MOTIVOS_INATIVACAO = ['Baixa / encerramento da empresa', 'Empresa inativa (sem movimento)', 'Cliente saiu do escritório', 'Outro'];
export const TIPOS_PROCESSO = ['Abertura', 'Renovação', 'Alteração', 'Baixa', 'Manual'];
export const DIAS_ARQUIVO = 2;
export const COR = { ok: '#88b87f', novo: '#F47920', aviso: '#ffb752', erro: '#d15b47', info: '#69a8d9', neutro: '#94a3b8', marinho: '#0e2240' };

export interface EmpresaMin { id: string; razaoSocial: string; ativo: boolean; cnaes: string | null; cnpj: string }
export interface Licenca {
  id: string; empresaId: string | null; empresa: EmpresaMin | null; clienteNome: string | null; tipo: string; orgao: string | null;
  protocolo: string | null; situacao: string; emissao: string | null; validade: string | null; responsavel: string | null;
  taxa: number | null; observacao: string | null; inativo: boolean; inativoEm: string | null; inativoMotivo: string | null; ultimaConclusao: string | null;
}
export interface Legalizacao {
  id: string; empresaId: string | null; empresa: EmpresaMin | null; clienteNome: string | null; processoId: string | null; licencaId: string | null;
  paiId: string | null; tipo: string; orgao: string | null; protocolo: string | null; tipoProcesso: string; prazo: string | null; vencimento: string | null;
  etapa: string; observacao: string | null; alvarasPrevistos: string[] | null; alvarasGerados: string[] | null; ocultoNoIniciar: boolean;
  taxaPaga: boolean; concluidoEm: string | null; inativo: boolean; createdAt: string;
}

export const nomeLic = (l: { empresa: EmpresaMin | null; clienteNome: string | null }) => l.empresa?.razaoSocial ?? l.clienteNome ?? '⚠ empresa removida';
export function hojeISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
export function diasAte(data?: string | null) {
  if (!data) return null;
  return Math.round((new Date(`${data.slice(0, 10)}T00:00:00Z`).getTime() - new Date(`${hojeISO()}T00:00:00Z`).getTime()) / 86400000);
}
export const dataBR = (d?: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '—');
export const moeda = (v?: number | null) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// "Deferido / emitido" ou "A renovar" com validade passada aparece como "Vencido" (sem gravar)
export function situacaoEfetiva(l: Licenca) {
  const d = diasAte(l.validade);
  if (d !== null && d < 0 && (l.situacao === 'Deferido / emitido' || l.situacao === 'A renovar')) return 'Vencido';
  return l.situacao || '—';
}
export const corSituacao = (s: string) => (s === 'Deferido / emitido' ? COR.ok : s === 'Vencido' || s === 'Indeferido' ? COR.erro : s === 'Em exigência' || s === 'A renovar' ? COR.aviso : COR.info);
export function corValidade(validade?: string | null) {
  const d = diasAte(validade);
  if (d === null) return COR.neutro;
  if (d < 0) return COR.erro;
  if (d <= 30) return COR.aviso;
  return COR.ok;
}
export const arquivado = (c: Legalizacao) => c.etapa === 'Concluído' && !!c.concluidoEm && (diasAte(c.concluidoEm.slice(0, 10)) ?? 0) <= -DIAS_ARQUIVO;

// ─── CNAE → UFM ─────────────────────────────────────────────────────────────
const soDig = (v: string) => v.replace(/\D/g, '');
export function ufmDeCnae(cnae: string): number | null {
  const d = soDig(cnae);
  if (!d) return null;
  const exato = CNAE_UFM.find((r) => soDig(r[0]) === d);
  if (exato) return exato[2];
  const pref = CNAE_UFM.find((r) => soDig(r[0]).startsWith(d));
  return pref ? pref[2] : null;
}
export function buscarCnae(termo: string, limite = 15) {
  const t = termo.trim().toLowerCase();
  if (t.length < 2) return [];
  const d = soDig(t);
  const out: [string, string, number][] = [];
  for (const r of CNAE_UFM) {
    if ((d && soDig(r[0]).startsWith(d)) || r[1].toLowerCase().includes(t)) out.push(r);
    if (out.length >= limite) break;
  }
  return out;
}
export const TOTAL_CNAES = CNAE_UFM.length;

// ─── API ────────────────────────────────────────────────────────────────────
export const alvApi = {
  licencas: () => api.get<Licenca[]>('/alvaras/licencas'),
  salvarLicenca: (id: string | null, b: unknown) => (id ? api.put(`/alvaras/licencas/${id}`, b) : api.post('/alvaras/licencas', b)),
  obsLicenca: (id: string, observacao: string) => api.patch(`/alvaras/licencas/${id}/observacao`, { observacao }),
  excluirLicenca: (id: string) => api.del(`/alvaras/licencas/${id}`),
  renovar: (id: string) => api.post<{ validade: string }>(`/alvaras/licencas/${id}/renovar`),
  paraKanban: (id: string) => api.post(`/alvaras/licencas/${id}/kanban`),
  corrigirTipo: (de: string, para: string) => api.post<{ alterados: number }>('/alvaras/licencas/corrigir-tipo', { de, para }),
  importar: (linhas: unknown[]) => api.post<{ novos: number; atualizados: number; ignoradas: number; semCadastro: string[] }>('/alvaras/licencas/importar', { linhas }),
  inativar: (empresaId: string, motivo: string | null) => api.post<{ licencas: number; legalizacoes: number }>(`/alvaras/empresas/${empresaId}/inativar`, { motivo }),
  legalizacoes: () => api.get<Legalizacao[]>('/alvaras/legalizacoes'),
  novaLegalizacao: (empresaId: string) => api.post<Legalizacao>('/alvaras/legalizacoes', { empresaId }),
  salvarCartao: (id: string, b: unknown) => api.put<{ gerados: number }>(`/alvaras/legalizacoes/${id}`, b),
  taxa: (id: string, paga: boolean) => api.post(`/alvaras/legalizacoes/${id}/taxa`, { paga }),
  vencimento: (id: string, vencimento: string | null) => api.post(`/alvaras/legalizacoes/${id}/vencimento`, { vencimento }),
  mover: (id: string, destino: string) => api.post<{ aviso: string }>(`/alvaras/legalizacoes/${id}/mover`, { destino }),
  tirar: (id: string) => api.del(`/alvaras/legalizacoes/${id}`),
  pendentes: () => api.get<unknown[]>('/alvaras/pendentes-societario'),
  puxar: () => api.post<{ criados: number }>('/alvaras/puxar-concluidos'),
  config: () => api.get<{ parametros: Record<string, unknown>; checklists: Record<string, unknown> }>('/alvaras/config'),
  salvarConfig: (b: unknown) => api.put<{ parametros: Record<string, unknown>; checklists: Record<string, unknown> }>('/alvaras/config', b),
  empresas: () => api.get<EmpresaMin[]>('/alvaras/empresas'),
  buscarCnaes: (empresaId: string) => api.post<{ cnaes: string }>(`/alvaras/empresas/${empresaId}/cnaes`),
};

// ─── Planilha (SheetJS carregado sob demanda) ───────────────────────────────
export const COLUNAS_XLS = ['Cliente', 'Licença / tipo', 'Órgão', 'Protocolo / nº', 'Validade', 'Situação', 'Responsável', 'Observações'];
export async function xlsx() { return import('xlsx'); }
export async function baixarPlanilha(nome: string, abas: { nome: string; linhas: (string | number)[][] }[]) {
  const X = await xlsx();
  const wb = X.utils.book_new();
  for (const a of abas) X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(a.linhas), a.nome);
  X.writeFile(wb, nome);
}
