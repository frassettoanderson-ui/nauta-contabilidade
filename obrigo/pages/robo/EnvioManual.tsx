import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Settings, HelpCircle, Upload, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui';

interface Resultado { total: number; baixados: number; revisao: number }

const TOUR = [
  {
    titulo: 'Envio manual',
    texto: `Esta tela e o caminho ALTERNATIVO para alimentar o robo do e-Continuo quando a pasta do Google Drive nao estiver disponivel (sem conexao, manutencao, etc.).

Os arquivos enviados aqui passam pelo MESMO processamento do Drive: o robo identifica empresa, obrigacao e competencia e, quando reconhece, ja da baixa automatica. O que ele nao conseguir identificar vai para a tela de Revisao.

Use o botao Escolher Arquivos para selecionar um ou mais PDFs e clique em "Enviar para o robo".`,
  },
];

export default function EnvioManual() {
  const { sessao } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [office, setOffice] = useState('');
  const [tour, setTour] = useState(0);

  useEffect(() => {
    api.get<{ nome: string }>('/escritorio').then((e) => setOffice(e.nome)).catch(() => undefined);
  }, []);

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    setArquivos(Array.from(e.target.files ?? []).slice(0, 50));
    setResultado(null);
  }

  async function enviar() {
    if (arquivos.length === 0) return;
    setEnviando(true);
    setResultado(null);
    try {
      const fd = new FormData();
      arquivos.forEach((f) => fd.append('arquivos', f));
      const r = await api.upload<Resultado>('/robo/caixa', fd);
      setResultado(r);
      setArquivos([]);
      toast('ok', `${r.total} enviado(s): ${r.baixados} baixado(s), ${r.revisao} para revisao.`);
    } catch (e) { toast('erro', e instanceof ApiError ? e.message : 'Erro ao enviar.'); }
    finally { setEnviando(false); }
  }

  return (
    <div className="-m-6 min-h-full bg-fundo p-5 text-[13px]">
      {/* Cabecalho */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          <UploadCloud size={16} className="text-slate-400" />
          <span>Sistema</span><span className="text-slate-300">›</span>
          <span>e-Continuo</span><span className="text-slate-300">›</span>
          <span className="text-slate-700">Envio manual de documentos ao robo</span>
        </div>
        <input className="w-48 rounded border border-slate-300 bg-white px-2 py-1 text-[12px]" placeholder="Central de ajuda" disabled />
      </div>

      {/* Aviso: fallback do Drive */}
      <div className="mb-4 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>
          Caminho alternativo para quando o <b>Google Drive</b> estiver indisponivel. Os documentos enviados aqui passam pelo
          mesmo processamento (identificacao, baixa automatica e, se necessario, Revisao). No dia a dia, prefira a pasta do Drive.
        </span>
      </div>

      <div className="relative">
        <button onClick={() => setTour(1)} title="Ajuda" className="absolute -top-1 right-0 text-marca-500 hover:text-marca-700"><HelpCircle size={18} /></button>

        <div className="mt-4 flex items-stretch gap-4">
          {/* Area de upload */}
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded border border-slate-300 bg-white px-2 py-2">
            <Upload size={16} className="text-slate-400" />
            <span className="flex-1 truncate text-slate-500">
              {arquivos.length ? `${arquivos.length} arquivo(s) selecionado(s)` : 'Selecione ate 50 PDFs'}
            </span>
            <span className="rounded bg-marca-500 px-3 py-1 text-[12px] font-medium text-white">Escolher Arquivos</span>
            <input type="file" multiple accept="application/pdf" className="hidden" onChange={escolher} />
          </label>

          {/* Enviar */}
          <button onClick={enviar} disabled={arquivos.length === 0 || enviando}
            className="flex w-1/3 items-center justify-center gap-2 rounded bg-marca-400 px-6 text-sm font-medium text-white hover:bg-marca-500 disabled:opacity-60">
            <Settings size={16} /> {enviando ? 'Enviando...' : 'Enviar para o robo'}
          </button>
        </div>

        {/* Lista de arquivos selecionados */}
        {arquivos.length > 0 && !resultado && (
          <div className="mt-2 flex flex-wrap gap-1">
            {arquivos.map((f, i) => <span key={i} className="rounded bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">{f.name}</span>)}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className="mt-5 overflow-hidden rounded border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-50 px-4 py-2 text-[13px] font-semibold text-emerald-700">
              <CheckCircle2 size={15} /> Processamento concluido
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
              <div className="px-4 py-4"><div className="text-2xl font-semibold text-slate-700">{resultado.total}</div><div className="text-[12px] text-slate-500">enviados</div></div>
              <div className="px-4 py-4"><div className="text-2xl font-semibold text-emerald-600">{resultado.baixados}</div><div className="text-[12px] text-slate-500">baixados automaticamente</div></div>
              <div className="px-4 py-4"><div className="text-2xl font-semibold text-amber-600">{resultado.revisao}</div><div className="text-[12px] text-slate-500">para revisao</div></div>
            </div>
            {resultado.revisao > 0 && (
              <div className="border-t border-slate-200 px-4 py-2 text-right">
                <button onClick={() => navigate('/robo/revisao')} className="inline-flex items-center gap-1 text-[12px] font-medium text-marca-600 hover:text-marca-800">
                  Ir para a Revisao <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rodape */}
      <div className="mt-6 flex items-center justify-between border-t border-marca-200 pt-2 text-[12px] text-marca-600">
        <span>Usuario: {sessao?.usuario?.nome ?? '—'}</span>
        <span>Office: {office || '—'}</span>
      </div>

      {/* Tour de ajuda */}
      {tour > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setTour(0)}>
          <div className="absolute left-6 top-32 w-80 rounded-lg bg-slate-800 p-4 text-[12px] leading-relaxed text-slate-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="mb-2 text-[14px] font-semibold text-white">{TOUR[0].titulo}</h4>
            <p className="whitespace-pre-line">{TOUR[0].texto}</p>
            <div className="mt-3 flex justify-end">
              <button onClick={() => setTour(0)} className="rounded border border-slate-500 px-2 py-0.5 text-white hover:bg-slate-700">OK, entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
