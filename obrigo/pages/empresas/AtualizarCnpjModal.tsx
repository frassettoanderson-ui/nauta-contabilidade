import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Modal } from '../../components/ui';
import type { EmpresaLista } from '../../lib/tipos';
import { formatarIdent } from '../../lib/tipos';

// Botao "Atualizar" da lista: reconsulta a Receita (CNPJ) e atualiza os dados cadastrais
// das empresas escolhidas. Uma por vez, com intervalo, para respeitar o limite dos provedores.
type St = { tipo: 'aguardando' | 'buscando' | 'ok' | 'erro'; msg?: string };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const temCnpj = (e: EmpresaLista) => (e.cnpj ?? '').replace(/\D/g, '').length === 14;

export default function AtualizarCnpjModal({ aberto, onFechar, onConcluido }: { aberto: boolean; onFechar: () => void; onConcluido: () => void }) {
  const [empresas, setEmpresas] = useState<EmpresaLista[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Record<string, St>>({});
  const [rodando, setRodando] = useState(false);
  const [progresso, setProgresso] = useState({ feitos: 0, total: 0 });

  // Carrega TODAS as empresas com CNPJ (ativas e inativas), pagina a pagina
  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    (async () => {
      setCarregando(true); setStatus({}); setSel(new Set());
      const todas: EmpresaLista[] = [];
      for (let page = 1; page <= 50; page++) {
        const r = await api.get<{ items: EmpresaLista[]; totalPages: number }>(`/empresas?page=${page}&limit=100&status=todos`);
        todas.push(...r.items);
        if (page >= r.totalPages) break;
      }
      if (cancelado) return;
      // mostra todas (inclusive sem CNPJ, so' para conferencia); marca de inicio apenas as consultaveis
      todas.sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial));
      setEmpresas(todas);
      setSel(new Set(todas.filter(temCnpj).map((e) => e.id)));
      setCarregando(false);
    })().catch(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [aberto]);

  const consultaveis = useMemo(() => empresas.filter(temCnpj), [empresas]);
  const todasSel = consultaveis.length > 0 && consultaveis.every((e) => sel.has(e.id));
  const toggle = (id: string) => setSel((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleTodas = () => setSel(todasSel ? new Set() : new Set(consultaveis.map((e) => e.id)));
  const setSt = (id: string, st: St) => setStatus((p) => ({ ...p, [id]: st }));

  async function processar(lista: EmpresaLista[]) {
    if (rodando || !lista.length) return;
    setRodando(true);
    setProgresso({ feitos: 0, total: lista.length });
    lista.forEach((e) => setSt(e.id, { tipo: 'aguardando' }));
    for (let i = 0; i < lista.length; i++) {
      const e = lista[i];
      setSt(e.id, { tipo: 'buscando' });
      try {
        const r = await api.post<{ razaoSocial: string }>(`/empresas/${e.id}/atualizar-cnpj`);
        setEmpresas((p) => p.map((x) => (x.id === e.id ? { ...x, razaoSocial: r.razaoSocial || x.razaoSocial } : x)));
        setSt(e.id, { tipo: 'ok' });
      } catch (err) {
        setSt(e.id, { tipo: 'erro', msg: err instanceof ApiError ? err.message : 'Falha ao atualizar' });
      }
      setProgresso({ feitos: i + 1, total: lista.length });
      if (i < lista.length - 1) await sleep(400);
    }
    setRodando(false);
    onConcluido();
  }

  const selecionadas = useMemo(() => empresas.filter((e) => sel.has(e.id)), [empresas, sel]);
  const okCount = Object.values(status).filter((s) => s.tipo === 'ok').length;
  const erroCount = Object.values(status).filter((s) => s.tipo === 'erro').length;

  return (
    <Modal aberto={aberto} titulo="Atualizar dados pela Receita (CNPJ)" onFechar={() => { if (!rodando) onFechar(); }} largura="max-w-2xl">
      <p className="mb-3 text-[13px] text-slate-600">
        Reconsulta o CNPJ de cada empresa e atualiza razao social, nome fantasia, endereco, telefone e atividade.
        E-mail, socios e demais campos nao sao alterados. Empresas sem CNPJ (em abertura) aparecem apenas para conferencia.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={() => processar(selecionadas)} disabled={rodando || !selecionadas.length} className="btn-primary">
          {rodando ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Atualizar selecionadas ({selecionadas.length})
        </button>
        <button onClick={() => processar(consultaveis)} disabled={rodando || !consultaveis.length} className="btn bg-status-info text-white hover:opacity-90">
          Atualizar todas com CNPJ ({consultaveis.length})
        </button>
        {rodando && <span className="text-[13px] text-slate-500">{progresso.feitos}/{progresso.total}…</span>}
        {!rodando && (okCount + erroCount) > 0 && (
          <span className="text-[13px] text-slate-500">{okCount} atualizada(s){erroCount ? `, ${erroCount} com erro` : ''}</span>
        )}
      </div>

      {carregando ? (
        <div className="py-6 text-center text-slate-400">Carregando empresas...</div>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto rounded border border-slate-200">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-slate-50 text-left text-[12px] text-slate-500">
              <tr>
                <th className="w-8 px-2 py-1.5"><input type="checkbox" checked={todasSel} onChange={toggleTodas} disabled={rodando} /></th>
                <th className="px-2 py-1.5">Empresa</th>
                <th className="px-2 py-1.5">CNPJ</th>
                <th className="w-40 px-2 py-1.5">Situacao</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => {
                const st = status[e.id];
                const ok = temCnpj(e);
                return (
                  <tr key={e.id} className={ok ? '' : 'text-slate-400'}>
                    <td className="px-2 py-1.5"><input type="checkbox" checked={sel.has(e.id)} onChange={() => toggle(e.id)} disabled={rodando || !ok} /></td>
                    <td className="px-2 py-1.5">{e.razaoSocial}{!e.ativo && <span className="ml-1 text-[11px] text-slate-400">(inativa)</span>}</td>
                    <td className="px-2 py-1.5 text-slate-500">{ok ? formatarIdent('CNPJ', e.cnpj ?? '') : <span className="italic">sem CNPJ</span>}</td>
                    <td className="px-2 py-1.5">
                      {!ok && <span className="text-slate-400">nao consultavel</span>}
                      {st?.tipo === 'buscando' && <span className="flex items-center gap-1 text-marca-600"><Loader2 size={14} className="animate-spin" /> consultando…</span>}
                      {st?.tipo === 'aguardando' && <span className="text-slate-400">na fila</span>}
                      {st?.tipo === 'ok' && <span className="flex items-center gap-1 text-status-ok"><CheckCircle2 size={14} /> atualizada</span>}
                      {st?.tipo === 'erro' && <span className="flex items-center gap-1 text-status-danger" title={st.msg}><XCircle size={14} /> {st.msg}</span>}
                    </td>
                  </tr>
                );
              })}
              {!empresas.length && <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-400">Nenhuma empresa.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
