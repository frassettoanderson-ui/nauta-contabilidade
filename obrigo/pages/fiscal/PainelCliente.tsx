// Situação Fiscal › Painel Fiscal do cliente — lista da carteira por risco e, na mesma tela, o
// diagnóstico completo (consolidado, composição, item a item, vencimentos, omissões, PGFN,
// negociação editável, glossário e plano). A janela separada fica só para imprimir.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Trash2, Upload } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast, Modal } from '../../components/ui';
import { Botao, INP, erroMsg } from '../societario/modais';
import { Selo } from '../societario/Gestao';
import { Anel } from '../societario/Kanban';
import { COR, brl, digits, corRisco, fiscalApi, useFiscal, type Relatorio } from './comum';
import { CSS_RELATORIO, corpoRelatorio, imprimir, resumoEmpresa } from './diagnostico';

const NIVEIS = [
  { k: 'Crítico', cor: COR.erro, pe: 'débito exigível, PGFN ou omissão' },
  { k: 'Atenção', cor: COR.aviso, pe: 'suspenso ou certidão com efeitos' },
  { k: 'Regular', cor: COR.ok, pe: 'sem pendência relevante' },
] as const;
const peso: Record<string, number> = { Crítico: 0, Atenção: 1, Regular: 2 };
const iniciaisDe = (n: string) => String(n || '?').replace(/^[\d./-]+\s*/, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '??';

export default function PainelFiscalCliente() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'ecac_operar');
  const navigate = useNavigate();
  const { relatorios, carregando, recarregar } = useFiscal();
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<'risco' | 'valor' | 'nome'>('risco');
  const [risco, setRisco] = useState('');
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const contas = { Crítico: 0, Atenção: 0, Regular: 0 } as Record<string, number>;
  let tExig = 0;
  relatorios.forEach((c) => { const r = resumoEmpresa(c); tExig += r.exigivel; contas[r.risco]++; });
  const pct = relatorios.length ? Math.round((contas.Regular / relatorios.length) * 100) : 100;

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase(), qd = digits(q);
    return relatorios.filter((c) => (!risco || resumoEmpresa(c).risco === risco) && (!q || c.companyName.toLowerCase().includes(q) || (!!qd && digits(c.cnpj).includes(qd))))
      .sort((a, b) => {
        const ra = resumoEmpresa(a), rb = resumoEmpresa(b);
        if (ordem === 'valor') return rb.exigivel - ra.exigivel;
        if (ordem === 'nome') return a.companyName.localeCompare(b.companyName);
        return peso[ra.risco] - peso[rb.risco] || rb.exigivel - ra.exigivel;
      });
  }, [relatorios, busca, ordem, risco]);

  const aberto = relatorios.find((x) => x.id === abertoId);
  if (aberto) return <Diagnostico c={aberto} podeOperar={podeOperar} onVoltar={() => setAbertoId(null)} onExcluido={() => { setAbertoId(null); recarregar(); }} />;

  if (!carregando && !relatorios.length) {
    return (
      <div className="-m-6 min-h-full bg-fundo p-4 text-[13px]">
        <div className="card p-6 text-center">
          <div className="text-lg font-semibold text-slate-700">Painel Fiscal do cliente</div>
          <p className="text-slate-500">Diagnóstico individual a partir dos relatórios do e-CAC já importados.</p>
          <p className="mt-3 text-slate-500">Nenhuma empresa importada ainda. Importe os PDFs do “Relatório de Situação Fiscal” para gerar os diagnósticos.</p>
          <Botao tipo="novo" className="mt-3" onClick={() => navigate('/fiscal/empresas')}><Upload size={13} /> Importar do e-CAC</Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Situação Fiscal · e-CAC</div>
            <div className="text-lg font-semibold">Carteira fiscal</div>
            <div className="text-[12px] text-slate-300">{brl(tExig)} em débito exigível</div>
            <div className="text-[12px] text-slate-300">{contas.Regular} de {relatorios.length} empresa(s) sem pendência</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {NIVEIS.map((n) => (
            <button key={n.k} onClick={() => setRisco((r) => (r === n.k ? '' : n.k))} className={`rounded p-2 text-center hover:bg-white/20 ${risco === n.k ? 'bg-white/25 ring-1 ring-white/60' : 'bg-white/10'}`}>
              <div className="text-[11px] text-slate-300">{n.k}</div><div className="text-xl font-semibold" style={{ color: n.cor }}>{contas[n.k]}</div><div className="text-[11px] text-slate-300">{contas[n.k] ? n.pe : 'nenhuma empresa'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div><div className="font-semibold text-slate-700">Empresas da carteira</div><div className="text-[12px] text-slate-500">Clique numa empresa para abrir o diagnóstico completo — consolidado, débitos item a item, omissões, PGFN e plano de regularização.</div></div>
          <div className="flex gap-1.5">
            <select className={`${INP} w-56`} value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} title="Ordem da lista">
              <option value="risco">Ordenar por risco</option><option value="valor">Ordenar por valor em aberto</option><option value="nome">Ordenar por nome</option>
            </select>
            <Botao tipo="novo" onClick={() => navigate('/fiscal/empresas')}><Upload size={13} /> Importar do e-CAC</Botao>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <input className={`${INP} w-96`} placeholder="Nome da empresa ou CNPJ" value={busca} onChange={(e) => setBusca(e.target.value)} />
          {risco && <><Selo cor={corRisco(risco)}>{risco}</Selo><span className="text-[12px] text-slate-500">mostrando só as empresas deste nível</span><Botao tipo="cancelar" onClick={() => setRisco('')}>Ver todas</Botao></>}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((c) => {
            const r = resumoEmpresa(c);
            return (
              <button key={c.id} onClick={() => { setAbertoId(c.id); window.scrollTo(0, 0); }} className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-marca-300 hover:shadow-sm" style={{ borderLeft: `4px solid ${corRisco(r.risco)}` }}>
                <div className="flex items-start gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded text-[12px] font-semibold text-white" style={{ background: COR.marinho }}>{iniciaisDe(c.companyName)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-700">{c.companyName}</span><span className="block text-[11px] text-slate-400">{c.cnpj || '—'}</span></span>
                  <Selo cor={corRisco(r.risco)}>{r.risco}</Selo>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">Débito exigível</div>
                <div className="text-lg font-semibold" style={{ color: r.exigivel ? COR.erro : '#3f7a36' }}>{brl(r.exigivel)}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {!!r.debitos && <Selo cor={COR.erro}>{r.debitos} débito(s)</Selo>}
                  {!!r.omissoes && <Selo cor={COR.aviso}>{r.omissoes} omissão(ões)</Selo>}
                  {!!r.pgfn && <Selo cor="#7c5cbf">{r.pgfn} PGFN</Selo>}
                  {!!r.suspenso && <Selo cor={COR.info}>{brl(r.suspenso)} suspenso</Selo>}
                  {!r.debitos && !r.omissoes && !r.pgfn && !r.suspenso && <Selo cor={COR.ok}>Sem pendências</Selo>}
                </div>
                <div className="mt-1.5 flex justify-between gap-2 text-[11px] text-slate-400"><span>{c.municipality || '—'}{c.uf ? `/${c.uf}` : ''}</span><span className="truncate">{c.certificateType || 'Certidão não identificada'}</span></div>
              </button>
            );
          })}
          {!visiveis.length && <div className="col-span-full py-8 text-center text-slate-500">Nenhuma empresa{risco ? ` em ${risco.toLowerCase()}` : ''}.</div>}
        </div>
        <p className="mt-3 text-[12px] text-slate-500">{visiveis.length} empresa(s) de {relatorios.length} importada(s).</p>
      </div>
    </div>
  );
}

function Diagnostico({ c, podeOperar, onVoltar, onExcluido }: { c: Relatorio; podeOperar: boolean; onVoltar: () => void; onExcluido: () => void }) {
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [confirmar, setConfirmar] = useState(false);
  const html = useMemo(() => corpoRelatorio(c), [c]);
  const r = resumoEmpresa(c);
  function imprimirAgora() {
    // leva o que foi preenchido nos campos editáveis da negociação
    const corpo = ref.current?.querySelector('.pf-corpo')?.innerHTML ?? html;
    if (!imprimir(c.companyName, corpo)) toast('erro', 'Permita pop-ups para imprimir o Painel Fiscal.');
  }
  useEffect(() => {
    const b = ref.current?.querySelector('#pfImprimir');
    b?.addEventListener('click', imprimirAgora);
    return () => b?.removeEventListener('click', imprimirAgora);
  });
  async function excluir() {
    try { await fiscalApi.excluir(c.id); toast('ok', `Relatório de ${c.companyName} excluído.`); onExcluido(); }
    catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <Botao tipo="cancelar" onClick={onVoltar}><ArrowLeft size={13} /> Voltar para a lista</Botao>
        <span className="min-w-0 flex-1 truncate text-slate-500">{c.companyName}</span>
        {podeOperar && <Botao tipo="excluir" onClick={() => setConfirmar(true)} title="Apaga o relatório desta empresa do Obrigô"><Trash2 size={13} /> Excluir relatório</Botao>}
        <Botao tipo="novo" onClick={imprimirAgora}><Printer size={13} /> Imprimir / salvar em PDF</Botao>
      </div>
      <div ref={ref} className="pf-doc overflow-hidden rounded-lg">
        <style>{CSS_RELATORIO}</style>
        <div className="pf-corpo" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <Modal aberto={confirmar} titulo={`Excluir o relatório de ${c.companyName || 'esta empresa'}`} onFechar={() => setConfirmar(false)}>
        <div className="space-y-3 text-center text-slate-600">
          <p>Sai do Obrigô o que foi lido do <strong>Relatório de Situação Fiscal</strong> desta empresa. O cadastro da empresa e o resto do sistema não são tocados. Para tê-lo de volta, basta puxar de novo em <strong>Situação Fiscal → Puxar do e-CAC</strong>.</p>
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-[12px] leading-relaxed">
            <div><strong>Empresa:</strong> {c.companyName || '—'}</div><div><strong>CNPJ:</strong> {c.cnpj || '—'}</div>
            <div><strong>Relatório de:</strong> {c.reportDateTime || 'data não informada'}</div>
            <div><strong>Some do Obrigô:</strong> {r.debitos} débito(s), {r.omissoes} omissão(ões), {r.pgfn} PGFN e a situação da certidão</div>
          </div>
          <div className="flex justify-center gap-2"><Botao tipo="cancelar" onClick={() => setConfirmar(false)}>Cancelar</Botao><Botao tipo="excluir" onClick={excluir}>Excluir relatório</Botao></div>
        </div>
      </Modal>
    </div>
  );
}
