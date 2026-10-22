// Societario › Gestao e Dashboard — o que precisa de acao hoje, de quem depende cada processo e onde o funil trava.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Link2 } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import {
  COR, ETAPAS, SITUACOES, semaforo, diasAte, prazoRelativo, dataBR, moeda, nomeCliente, frenteSalva, daFrente, type Processo,
} from './comum';
import { NovoProcessoModal, ChecklistModal, FichaProcessoModal, Botao, INP } from './modais';
import { SeletorFrente, Anel, useProcessos } from './Kanban';

const LIMITE_PRIO = 7;
type Bola = 'escritorio' | 'cliente' | 'orgao';
const bolaCom = (p: Processo): Bola => (!p.dependeDe || p.dependeDe === 'Escritório' ? 'escritorio' : p.dependeDe === 'Cliente' ? 'cliente' : 'orgao');
const corSituacao = (s: string) => (s === 'Finalizado' ? COR.ok : s === 'Em exigência' ? COR.erro : s === 'Aguardando cliente' ? COR.aviso : COR.info);
export const Selo = ({ cor, children }: { cor: string; children: React.ReactNode }) => (
  <span className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: cor + '22', color: cor, border: `1px solid ${cor}55` }}>{children}</span>
);

export default function GestaoSocietario() {
  const { sessao } = useAuth();
  const podeOperar = temPermissao(sessao, 'societario_operar');
  const navigate = useNavigate();
  const { lista, recarregar, trocar } = useProcessos();
  const [frente, setFrente] = useState(frenteSalva());
  const [novo, setNovo] = useState(false);
  const [checklist, setChecklist] = useState<Processo | null>(null);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [bola, setBola] = useState<Bola | null>(null);
  const [filt, setFilt] = useState({ q: '', etapa: '', situacao: '', prazo: '' });
  const [tudo, setTudo] = useState(false);

  const ps = useMemo(() => lista.filter((p) => daFrente(p, frente)), [lista, frente]);
  const abertos = ps.filter((p) => p.situacao !== 'Finalizado');
  const finalizados = ps.length - abertos.length;
  const atrasados = abertos.filter((p) => semaforo(p.prazo).rotulo === 'Atrasado');
  const maiorAtraso = Math.max(0, ...atrasados.map((p) => -(diasAte(p.prazo) ?? 0)));
  const vencem7 = abertos.filter((p) => { const d = diasAte(p.prazo); return d !== null && d >= 0 && d <= 7; }).length;
  const semPrazo = abertos.filter((p) => !p.prazo).length;
  const pct = abertos.length ? Math.round(((abertos.length - atrasados.length) / abertos.length) * 100) : 100;
  const honorarios = ps.reduce((s, p) => s + (Number(p.honorario) || 0), 0);
  const aReceber = ps.filter((p) => p.honorarioSit === 'Pendente' || p.honorarioSit === 'Parcial').reduce((s, p) => s + (Number(p.honorario) || 0), 0);

  const irLista = (campo: string, valor: string) => navigate(`/societario/processos?${campo}=${encodeURIComponent(valor)}`);

  const funil = ETAPAS.map((e) => {
    const da = abertos.filter((p) => p.etapa === e);
    return { e, qtd: da.length, atr: da.filter((p) => semaforo(p.prazo).rotulo === 'Atrasado').length };
  });
  const gargalo = funil.reduce((m, x) => (x.qtd > m.qtd ? x : m), funil[0]);

  const temFiltro = !!(filt.q || filt.etapa || filt.situacao || filt.prazo || bola);
  const fila = abertos
    .filter((p) => !bola || bolaCom(p) === bola)
    .filter((p) => !filt.etapa || p.etapa === filt.etapa)
    .filter((p) => !filt.situacao || p.situacao === filt.situacao)
    .filter((p) => !filt.prazo || semaforo(p.prazo).rotulo === filt.prazo)
    .filter((p) => {
      if (!filt.q) return true;
      const q = filt.q.toLowerCase();
      return [p.codigo, nomeCliente(p), p.servico, p.etapa, p.proximaAcao ?? ''].some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => semaforo(a.prazo).peso - semaforo(b.prazo).peso || (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999'));
  const mostrar = temFiltro || tudo ? fila : fila.slice(0, LIMITE_PRIO);

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr_auto]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Societário · {new Date().toLocaleDateString('pt-BR')}</div>
            <div className="text-lg font-semibold">Central de processos</div>
            <div className="text-[12px] text-slate-300">{abertos.length - atrasados.length} de {abertos.length} processo(s) abertos sem atraso</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 'Atrasados', n: atrasados.length, d: atrasados.length ? `o mais antigo há ${maiorAtraso} dia(s)` : 'nenhum prazo vencido', c: COR.erro, v: 'Atrasado' },
            { t: 'Vencem em 7 dias', n: vencem7, d: vencem7 ? 'programe a semana' : 'nada vencendo nesta semana', c: COR.aviso, v: 'Atenção' },
            { t: 'Sem prazo', n: semPrazo, d: semPrazo ? 'não entra na fila' : 'todos com prazo', c: COR.info, v: 'Sem prazo' },
          ].map((k) => (
            <button key={k.t} onClick={() => irLista('prazo', k.v)} className="rounded bg-white/10 p-2 text-center hover:bg-white/20">
              <div className="text-[11px] text-slate-300">{k.t}</div>
              <div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div>
              <div className="text-[11px] text-slate-300">{k.d}</div>
            </button>
          ))}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SeletorFrente valor={frente} onMudar={setFrente} />
          <div className="flex gap-2">
            <Botao tipo="info" onClick={() => navigate('/societario/formularios')}><Link2 size={14} /> Formulário do cliente</Botao>
            {podeOperar && <Botao tipo="novo" onClick={() => setNovo(true)}><Plus size={14} /> Novo processo</Botao>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card p-3">
          <div className="mb-2 text-center font-semibold text-slate-700">De quem é a bola</div>
          <div className="grid grid-cols-3 gap-2">
            {([['escritorio', 'Escritório', 'é a nossa vez de produzir'], ['cliente', 'Cliente', 'aguardando documento ou resposta'], ['orgao', 'Órgão', 'protocolado, aguardando o órgão']] as const).map(([k, t, d]) => {
              const da = abertos.filter((p) => bolaCom(p) === k);
              const atr = da.filter((p) => semaforo(p.prazo).rotulo === 'Atrasado').length;
              return (
                <button key={k} onClick={() => setBola((b) => (b === k ? null : k))}
                  className={`flex flex-col items-center rounded border p-2 ${bola === k ? 'border-marca-400 bg-marca-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <Anel pct={abertos.length ? Math.round((da.length / abertos.length) * 100) : 0} tamanho={52} />
                  <div className="font-medium text-slate-700">{t} · {da.length}</div>
                  <div className="text-center text-[11px] text-slate-500">{d}</div>
                  {atr > 0 && <div className="text-[11px]" style={{ color: COR.erro }}>{atr} atrasado(s)</div>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="card p-3">
          <div className="mb-2 flex items-center justify-center gap-2 font-semibold text-slate-700">
            Onde o funil trava {gargalo.qtd > 0 && <Selo cor={COR.novo}>Maior fila: {gargalo.e} ({gargalo.qtd})</Selo>}
          </div>
          {funil.map((x) => (
            <button key={x.e} onClick={() => irLista('etapa', x.e)} className={`mb-1 grid w-full grid-cols-[150px_1fr_60px] items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-slate-50 ${x === gargalo && x.qtd ? 'bg-orange-50' : ''}`}>
              <span className="truncate text-[12px] text-slate-600">{x.e}</span>
              <div className="h-3 rounded bg-slate-100">
                <div className="relative h-3 rounded" style={{ width: `${abertos.length ? (x.qtd / abertos.length) * 100 : 0}%`, background: COR.info }}>
                  {x.qtd > 0 && <div className="absolute right-0 top-0 h-3 rounded-r" style={{ width: `${(x.atr / x.qtd) * 100}%`, background: COR.erro }} />}
                </div>
              </div>
              <span className="text-right text-[12px] text-slate-500">{x.qtd} · {x.atr}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-2 text-center font-semibold text-slate-700">Fila de trabalho</div>
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          <input className={`${INP} w-56`} placeholder="Pesquisar" value={filt.q} onChange={(e) => setFilt({ ...filt, q: e.target.value })} />
          <select className={`${INP} w-44`} value={filt.etapa} onChange={(e) => setFilt({ ...filt, etapa: e.target.value })}><option value="">Todas as etapas</option>{ETAPAS.map((e) => <option key={e}>{e}</option>)}</select>
          <select className={`${INP} w-44`} value={filt.situacao} onChange={(e) => setFilt({ ...filt, situacao: e.target.value })}><option value="">Todas as situações</option>{SITUACOES.filter((s) => s !== 'Finalizado').map((s) => <option key={s}>{s}</option>)}</select>
          <select className={`${INP} w-36`} value={filt.prazo} onChange={(e) => setFilt({ ...filt, prazo: e.target.value })}><option value="">Todos os prazos</option>{['Atrasado', 'Atenção', 'No prazo', 'Sem prazo'].map((s) => <option key={s}>{s}</option>)}</select>
          {temFiltro && <Botao tipo="cancelar" onClick={() => { setFilt({ q: '', etapa: '', situacao: '', prazo: '' }); setBola(null); }}>Limpar filtros</Botao>}
        </div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-1">Processo</th><th>Próxima ação</th><th>Depende de</th><th>Prazo</th><th /></tr></thead>
          <tbody>
            {mostrar.map((p) => {
              const s = semaforo(p.prazo);
              return (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-1.5"><div className="font-medium text-slate-700">{nomeCliente(p)}</div><div className="text-[11px] text-slate-400">{p.codigo} · {p.servico} · {p.etapa}</div></td>
                  <td><div className="text-slate-600">{p.proximaAcao || <span className="text-slate-400">sem próxima ação definida</span>}</div><Selo cor={corSituacao(p.situacao)}>{p.situacao}</Selo></td>
                  <td><Selo cor={p.dependeDe === 'Cliente' ? COR.aviso : !p.dependeDe || p.dependeDe === 'Escritório' ? COR.info : COR.neutro}>{p.dependeDe || 'Escritório'}</Selo></td>
                  <td><Selo cor={s.cor}>{prazoRelativo(p.prazo)}</Selo><div className="text-[11px] text-slate-400">{dataBR(p.prazo)}</div></td>
                  <td className="text-right"><Botao tipo="info" onClick={() => setChecklist(p)}>Abrir</Botao></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {mostrar.length === 0 && <div className="py-6 text-center text-slate-400">{temFiltro ? 'Nenhum processo com esses filtros.' : 'Nada na fila — carteira em dia.'}</div>}
        <div className="mt-2 flex items-center justify-center gap-2 text-[12px] text-slate-500">
          {temFiltro ? `${fila.length} processo(s) com os filtros aplicados.` : tudo ? `Mostrando todos os ${fila.length}.` : fila.length > LIMITE_PRIO ? `Mostrando os ${LIMITE_PRIO} mais urgentes de ${fila.length}.` : `${fila.length} processo(s) em acompanhamento.`}
          {!temFiltro && fila.length > LIMITE_PRIO && <button className="text-marca-600 hover:underline" onClick={() => setTudo((t) => !t)}>{tudo ? 'Ver menos' : `Ver mais (${fila.length - LIMITE_PRIO})`}</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { t: 'Processos abertos', v: String(abertos.length), c: '#334155' },
          { t: 'Concluídos', v: String(finalizados), c: COR.ok },
          { t: 'Honorários da carteira', v: moeda(honorarios), c: '#334155' },
          { t: 'A receber', v: moeda(aReceber), c: aReceber > 0 ? COR.erro : '#334155' },
        ].map((k) => (
          <div key={k.t} className="card p-3 text-center"><div className="text-[12px] text-slate-500">{k.t}</div><div className="text-lg font-semibold" style={{ color: k.c }}>{k.v}</div></div>
        ))}
      </div>

      <NovoProcessoModal aberto={novo} onFechar={() => setNovo(false)} onCriado={() => recarregar()} frentePadrao={frente} />
      <ChecklistModal processo={checklist} onFechar={() => { setChecklist(null); recarregar(); }} onMudou={trocar} podeOperar={podeOperar} onAbrirFicha={setFichaId} />
      <FichaProcessoModal processoId={fichaId} onFechar={() => setFichaId(null)} onSalvo={recarregar} podeOperar={podeOperar} />
    </div>
  );
}
