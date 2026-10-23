// Situação Fiscal (e-CAC) — tipos, API e regras compartilhadas pelas telas (porte do painel da Atuan).
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { COR } from '../alvaras/comum';

export { COR };

export interface Debito { description: string; reference: string; dueDate: string; original: number; amount: number; penalty?: number; interest?: number; status: string; note?: string }
export interface Parcelamento { system?: string; suspended?: boolean; name: string; number?: string; count: number; suspendedValue?: number; atrasoValue?: number; modality?: string; note?: string }
export interface Pgfn { number: string; process?: string; source: string; status: string; system?: string; suspended?: boolean }
export interface Relatorio {
  id: string; empresaId: string | null; companyName: string; cnpj: string; reportDateTime: string; fileName: string;
  municipality: string; uf: string; address: string; district: string; zipCode: string; responsible: string;
  cadastralStatus: string; legalNature: string; openingDate: string; cnae: string; companySize: string; simples: string; simei: string;
  certificateType: string; certificateIssue: string; certificateValidity: string; certificateCode: string;
  exigibleDebts: Debito[]; suspendedDebts: Debito[]; installmentGroups: Parcelamento[]; pgfnItems: Pgfn[]; pgfnClear: boolean; unknownPending: string[];
  importedAt: string; exigibleAmount: number; suspendedAmount: number; overdueInstallments: number; installmentSuspended: number; installmentActive: number;
  pgfnActiveItems: Pgfn[]; pgfnSuspendedItems: Pgfn[]; pgfnCount: number; reportTimestamp: number;
  priority: 'Crítico' | 'Atenção' | 'Regular'; reasons: string[]; summary: string; quality: number; qualityLabel: string;
}
export type Grupo = 'nauta' | 'digital' | 'mei' | 'esporadico';
export interface EmpresaCarteira {
  id: string; nome: string; fantasia: string | null; ativo: boolean; naCarteira: boolean; cnpj: string; grupo: Grupo; carteiraMei: boolean;
  simplesOptante: string | null; simplesDesde: string | null; simplesSaida: string | null;
  simeiOptante: string | null; simeiDesde: string | null; simeiSaida: string | null; receitaEm: string | null;
}
export interface Importacao { id: string; arquivo: string; empresa: string | null; status: 'ok' | 'replaced' | 'ignored' | 'error'; mensagem: string | null; usuarioNome: string | null; createdAt: string }
export interface DadosFiscal { relatorios: Relatorio[]; carteira: EmpresaCarteira[]; historico: Importacao[] }
export interface ResultadoImport { itens: { arquivo: string; empresa?: string; status: Importacao['status']; mensagem: string }[]; total: number; concluidos: number; novos: number; atualizados: number; erros: number; baixados?: number }
export interface JobRobo { id: string; status: 'pending' | 'running' | 'done'; total: number; pdfs: string[]; summary: { baixados?: number; total?: number; sem_relatorio?: string[] } | null; by?: string; created?: number }
export interface LinhaOptante { nome: string; sit_simples: string; sit_simei: string; ev_simples: string; ev_simei: string; status: string; erro: string; em: number }
export interface ObsOptante { texto: string; por?: string; em?: number }
export interface JobOptante { id: string; status: string; total: number; feitos: number; summary: { consultados?: number; com_evento?: number; erros?: number; captcha?: boolean; quebrou?: boolean } | null }

export const fiscalApi = {
  dados: () => api.get<DadosFiscal>('/sitfiscal/dados'),
  importar: (arquivos: File[]) => { const fd = new FormData(); arquivos.forEach((a) => fd.append('arquivos', a, a.name)); return api.upload<ResultadoImport>('/sitfiscal/importar', fd); },
  excluir: (id: string) => api.del<{ excluido: boolean }>(`/sitfiscal/relatorios/${id}`),
  situacoes: () => api.get<Record<string, { sit: string; em: number }>>('/sitfiscal/robo/situacoes'),
  jobs: () => api.get<JobRobo[]>('/sitfiscal/robo/jobs'),
  job: (id: string) => api.get<JobRobo>(`/sitfiscal/robo/jobs/${encodeURIComponent(id)}`),
  pedir: (cnpjs: string[]) => api.post<{ id: string; total: number }>('/sitfiscal/robo/jobs', { cnpjs }),
  limparFila: () => api.post<{ removidos: number }>('/sitfiscal/robo/limpar'),
  parar: () => api.post<{ ok: boolean; pendentes_removidos: number }>('/sitfiscal/robo/parar'),
  importarDoRobo: (itens: { jobId: string; nome: string }[]) => api.post<ResultadoImport>('/sitfiscal/robo/importar', { itens }),
  optantes: () => api.get<Record<string, LinhaOptante>>('/sitfiscal/optantes'),
  obs: () => api.get<Record<string, ObsOptante>>('/sitfiscal/optantes/obs'),
  gravarObs: (cnpj: string, texto: string) => api.post('/sitfiscal/optantes/obs', { cnpj, texto }),
  pedirOptantes: (cnpjs: string[]) => api.post<{ id: string; total: number }>('/sitfiscal/optantes/jobs', { cnpjs }),
  jobOptantes: (id: string) => api.get<JobOptante>(`/sitfiscal/optantes/jobs/${encodeURIComponent(id)}`),
  receita: (empresaId: string) => api.post<{ nome: string; mudou: boolean; simplesOptante: string | null; simeiOptante: string | null }>(`/sitfiscal/receita/${empresaId}`),
};

