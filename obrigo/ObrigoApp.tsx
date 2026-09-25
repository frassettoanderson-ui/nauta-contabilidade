'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/ui';
import LayoutEmbutido from './components/LayoutEmbutido';
import Dashboard from './pages/Dashboard';
import Indicadores from './pages/dashboard/Indicadores';
import Paineis from './pages/dashboard/Paineis';
import Configuracoes from './pages/Configuracoes';
import Departamentos from './pages/Departamentos';
import DepartamentoForm from './pages/DepartamentoForm';
import Tags from './pages/Tags';
import Usuarios from './pages/Usuarios';
import UsuarioForm from './pages/UsuarioForm';
import Perfil from './pages/Perfil';
import EmConstrucao from './pages/EmConstrucao';
import Auditoria from './pages/Auditoria';
import EmpresasList from './pages/empresas/EmpresasList';
import MotivosCancelamento from './pages/empresas/MotivosCancelamento';
import GruposEmpresa from './pages/empresas/GruposEmpresa';
import MotivoForm from './pages/empresas/MotivoForm';
import EmpresaForm from './pages/empresas/EmpresaForm';
import EmpresaFicha from './pages/empresas/EmpresaFicha';
import ImportarCsv from './pages/empresas/ImportarCsv';
import Catalogo from './pages/obrigacoes/Catalogo';
import ObrigacaoForm from './pages/obrigacoes/ObrigacaoForm';
import Regimes from './pages/obrigacoes/Regimes';
import RelatorioRegime from './pages/obrigacoes/RelatorioRegime';
import RegimeForm from './pages/obrigacoes/RegimeForm';
import Grupos from './pages/obrigacoes/Grupos';
import GrupoForm from './pages/obrigacoes/GrupoForm';
import Feriados from './pages/obrigacoes/Feriados';
import FeriadoForm from './pages/obrigacoes/FeriadoForm';
import AlocacaoMassa from './pages/obrigacoes/AlocacaoMassa';
import ListaEntregas from './pages/entregas/ListaEntregas';
import Calendario from './pages/entregas/Calendario';
import Armazenamento from './pages/documentos/Armazenamento';
import ProtocolosFisicos from './pages/documentos/ProtocolosFisicos';
import ProtocoloFisicoForm from './pages/documentos/ProtocoloFisicoForm';
import Caixa from './pages/robo/Caixa';
import Revisao from './pages/robo/Revisao';
import PainelRobo from './pages/robo/PainelRobo';
import Assinaturas from './pages/robo/Assinaturas';
import AssinaturaForm from './pages/robo/AssinaturaForm';
import EnvioManual from './pages/robo/EnvioManual';
import DriveConfig from './pages/robo/DriveConfig';
import Processos from './pages/processos/Processos';
import ProcessoForm from './pages/processos/ProcessoForm';
import ProcessoFicha from './pages/processos/ProcessoFicha';
import Matrizes from './pages/processos/Matrizes';
import MatrizForm from './pages/processos/MatrizForm';
import ComunicadosAdmin from './pages/portal/ComunicadosAdmin';
import SolicitacoesInbox from './pages/portal/SolicitacoesInbox';
import AreaVip from './pages/portal/AreaVip';
import NpsPanel from './pages/portal/NpsPanel';
import AvaliacoesSolicitacoes from './pages/portal/AvaliacoesSolicitacoes';
import FormulariosSolicitacao from './pages/portal/FormulariosSolicitacao';
import UsuariosApp from './pages/portal/UsuariosApp';
import Templates from './pages/comunicacao/Templates';
import Chatbot from './pages/comunicacao/Chatbot';
import SolicitacoesInternas from './pages/solicitacoes/SolicitacoesInternas';
import GestaoSolicitacoes from './pages/solicitacoes/GestaoSolicitacoes';
import Insights from './pages/insights/Insights';
import Notificacoes from './pages/Notificacoes';
import Jobs from './pages/Jobs';

