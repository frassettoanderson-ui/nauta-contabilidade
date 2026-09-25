import { useEffect, useState } from 'react';
import { CloudDownload, Loader2, RefreshCw } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useToast } from './ui';

// Botao flutuante GLOBAL (aparece em todas as telas) para processar a pasta Entrada do
// Google Drive. So aparece se o Drive estiver conectado. Ao clicar, abre um menu com:
//  - "Processar agora": varre arquivos NOVOS (nao reavalia os ja vistos).
//  - "Reprocessar tudo": FORCA reavaliar ate os arquivos parados (apos ajustar assinaturas).
// Emite o evento 'drive:processado' para telas que queiram se atualizar (ex.: Revisao).
export default function ProcessarDriveFAB() {
  const toast = useToast();
  const [conectado, setConectado] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    api.get<{ conectado: boolean }>('/drive/status').then((s) => setConectado(!!s.conectado)).catch(() => undefined);
  }, []);

  async function rodar(url: string, label: string) {
    setAberto(false);
    setProcessando(true);
    try {
      const r = await api.post<{ vistos: number; baixados: number; revisao: number }>(url, {});
      toast('ok', `${label}: ${r.vistos} arquivo(s), ${r.baixados} baixado(s), ${r.revisao} para revisao.`);
      window.dispatchEvent(new CustomEvent('drive:processado'));
    } catch (e) { toast('erro', e instanceof ApiError ? e.message : 'Erro ao processar o Drive.'); }
    finally { setProcessando(false); }
  }

  if (!conectado) return null;

  return (
    <div className="fixed bottom-6 right-24 z-40">
      {aberto && !processando && (
        <>
          <div className="fixed inset-0" onClick={() => setAberto(false)} />
          <div className="absolute bottom-16 right-0 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <button onClick={() => rodar('/drive/processar-agora', 'Drive')} className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
              <CloudDownload size={18} className="mt-0.5 shrink-0 text-marca-500" />
              <span><span className="block text-[13px] font-medium text-slate-700">Processar agora</span><span className="block text-[11px] text-slate-400">Varre os arquivos novos da Entrada</span></span>
            </button>
            <button onClick={() => rodar('/drive/reprocessar', 'Reprocessado')} className="flex w-full items-start gap-3 border-t border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50">
              <RefreshCw size={18} className="mt-0.5 shrink-0 text-status-warn" />
              <span><span className="block text-[13px] font-medium text-slate-700">Reprocessar tudo (forçar)</span><span className="block text-[11px] text-slate-400">Reavalia até os arquivos parados na Entrada</span></span>
            </button>
          </div>
        </>
      )}
      <button
        onClick={() => setAberto((v) => !v)}
        disabled={processando}
        title="Processar / reprocessar a pasta Entrada do Google Drive (e-Continuo)"
        className="grid h-14 w-14 place-items-center rounded-full bg-marca-500 text-white shadow-xl transition hover:bg-marca-600 disabled:opacity-60"
      >
        {processando ? <Loader2 size={24} className="animate-spin" /> : <CloudDownload size={24} />}
      </button>
    </div>
  );
}
