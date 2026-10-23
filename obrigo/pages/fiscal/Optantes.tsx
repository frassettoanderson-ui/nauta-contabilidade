// Situação Fiscal › Consulta de optantes — quem da carteira está no Simples, quem não está e desde
// quando. Fontes, nesta ordem: 1) CARTÃO CNPJ (Receita, botão "Atualizar pela Receita");
// 2) RELATÓRIO DO e-CAC (o "Optante atual" lido pelo FiscalView). Sem nenhuma das duas a empresa
// é NÃO CONSULTADA — que é diferente de "não é optante" (é aí que mora o erro caro).
import { useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Square } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast, Modal } from '../../components/ui';
import { Botao, INP, erroMsg } from '../societario/modais';
import { Selo } from '../societario/Gestao';
import { Anel } from '../societario/Kanban';
import { COR, GRUPOS, fiscalApi, useFiscal, fmtCnpj, digits, baixarCsv, hojeArq, espera, type EmpresaCarteira, type Relatorio, type Grupo } from './comum';

const PAUSA_MS = 1500; // a base pública recusa consultas em rajada
type Sit = { chave: 'optante' | 'fora' | 'sem'; rotulo: string; desde: string; saida?: string; fonte: string; em: string };

function situacao(c: EmpresaCarteira, fv: Map<string, Relatorio>): Sit {
  const em = c.receitaEm ? new Date(c.receitaEm).toLocaleDateString('pt-BR') : '';
  if (c.simplesOptante === 'sim') return { chave: 'optante', rotulo: 'Optante', desde: c.simplesDesde || '', fonte: 'cartão CNPJ', em };
  if (c.simplesOptante === 'nao') return { chave: 'fora', rotulo: 'Não optante', desde: '', saida: c.simplesSaida || '', fonte: 'cartão CNPJ', em };
  const e = fv.get(c.cnpj);
  if (e?.simples) {
    const t = e.simples.toLowerCase();
    if (t.includes('optante') && !t.includes('não') && !t.includes('nao')) return { chave: 'optante', rotulo: 'Optante', desde: '', fonte: 'relatório do e-CAC', em: (e.reportDateTime || '').slice(0, 10) };
    if (t.includes('não') || t.includes('nao')) return { chave: 'fora', rotulo: 'Não optante', desde: '', fonte: 'relatório do e-CAC', em: (e.reportDateTime || '').slice(0, 10) };
  }
  return { chave: 'sem', rotulo: 'Não consultado', desde: '', fonte: '', em: '' };
}
function simei(c: EmpresaCarteira) {
  if (c.simeiOptante === 'sim') return { chave: 'optante', rotulo: 'SIMEI', desde: c.simeiDesde || '' };
  if (c.carteiraMei) return { chave: 'mei', rotulo: 'carteira MEI', desde: '' };
  return { chave: '', rotulo: '', desde: '' };
}
const corSelo = (k: string) => (k === 'optante' ? COR.ok : k === 'fora' ? COR.neutro : COR.aviso);

