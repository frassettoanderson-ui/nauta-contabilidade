// Alvaras › Referencias — Matriz de licencas por atividade, Orgaos e fluxo, Checklists de legalizacao.
import { useEffect, useState } from 'react';
import { ExternalLink, ArrowUp, ArrowDown, Pencil, X } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import { Selo } from '../societario/Gestao';
import { MATRIZ, FLUXO, ORGAOS, CHECKLISTS } from './dados';
import { COR, alvApi } from './comum';
import { Botao, INP, erroMsg } from './modais';

type Item = { id: string; texto: string; feito: boolean };
type Mapa = Record<string, Item[]>;
const novoId = () => Math.random().toString(36).slice(2, 10);
const moldes = (): Mapa => Object.fromEntries(Object.entries(CHECKLISTS).map(([k, v]) => [k, v.map((t) => ({ id: novoId(), texto: t, feito: false }))]));

export default function ReferenciasAlvaras() {
  const [aba, setAba] = useState<'matriz' | 'orgaos' | 'checklists'>('matriz');
  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="flex justify-center gap-1">
        {([['matriz', 'Matriz de licenças'], ['orgaos', 'Órgãos e fluxo'], ['checklists', 'Checklists de legalização']] as const).map(([k, t]) => (
          <button key={k} onClick={() => setAba(k)} className={`rounded px-3 py-1.5 ${aba === k ? 'bg-marca-50 font-medium text-marca-700' : 'text-slate-500 hover:bg-slate-100'}`}>{t}</button>
        ))}
      </div>
      {aba === 'matriz' && <Matriz />}{aba === 'orgaos' && <Orgaos />}{aba === 'checklists' && <Checklists />}
    </div>
  );
}

