// Societario › Processos — controle completo do fluxo (lista com filtros e ordenacao).
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { useToast } from '../../components/ui';
import {
  COR, ETAPAS, SITUACOES, ROTULO_FRENTE, semaforo, dataBR, moeda, nomeCliente, rotuloNatureza, frenteSalva, daFrente, frenteDoProcesso, socApi, type Processo,
} from './comum';
import { NovoProcessoModal, FichaProcessoModal, Botao, INP, erroMsg } from './modais';
import { SeletorFrente, useProcessos } from './Kanban';
import { Selo } from './Gestao';

type Chave = 'codigo' | 'cliente' | 'etapa' | 'prazo' | 'dependeDe' | 'honorario';
const corSituacao = (s: string) => (s === 'Finalizado' ? COR.ok : s === 'Em exigência' ? COR.erro : s === 'Aguardando cliente' ? COR.aviso : COR.info);

export default function ProcessosSocietario() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'societario_operar');
  const toast = useToast();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { lista, recarregar } = useProcessos();
  const [frente, setFrente] = useState(frenteSalva());
  const [q, setQ] = useState('');
  const etapa = sp.get('etapa') ?? ''; const situacao = sp.get('situacao') ?? ''; const prazo = sp.get('prazo') ?? '';
  const setF = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const [ord, setOrd] = useState<{ k: Chave; dir: 1 | -1 }>({ k: 'prazo', dir: 1 });
  const [novo, setNovo] = useState(false);
  const [fichaId, setFichaId] = useState<string | null>(null);

  const base = useMemo(() => lista.filter((p) => daFrente(p, frente)), [lista, frente]);
  const linhas = useMemo(() => {
    const val = (p: Processo): string | number => {
      switch (ord.k) {
        case 'codigo': return p.codigo; case 'cliente': return nomeCliente(p).toLowerCase(); case 'etapa': return p.situacao === 'Finalizado' ? 'zz' : p.etapa;
        case 'prazo': return p.prazo ?? ''; case 'dependeDe': return p.dependeDe ?? ''; case 'honorario': return Number(p.honorario) || 0;
      }
    };
    return base
      .filter((p) => !etapa || p.etapa === etapa)
      .filter((p) => !situacao || p.situacao === situacao)
      .filter((p) => !prazo || semaforo(p.prazo).rotulo === prazo)
      .filter((p) => !q || [p.codigo, nomeCliente(p), p.responsavel ?? '', p.observacao ?? ''].some((t) => t.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => {
        const va = val(a); const vb = val(b);
        if (va === '' && vb !== '') return 1; if (vb === '' && va !== '') return -1; // vazios sempre no fim
        return (va < vb ? -1 : va > vb ? 1 : 0) * ord.dir;
      });
  }, [base, etapa, situacao, prazo, q, ord]);

  const th = (k: Chave | null, t: string, cls = '') => (
    <th className={`py-1.5 ${cls} ${k ? 'cursor-pointer select-none hover:text-marca-600' : ''}`}
      onClick={() => k && setOrd((o) => (o.k === k ? { k, dir: o.dir === 1 ? -1 : 1 } : { k, dir: 1 }))}>
      {t}{k && ord.k === k ? (ord.dir === 1 ? ' ↓' : ' ↑') : ''}
    </th>
  );
  const recorte = etapa ? `Etapa: ${etapa}` : situacao ? `Situação: ${situacao}` : prazo ? `Prazo: ${prazo}` : '';

  async function excluir(p: Processo) {
    if (!confirm(`Excluir o processo ${p.codigo}? Não tem desfazer.`)) return;
    try { await socApi.excluir(p.id); toast('ok', 'Processo excluído.'); recarregar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  function exportar() {
    const lin = [['Processo', 'Cliente', 'Carteira', 'Tipo', 'Natureza', 'Etapa', 'Situação', 'Prazo', 'Depende de', 'Honorário', 'Situação do honorário']];
    for (const p of linhas) lin.push([p.codigo, nomeCliente(p), ROTULO_FRENTE[frenteDoProcesso(p)] ?? '', p.servico, rotuloNatureza(p.natureza), p.etapa, p.situacao, dataBR(p.prazo), p.dependeDe, String(Number(p.honorario) || 0).replace('.', ','), p.honorarioSit]);
    const csv = '﻿' + lin.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `Processos_societarios_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-base font-semibold text-slate-700">Processos societários</div><div className="text-[12px] text-slate-500">Controle do fluxo societário: abertura, alteração e baixa.</div></div>
        <div className="flex items-center gap-2">
          <SeletorFrente valor={frente} onMudar={setFrente} />
          <Botao tipo="info" onClick={exportar}><Download size={14} /> Planilha</Botao>
          {podeOperar && <Botao tipo="novo" onClick={() => setNovo(true)}><Plus size={14} /> Novo processo</Botao>}
        </div>
      </div>
      {recorte && (
        <div className="flex items-center justify-center gap-2 rounded border border-orange-200 bg-orange-50 p-2 text-[12px] text-slate-600">
          Exibindo: <b>{recorte}</b> <Botao tipo="cancelar" onClick={() => setSp(new URLSearchParams(), { replace: true })}>Mostrar todos</Botao>
        </div>
      )}
      <div className="card p-3">
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <input className={`${INP} w-64`} placeholder="Pesquisar código, cliente, responsável, observação" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${INP} w-44`} value={etapa} onChange={(e) => setF('etapa', e.target.value)}><option value="">Todas as etapas</option>{ETAPAS.map((e) => <option key={e}>{e}</option>)}</select>
          <select className={`${INP} w-44`} value={situacao} onChange={(e) => setF('situacao', e.target.value)}><option value="">Todas as situações</option>{SITUACOES.map((e) => <option key={e}>{e}</option>)}</select>
          <select className={`${INP} w-36`} value={prazo} onChange={(e) => setF('prazo', e.target.value)}><option value="">Todos os prazos</option>{['Atrasado', 'Atenção', 'No prazo', 'Sem prazo'].map((e) => <option key={e}>{e}</option>)}</select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500">
              {th('codigo', 'Processo')}{th('cliente', 'Cliente')}{th('etapa', 'Etapa atual')}{th(null, 'Progresso')}{th('prazo', 'Prazo')}{th('dependeDe', 'Depende de')}{th('honorario', 'Honorário', 'text-right')}<th />
            </tr></thead>
            <tbody>
              {linhas.map((p) => {
                const s = semaforo(p.prazo);
                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-1.5"><div className="font-medium text-slate-700">{p.codigo}</div><div className="text-[11px] text-slate-400">{p.servico} · {rotuloNatureza(p.natureza)}</div></td>
                    <td><div className="text-slate-700">{nomeCliente(p)}</div><div className="text-[11px] text-slate-400">{ROTULO_FRENTE[frenteDoProcesso(p)] ?? ''}</div></td>
                    <td><div className="text-slate-600">{p.situacao === 'Finalizado' ? 'Concluído' : p.etapa}</div><Selo cor={corSituacao(p.situacao)}>{p.situacao}</Selo></td>
                    <td className="w-32"><div className="h-1.5 rounded bg-slate-200"><div className="h-1.5 rounded" style={{ width: `${p.progresso}%`, background: COR.ok }} /></div><div className="text-[11px] text-slate-400">{p.progresso}%</div></td>
                    <td>{p.prazo ? <Selo cor={s.cor}>{dataBR(p.prazo)} · {s.rotulo}</Selo> : <span className="text-slate-400">Sem prazo</span>}</td>
                    <td className="text-slate-600">{p.dependeDe}</td>
                    <td className="text-right"><div className="text-slate-700">{moeda(p.honorario)}</div><div className="text-[11px] text-slate-400">{p.honorarioSit}</div></td>
                    <td className="space-x-1 whitespace-nowrap text-right">
                      <Botao tipo="info" onClick={() => setFichaId(p.id)}>{podeOperar ? 'Editar' : 'Ver'}</Botao>
                      {podeOperar && <Botao tipo="excluir" onClick={() => excluir(p)}>Excluir</Botao>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {linhas.length === 0 && <div className="py-6 text-center text-slate-400">{base.length ? 'Nenhum registro atende aos filtros.' : 'Nenhum processo cadastrado. Clique em “Novo processo” e informe o nome da empresa.'}</div>}
        <div className="mt-2 text-center text-[12px] text-slate-500">{linhas.length} de {base.length} registros. <button className="text-marca-600 hover:underline" onClick={() => navigate('/societario')}>Ir para o Kanban</button></div>
      </div>
      <NovoProcessoModal aberto={novo} onFechar={() => setNovo(false)} onCriado={() => recarregar()} frentePadrao={frente} />
      <FichaProcessoModal processoId={fichaId} onFechar={() => setFichaId(null)} onSalvo={recarregar} podeOperar={podeOperar} comExcluir={false} />
    </div>
  );
}