export default function ConsultaOptantes() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'ecac_operar');
  const toast = useToast();
  const { carteira, relatorios, recarregar } = useFiscal();
  const [busca, setBusca] = useState('');
  const [recorte, setRecorte] = useState<'todos' | Sit['chave']>('todos');
  const [cart, setCart] = useState<'todas' | Grupo>('todas');
  const [rodada, setRodada] = useState<{ log: React.ReactNode[]; rodando: boolean; total: number } | null>(null);
  const parar = useRef(false);

  const fv = useMemo(() => new Map(relatorios.map((r) => [digits(r.cnpj), r])), [relatorios]);
  const clientes = useMemo(() => carteira.filter((c) => c.naCarteira !== false), [carteira]);
  const conta = { optante: 0, fora: 0, sem: 0 };
  clientes.forEach((c) => { conta[situacao(c, fv).chave]++; });
  const pct = clientes.length ? Math.round((conta.optante / clientes.length) * 100) : 0;

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase(), qd = digits(q);
    return clientes.filter((c) => (cart === 'todas' || c.grupo === cart) && (recorte === 'todos' || situacao(c, fv).chave === recorte)
      && (!q || c.nome.toLowerCase().includes(q) || (!!qd && c.cnpj.includes(qd))))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [clientes, busca, recorte, cart, fv]);

  // Consulta só quem está na lista atual, uma por vez e com pausa; o que já veio fica gravado
  async function atualizar() {
    const alvo = lista.filter((c) => c.cnpj.length === 14);
    if (!alvo.length) return toast('erro', 'Nenhuma empresa com CNPJ nesta lista.');
    parar.current = false;
    const log: React.ReactNode[] = [];
    const anota = (n: React.ReactNode) => { log.unshift(n); setRodada({ log: [...log], rodando: true, total: alvo.length }); };
    setRodada({ log: [], rodando: true, total: alvo.length });
    let mudaram = 0;
    for (const c of alvo) {
      if (parar.current) { anota(<span key={'p' + log.length}><strong>Interrompido.</strong> {mudaram} empresa(s) atualizada(s) até aqui.</span>); break; }
      try {
        const r = await fiscalApi.receita(c.id);
        if (r.mudou) mudaram++;
        anota(<span key={c.id}>{c.nome} → {r.simplesOptante === 'sim' ? <strong>optante</strong> : r.simplesOptante === 'nao' ? 'não optante' : 'sem resposta'}</span>);
      } catch (e) { anota(<span key={c.id} className="text-red-700">{c.nome} — {erroMsg(e)}</span>); }
      await espera(PAUSA_MS);
    }
    if (!parar.current) anota(<span key="fim"><strong>Fim.</strong> {mudaram} empresa(s) atualizada(s).</span>);
    setRodada((r) => (r ? { ...r, rodando: false } : r));
    recarregar();
  }
  function csv() {
    baixarCsv([['Empresa', 'CNPJ', 'Simples Nacional', 'Optante desde', 'Saída do Simples', 'SIMEI', 'Fonte', 'Consultado em'],
      ...lista.map((c) => { const s = situacao(c, fv), m = simei(c); return [c.nome, fmtCnpj(c.cnpj), s.rotulo, s.desde, s.saida ?? '', m.rotulo, s.fonte, s.em]; })],
    `Optantes_Simples_${hojeArq()}.csv`);
    toast('ok', `${lista.length} empresa(s) exportada(s).`);
  }

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Situação Fiscal · Simples Nacional</div>
            <div className="text-lg font-semibold">Consulta de optantes</div>
            <div className="text-[12px] text-slate-300">{conta.optante} de {clientes.length} empresa(s) no Simples</div>
            <div className="text-[12px] text-slate-300">a resposta vem do cartão CNPJ e do relatório do e-CAC</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { k: 'optante', t: 'Optantes', n: conta.optante, d: 'no Simples Nacional', c: COR.ok },
            { k: 'fora', t: 'Não optantes', n: conta.fora, d: 'fora do Simples', c: '#fff' },
            { k: 'sem', t: 'Não consultados', n: conta.sem, d: conta.sem ? 'sem cartão CNPJ nem e-CAC' : 'carteira toda consultada', c: COR.aviso },
          ] as const).map((k) => (
            <button key={k.k} onClick={() => setRecorte((r) => (r === k.k ? 'todos' : k.k))} className={`rounded p-2 text-center hover:bg-white/20 ${recorte === k.k ? 'bg-white/25 ring-1 ring-white/60' : 'bg-white/10'}`}>
              <div className="text-[11px] text-slate-300">{k.t}</div><div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div><div className="text-[11px] text-slate-300">{k.d}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div><div className="font-semibold text-slate-700">Empresas da carteira</div><div className="text-[12px] text-slate-500">A situação vem do cartão CNPJ e, na falta dele, do relatório do e-CAC. Clique em <strong>Atualizar pela Receita</strong> para consultar quem ainda não tem resposta.</div></div>
          <div className="flex gap-1.5">
            <Botao tipo="neutro" onClick={csv}><Download size={13} /> Baixar .csv</Botao>
            {podeOperar && <Botao tipo="novo" onClick={atualizar}><RefreshCw size={13} /> Atualizar pela Receita</Botao>}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <input className={`${INP} w-72`} placeholder="Nome ou CNPJ" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className={`${INP} w-48`} value={recorte} onChange={(e) => setRecorte(e.target.value as typeof recorte)}>
            <option value="todos">Todas as situações</option><option value="optante">Optantes</option><option value="fora">Não optantes</option><option value="sem">Não consultados</option>
          </select>
          <select className={`${INP} w-44`} value={cart} onChange={(e) => setCart(e.target.value as typeof cart)}>
            <option value="todas">Todas as carteiras</option><option value="nauta">NAUTA</option><option value="digital">ATUAN Digital</option><option value="mei">MEI</option>
          </select>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1.5">Empresa</th><th>CNPJ</th><th>Simples Nacional</th><th>Desde</th><th>SIMEI</th><th>Fonte</th></tr></thead>
            <tbody>
              {lista.length ? lista.map((c) => {
                const s = situacao(c, fv), m = simei(c);
                return (
                  <tr key={c.id} className="border-b border-slate-100 align-top">
                    <td className="py-1.5"><div className="font-medium text-slate-700">{c.nome}</div>{c.fantasia && <div className="text-[11px] text-slate-400">{c.fantasia}</div>}</td>
                    <td className="tabular-nums text-slate-600">{fmtCnpj(c.cnpj) || '—'}</td>
                    <td><Selo cor={corSelo(s.chave)}>{s.rotulo}</Selo>{s.saida && <div className="text-[11px] text-slate-400">saiu em {s.saida}</div>}</td>
                    <td>{s.desde || '—'}</td>
                    <td>{m.rotulo ? <><Selo cor={m.chave === 'optante' ? COR.ok : COR.aviso}>{m.rotulo}</Selo>{m.desde && <div className="text-[11px] text-slate-400">{m.desde}</div>}</> : '—'}</td>
                    <td className="text-[12px] text-slate-500">{s.fonte || '—'}{s.em ? ` · ${s.em}` : ''}</td>
                  </tr>
                );
              }) : <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhuma empresa neste recorte.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-slate-500">{lista.length} empresa(s) na lista · {clientes.length} na carteira.</p>
      </div>

      <Modal aberto={!!rodada} titulo="Atualizar pela Receita" onFechar={() => { if (rodada?.rodando) parar.current = true; else setRodada(null); }} largura="max-w-xl">
        {rodada && (
          <div>
            <p className="mb-2 text-center text-[12px] text-slate-500">{rodada.total} empresa(s) com CNPJ na lista atual. Consulta uma por vez, com pausa de {PAUSA_MS / 1000}s entre elas — a base pública recusa consultas em rajada. O que já veio fica gravado.</p>
            {rodada.rodando && <div className="mb-2 flex justify-center"><Botao tipo="excluir" onClick={() => { parar.current = true; }}><Square size={12} /> Parar</Botao></div>}
            <div className="max-h-64 space-y-0.5 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[12px] leading-relaxed">{rodada.log.map((n, i) => <div key={i}>{n}</div>)}</div>
            {!rodada.rodando && <div className="mt-3 flex justify-center"><Botao tipo="cancelar" onClick={() => setRodada(null)}>Fechar</Botao></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