// Prefixo das rotas do modulo dentro da Nauta (app/sistema/(painel)/obrigo/[[...slug]]).
export const OBRIGO_BASE = '/sistema/obrigo';

// O menu da Nauta navega com o router do Next (pushState proprio); o react-router so ouve
// popstate. Este componente mantem os dois em sincronia: quando o caminho do Next muda e o
// react-router ainda esta em outra tela, empurra a navegacao para ele. A volta (react-router
// -> Next) ja acontece sozinha: o Next 14.1 observa o pushState do react-router.
function SincronizaComNext() {
  const pathname = usePathname();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!pathname?.startsWith(OBRIGO_BASE)) return;
    const interno = pathname.slice(OBRIGO_BASE.length) || '/';
    if (interno !== location.pathname) navigate(interno + window.location.search, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
}

function Protegida({ children }: { children: React.ReactNode }) {
  const { sessao, carregando } = useAuth();
  if (carregando) {
    return <div className="grid h-full place-items-center text-slate-400">Carregando...</div>;
  }
  if (!sessao) {
    return (
      <div className="grid h-full place-items-center">
        <div className="card max-w-md p-6 text-center text-sm text-slate-600">
          Nao foi possivel entrar no Obrigo com o seu usuario da Nauta. Saia e entre de novo; se continuar, avise o administrador.
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<Protegida><LayoutEmbutido /></Protegida>}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard/indicadores" element={<Indicadores />} />
        <Route path="dashboard/paineis" element={<Paineis />} />
        <Route path="empresas" element={<EmpresasList />} />
        <Route path="empresas/nova" element={<EmpresaForm />} />
        <Route path="empresas/importar" element={<ImportarCsv />} />
        <Route path="empresas/motivos" element={<MotivosCancelamento />} />
        <Route path="empresas/grupos" element={<GruposEmpresa />} />
        <Route path="empresas/motivos/novo" element={<MotivoForm />} />
        <Route path="empresas/motivos/:id" element={<MotivoForm />} />
        <Route path="empresas/:id" element={<EmpresaFicha />} />
        <Route path="obrigacoes" element={<Catalogo />} />
        <Route path="obrigacoes/nova" element={<ObrigacaoForm />} />
        <Route path="obrigacoes/regimes" element={<Regimes />} />
        <Route path="obrigacoes/regimes/relatorio" element={<RelatorioRegime />} />
        <Route path="obrigacoes/regimes/novo" element={<RegimeForm />} />
        <Route path="obrigacoes/regimes/:id" element={<RegimeForm />} />
        <Route path="obrigacoes/grupos" element={<Grupos />} />
        <Route path="obrigacoes/grupos/novo" element={<GrupoForm />} />
        <Route path="obrigacoes/grupos/:id" element={<GrupoForm />} />
        <Route path="obrigacoes/feriados" element={<Feriados />} />
        <Route path="obrigacoes/feriados/novo" element={<FeriadoForm />} />
        <Route path="obrigacoes/feriados/:id" element={<FeriadoForm />} />
        <Route path="obrigacoes/alocacao" element={<AlocacaoMassa />} />
        <Route path="obrigacoes/:id" element={<ObrigacaoForm />} />
        <Route path="entregas" element={<ListaEntregas />} />
        <Route path="entregas/calendario" element={<Calendario />} />
        <Route path="documentos/armazenamento" element={<Armazenamento />} />
        <Route path="documentos/protocolos-fisicos" element={<ProtocolosFisicos />} />
        <Route path="documentos/protocolos-fisicos/novo" element={<ProtocoloFisicoForm />} />
        <Route path="documentos/protocolos-fisicos/:id" element={<ProtocoloFisicoForm />} />
        <Route path="robo" element={<Caixa />} />
        <Route path="robo/revisao" element={<Revisao />} />
        <Route path="robo/painel" element={<PainelRobo />} />
        <Route path="robo/envio" element={<EnvioManual />} />
        <Route path="robo/drive" element={<DriveConfig />} />
        <Route path="robo/assinaturas" element={<Assinaturas />} />
        <Route path="robo/assinaturas/novo" element={<AssinaturaForm />} />
        <Route path="robo/assinaturas/:id" element={<AssinaturaForm />} />
        <Route path="processos" element={<Processos />} />
        <Route path="processos/novo" element={<ProcessoForm />} />
        <Route path="processos/matrizes" element={<Matrizes />} />
        <Route path="processos/matrizes/novo" element={<MatrizForm />} />
        <Route path="processos/matrizes/:id" element={<MatrizForm />} />
        <Route path="processos/:id" element={<ProcessoFicha />} />
        <Route path="area-vip/comunicados" element={<ComunicadosAdmin />} />
        <Route path="area-vip/solicitacoes" element={<SolicitacoesInbox />} />
        <Route path="area-vip/app" element={<AreaVip />} />
        <Route path="area-vip/nps" element={<NpsPanel />} />
        <Route path="area-vip/avaliacoes" element={<AvaliacoesSolicitacoes />} />
        <Route path="area-vip/formularios" element={<FormulariosSolicitacao />} />
        <Route path="area-vip/usuarios-app" element={<UsuariosApp />} />
        <Route path="relatorios/semanais" element={<EmConstrucao titulo="Estatisticas semanais" />} />
        <Route path="relatorios/mensais" element={<EmConstrucao titulo="Estatisticas mensais" />} />
        <Route path="relatorios/responsaveis" element={<EmConstrucao titulo="Responsaveis Dptos" descricao="Relacao de responsaveis por departamento em cada empresa." />} />
        <Route path="relatorios/exportar-emails" element={<EmConstrucao titulo="Exportar e-mails p/ CSV" descricao="Exportacao dos e-mails de contato das empresas em CSV." />} />
        <Route path="comunicacao/templates" element={<Templates />} />
        <Route path="comunicacao/chatbot" element={<Chatbot />} />
        <Route path="solicitacoes-internas" element={<SolicitacoesInternas />} />
        <Route path="solicitacoes" element={<GestaoSolicitacoes />} />
        <Route path="insights" element={<Insights />} />
        <Route path="notificacoes" element={<Notificacoes />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="cadastros" element={<Departamentos />} />
        <Route path="cadastros/novo" element={<DepartamentoForm />} />
        <Route path="cadastros/tags" element={<Tags />} />
        <Route path="cadastros/:id" element={<DepartamentoForm />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="usuarios/novo" element={<UsuarioForm />} />
        <Route path="usuarios/:id" element={<UsuarioForm />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="auditoria" element={<Auditoria />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function ObrigoApp() {
  // O Next grava a URL nova no navegador so' DURANTE o commit da navegacao: na primeira
  // renderizacao desta tela, window.location ainda e' a tela anterior (ex.: /sistema).
  // O BrowserRouter le a URL ao montar; se montasse agora com uma URL fora do basename,
  // o react-router nao renderizaria nada (tela em branco ate' o F5). Entao so' montamos o
  // router depois de confirmar que a URL ja' comeca com /sistema/obrigo.
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    let vivo = true;
    let tentativas = 0;
    const checar = () => {
      if (!vivo) return;
      if (window.location.pathname.startsWith(OBRIGO_BASE)) setPronto(true);
      else if (tentativas++ < 60) requestAnimationFrame(checar); // ~1s de tolerancia
      else setPronto(true);
    };
    checar();
    return () => { vivo = false; };
  }, []);
  if (!pronto) {
    return <div className="grid h-full place-items-center text-slate-400">Carregando...</div>;
  }
  return (
    // p-6 = o padding do <main> original do Obrigô (varias telas usam -m-6 contando com ele)
    <div className="obrigo-app h-full p-6">
      <BrowserRouter basename={OBRIGO_BASE}>
        <SincronizaComNext />
        <ToastProvider>
          <AuthProvider>
            <Rotas />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </div>
  );
}