function Matriz() {
  const [q, setQ] = useState(''); const [r, setR] = useState('');
  const cor = (x: string) => (x.startsWith('Alto') ? COR.erro : x.startsWith('Médio') ? COR.aviso : COR.ok);
  const lista = MATRIZ.filter((m) => (!r || m.r.startsWith(r)) && (!q || (m.a + ' ' + m.lic.join(' ')).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="card p-3">
      <div className="text-center font-semibold text-slate-700">Matriz de licenças</div>
      <div className="mb-2 text-center text-[12px] text-slate-500">O que cada atividade precisa antes de operar, por grupo de risco.</div>
      <div className="mb-2 flex justify-center gap-2">
        <input className={`${INP} w-64`} placeholder="Pesquisar atividade" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${INP} w-40`} value={r} onChange={(e) => setR(e.target.value)}><option value="">Todos os riscos</option><option>Baixo</option><option>Médio</option><option>Alto</option></select>
      </div>
      <table className="w-full text-[13px]">
        <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Atividade / segmento</th><th>Risco</th><th>Licenças e cadastros exigidos</th><th>Órgãos</th></tr></thead>
        <tbody>{lista.map((m) => (
          <tr key={m.a} className="border-b border-slate-100 align-top">
            <td className="py-1.5 font-medium text-slate-700">{m.a}</td><td><Selo cor={cor(m.r)}>{m.r}</Selo></td>
            <td><ul className="list-disc pl-4 text-slate-600">{m.lic.map((l) => <li key={l}>{l}</li>)}</ul></td>
            <td className="space-x-1">{m.o.map((o) => <Selo key={o} cor={COR.info}>{o}</Selo>)}</td>
          </tr>))}</tbody>
      </table>
      <div className="mt-2 text-center text-[11px] text-slate-400">Classificação de risco conforme Resolução CGSIM/REDESIM. Confirme sempre a atividade no município.</div>
    </div>
  );
}

function Orgaos() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className="card p-3">
        <div className="mb-2 text-center font-semibold text-slate-700">Fluxo de licenciamento em Imbituba</div>
        {FLUXO.map((f) => (
          <div key={f.n} className="mb-2 flex gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: COR.novo }}>{f.n}</span>
            <div><div className="font-medium text-slate-700">{f.t}</div><div className="text-[12px] text-slate-500">{f.d}</div></div>
          </div>
        ))}
      </div>
      <div className="card p-3">
        <div className="mb-2 text-center font-semibold text-slate-700">Órgãos, contatos e protocolos</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {ORGAOS.map((o) => (
            <div key={o.n} className="rounded border border-slate-200 p-2">
              <div className="font-medium text-slate-700">{o.n}</div><div className="text-[12px] text-slate-500">{o.d}</div>
              {o.c.map((c) => <div key={c} className="text-[12px] text-slate-600">{c}</div>)}
              <a href={o.u} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-marca-600 hover:underline">Abrir portal <ExternalLink size={11} /></a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Checklists() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'alvaras_operar');
  const toast = useToast();
  const [mapa, setMapa] = useState<Mapa>({});
  const [tipo, setTipo] = useState('');
  const [novo, setNovo] = useState('');
  useEffect(() => {
    alvApi.config().then((c) => {
      const m = c.checklists as Mapa;
      const usar = m && Object.keys(m).length ? m : moldes();
      setMapa(usar); setTipo(Object.keys(usar)[0] ?? '');
    }).catch(() => undefined);
  }, []);
  async function gravar(m: Mapa, acao?: string, detalhe?: string) {
    setMapa(m);
    if (!podeOperar) return;
    try { await alvApi.salvarConfig({ checklists: m, acao, detalhe }); } catch (e) { toast('erro', erroMsg(e)); }
  }
  const itens = mapa[tipo] ?? [];
  const setItens = (l: Item[]) => gravar({ ...mapa, [tipo]: l });
  const feitos = itens.filter((i) => i.feito).length;
  return (
    <div className="card mx-auto max-w-3xl p-3">
      <div className="text-center font-semibold text-slate-700">Checklists de legalização</div>
      <div className="mb-2 text-center text-[12px] text-slate-500">Roteiros de referência por tipo de processo — editáveis.</div>
      <div className="mb-2 flex flex-wrap justify-center gap-2">
        <select className={`${INP} w-72`} value={tipo} onChange={(e) => setTipo(e.target.value)}>{Object.keys(mapa).map((k) => <option key={k}>{k}</option>)}</select>
        {podeOperar && <>
          <Botao tipo="novo" onClick={() => { const n = prompt('Nome do novo tipo de processo:')?.trim(); if (!n) return; if (mapa[n]) return toast('erro', 'Já existe um tipo com esse nome.'); gravar({ ...mapa, [n]: [] }, 'Checklist de alvarás criado', n); setTipo(n); }}>+ Novo tipo</Botao>
          <Botao tipo="info" onClick={() => { const n = prompt('Novo nome:', tipo)?.trim(); if (!n || n === tipo) return; if (mapa[n]) return toast('erro', 'Já existe um tipo com esse nome.'); gravar(Object.fromEntries(Object.entries(mapa).map(([k, v]) => [k === tipo ? n : k, v])), 'Checklist de alvarás renomeado', `${tipo} → ${n}`); setTipo(n); }}>✎ Renomear</Botao>
          <Botao tipo="excluir" onClick={() => { if (!confirm(`Excluir o tipo “${tipo}”?`)) return; const m = { ...mapa }; delete m[tipo]; gravar(m, 'Checklist de alvarás excluído', tipo); setTipo(Object.keys(m)[0] ?? ''); }}>Excluir tipo</Botao>
        </>}
      </div>
      {tipo && <>
        <div className="mb-2 text-center text-[12px] text-slate-500">{feitos} de {itens.length} concluídos
          <div className="mx-auto mt-1 h-1.5 max-w-xs rounded bg-slate-200"><div className="h-1.5 rounded" style={{ width: `${itens.length ? (feitos / itens.length) * 100 : 0}%`, background: COR.ok }} /></div></div>
        {itens.map((it, i) => (
          <div key={it.id} className="flex items-center gap-2 border-b border-slate-100 py-1.5">
            <input type="checkbox" className="accent-marca-600" checked={it.feito} disabled={!podeOperar} onChange={(e) => setItens(itens.map((x) => (x.id === it.id ? { ...x, feito: e.target.checked } : x)))} />
            <span className={`flex-1 ${it.feito ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{it.texto}</span>
            {podeOperar && <>
              <button disabled={i === 0} onClick={() => { const l = [...itens]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; setItens(l); }} className="text-slate-400 disabled:opacity-30"><ArrowUp size={13} /></button>
              <button disabled={i === itens.length - 1} onClick={() => { const l = [...itens]; [l[i + 1], l[i]] = [l[i], l[i + 1]]; setItens(l); }} className="text-slate-400 disabled:opacity-30"><ArrowDown size={13} /></button>
              <button onClick={() => { const t = prompt('Texto do item:', it.texto)?.trim(); if (t) setItens(itens.map((x) => (x.id === it.id ? { ...x, texto: t } : x))); }} className="text-slate-400"><Pencil size={13} /></button>
              <button onClick={() => confirm('Excluir este item?') && setItens(itens.filter((x) => x.id !== it.id))} className="text-red-400"><X size={13} /></button>
            </>}
          </div>
        ))}
        {podeOperar && (
          <div className="mt-2 flex gap-2">
            <input className={INP} placeholder="Adicionar item ao checklist" value={novo} onChange={(e) => setNovo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && novo.trim()) { setItens([...itens, { id: novoId(), texto: novo.trim(), feito: false }]); setNovo(''); } }} />
            <Botao tipo="novo" onClick={() => { if (novo.trim()) { setItens([...itens, { id: novoId(), texto: novo.trim(), feito: false }]); setNovo(''); } }}>Adicionar</Botao>
            <Botao tipo="cancelar" onClick={() => setItens(itens.map((x) => ({ ...x, feito: false })))}>Desmarcar todos</Botao>
          </div>
        )}
      </>}
    </div>
  );
}
