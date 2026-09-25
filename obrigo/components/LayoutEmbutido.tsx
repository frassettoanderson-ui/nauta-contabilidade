import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import FAB from './FAB';
import ProcessarDriveFAB from './ProcessarDriveFAB';

// Substitui o Layout.tsx do app separado: sidebar, topbar e zoom agora sao os da Nauta
// (app/sistema/(painel)/layout.tsx). Aqui ficam so o que e' do conteudo: animacao por rota,
// banner de impersonacao, atalhos de teclado e os botoes flutuantes.
export default function LayoutEmbutido() {
  const { sessao, impersonadoPor, voltarAoAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Atalhos de teclado globais (estilo Acessorias) - iguais ao Layout original
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return; // nao interferir em campos
      let destino: string | null = null;
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === 'F1') destino = '/configuracoes';
        else if (e.key === 'F2') destino = '/entregas';
        else if (e.key === 'F3') destino = '/empresas';
        else if (e.key === 'F6') destino = '/obrigacoes';
      } else if (e.ctrlKey && !e.altKey && (e.key === 'u' || e.key === 'U')) destino = '/usuarios';
      else if (e.ctrlKey && !e.altKey && (e.key === 'k' || e.key === 'K')) destino = '/robo/envio';
      else if (e.altKey && !e.ctrlKey && (e.key === 'c' || e.key === 'C')) destino = '/area-vip/comunicados';
      if (destino) { e.preventDefault(); navigate(destino); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="flex h-full flex-col">
      {impersonadoPor && (
        <div className="-mx-6 -mt-6 mb-4 flex items-center justify-center gap-3 bg-amber-500 px-4 py-1 text-[12px] font-medium text-white">
          <span>Voce esta logado como <b>{sessao?.usuario.nome}</b> — sessao de admin: {impersonadoPor.usuario.nome}</span>
          <button onClick={voltarAoAdmin} className="rounded bg-white/25 px-2 py-0.5 font-semibold hover:bg-white/40">↩ Voltar ao admin</button>
        </div>
      )}
      {/* key na rota: re-dispara a animacao de surgimento a cada troca de tela */}
      <div key={location.pathname} className="page-anim h-full flex-1">
        <Outlet />
      </div>
      <FAB />
      <ProcessarDriveFAB />
    </div>
  );
}