export function useFiscal() {
  const [dados, setDados] = useState<DadosFiscal>({ relatorios: [], carteira: [], historico: [] });
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(() => fiscalApi.dados().then(setDados).catch(() => undefined).finally(() => setCarregando(false)), []);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { ...dados, carregando, recarregar };
}

// ─── Formatação ─────────────────────────────────────────────────────────────
export const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '');
export const brl = (n: unknown) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function fmtCnpj(v: unknown) { const d = digits(v); return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : String(v ?? ''); }
const z = (v: number) => String(v).padStart(2, '0');
export function soData(ms?: number | null) { if (!ms) return ''; const d = new Date(ms); return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}`; }
export function soHora(ms?: number | null) { if (!ms) return ''; const d = new Date(ms); return `${z(d.getHours())}:${z(d.getMinutes())}`; }
export function dataHora(ms?: number | null) { return ms ? `${soData(ms)} às ${soHora(ms)}` : '—'; }
export function diasAtras(ms?: number | null) { return ms ? Math.floor((Date.now() - ms) / 86400000) : null; }
export function msDeDataBR(txt: unknown) { const m = String(txt || '').match(/(\d{2})\/(\d{2})\/(\d{4})(?:[ ,]+(\d{2}):(\d{2}))?/); return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)).getTime() : 0; }
export function dataBRparaDate(v: unknown) { const m = String(v || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; }

// ─── Carteiras (grupos do painel) ───────────────────────────────────────────
export const GRUPOS: Record<'todos' | Grupo, string> = { todos: 'Todos', nauta: 'NAUTA', digital: 'ATUAN Digital', mei: 'MEI', esporadico: 'Esporádicos' };
export const ORDEM_GRUPOS: ('todos' | Grupo)[] = ['todos', 'nauta', 'digital', 'mei', 'esporadico'];

// ─── Risco (cores do Obrigô) ────────────────────────────────────────────────
export const corRisco = (p: string) => (p === 'Crítico' ? COR.erro : p === 'Atenção' ? COR.aviso : p === 'Regular' ? COR.ok : COR.neutro);
export const corCertidao = (c: string) => (c === 'Negativa' ? COR.ok : c === 'Positiva com efeitos de negativa' ? COR.aviso : c === 'Positiva' ? COR.erro : COR.neutro);
export const rank = (p: string) => ({ Crítico: 0, Atenção: 1, Regular: 2 } as Record<string, number>)[p] ?? 9;

// ─── Robô: falhas e data do último relatório ────────────────────────────────
// "49.089.513/0001-00 - sem autorizacao (procuracao)" -> cnpj + motivo (o motivo vem do robô como está)
export function partirFalha(linha: string) { const t = String(linha || '').trim(); const c = t.indexOf(' - '); return { cnpj: (c > 0 ? t.slice(0, c) : t).trim(), motivo: (c > 0 ? t.slice(c + 3) : '').trim() }; }
export function motivoLegivel(m: string) {
  const t = String(m || '').toLowerCase();
  if (t.includes('procuracao') || t.includes('procuração') || t.includes('autoriza')) return 'Sem procuração no e-CAC';
  if (t.includes('certificado')) return 'Falha no certificado digital';
  if (t.includes('timeout') || t.includes('tempo')) return 'O e-CAC não respondeu a tempo';
  return m || 'Motivo não informado';
}
export function falhasDoJob(j: JobRobo, nomePorCnpj: (c: string) => string) {
  return (j.summary?.sem_relatorio ?? []).map((linha) => { const f = partirFalha(linha); return { cnpj: f.cnpj, nome: nomePorCnpj(f.cnpj), motivo: motivoLegivel(f.motivo), motivoBruto: f.motivo }; });
}
// CNPJ -> último relatório: 1) pedidos guardados na ponte (data do pedido); 2) data impressa no relatório lido
export function mapaUltimoPuxado(execucoes: JobRobo[], relatorios: Relatorio[]) {
  const m: Record<string, { ms: number; fonte: 'robô' | 'relatório' }> = {};
  const guardar = (cnpj: string, ms: number, fonte: 'robô' | 'relatório') => { if (!ms || cnpj.length !== 14) return; if (!m[cnpj] || ms > m[cnpj].ms) m[cnpj] = { ms, fonte }; };
  execucoes.forEach((j) => (j.pdfs || []).forEach((nome) => { const d = digits(nome); guardar(d.length >= 14 ? d.slice(-14) : d, j.created || 0, 'robô'); }));
  relatorios.forEach((c) => guardar(digits(c.cnpj), msDeDataBR(c.reportDateTime), 'relatório'));
  return m;
}

// ─── Arquivo para baixar ────────────────────────────────────────────────────
export function baixarCsv(linhas: (string | number)[][], nome: string) {
  const csv = linhas.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  baixarBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), nome);
}
export function baixarBlob(blob: Blob, nome: string) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export const hojeArq = () => new Date().toISOString().slice(0, 10);
export const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
