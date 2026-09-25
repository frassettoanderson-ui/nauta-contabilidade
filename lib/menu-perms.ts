// Modelo de permissões de menu por usuário — client-safe (sem pg)
//
// menu_perms (coluna em admin_users):
//   null  → usa o padrão do cargo (defaultPermsForRole)
//   array → lista explícita de hrefs liberados (personalizado pelo Gerente)
// admin/gerente sempre veem tudo (effectivePerms retorna null).

export interface MenuGrupo {
  grupo: string
  itens: { href: string; label: string }[]
}

// Estrutura completa de itens que podem ser liberados (espelha a Sidebar)
export const MENU_GRUPOS: MenuGrupo[] = [
  { grupo: 'Empresas', itens: [
    { href: '/sistema/obrigo/empresas', label: 'Empresas (lista e cadastro)' },
    { href: '/sistema/obrigo/empresas/nova', label: 'Cadastrar' },
  ] },
  { grupo: 'Geração de Contrato', itens: [
    { href: '/sistema/contratos/gerar', label: 'Gerar Contrato' },
    { href: '/sistema/contratos/andamento', label: 'Em Andamento' },
    { href: '/sistema/contratos/consultar', label: 'Consultar Contrato' },
  ] },
  { grupo: 'Comercial', itens: [
    { href: '/sistema/comercial/kanban', label: 'CRM' },
    { href: '/sistema/comercial/leads', label: 'Leads' },
    { href: '/sistema/comercial/meta', label: 'Cadastrar meta' },
    { href: '/sistema/comercial/comissoes', label: 'Comissões' },
  ] },
  { grupo: 'Onboarding', itens: [
    { href: '/sistema/onboarding', label: 'Onboarding' },
    { href: '/sistema', label: 'Dashboard' },
  ] },
  { grupo: 'Relatórios', itens: [
    { href: '/sistema/relatorios/conversao', label: 'Conversão' },
    { href: '/sistema/relatorios/empresas', label: 'Empresas' },
  ] },
  { grupo: 'Financeiro', itens: [
    { href: '/sistema/financeiro/faturamento', label: 'Faturamento' },
    { href: '/sistema/financeiro/cobranca', label: 'Cobrança' },
    { href: '/sistema/financeiro/lancar-entrada', label: 'Lançar Entrada' },
    { href: '/sistema/financeiro/lancar-despesa', label: 'Lançar Despesa' },
    { href: '/sistema/financeiro/despesas-fixas', label: 'Despesas Fixas' },
    { href: '/sistema/financeiro/contas-a-pagar', label: 'Contas a Pagar' },
  ] },
  { grupo: 'Áreas', itens: [
    { href: '/sistema/fiscal', label: 'Fiscal' },
    { href: '/sistema/pessoal', label: 'Pessoal' },
    { href: '/sistema/configuracoes', label: 'Configurações' },
  ] },
  { grupo: 'Usuários', itens: [
    { href: '/sistema/usuarios/criar', label: 'Criar Usuário' },
    { href: '/sistema/usuarios/consultar', label: 'Consultar' },
    { href: '/sistema/usuarios/historico-chat', label: 'Histórico de chat' },
  ] },
  // Módulo Obrigô (obrigações acessórias) — telas em /sistema/obrigo/*
  { grupo: 'Acessórias', itens: [
    { href: '/sistema/obrigo', label: 'Dashboard (entregas)' },
    { href: '/sistema/obrigo/obrigacoes', label: 'Obrigações' },
    { href: '/sistema/obrigo/entregas', label: 'Lista de Entregas' },
    { href: '/sistema/obrigo/usuarios', label: 'Sistema — Usuários e Permissões' },
    { href: '/sistema/obrigo/cadastros', label: 'Sistema — Departamentos' },
    { href: '/sistema/obrigo/configuracoes', label: 'Sistema — Configurações gerais' },
    { href: '/sistema/obrigo/robo/assinaturas', label: 'e-Contínuo — Configurar obrigações' },
    { href: '/sistema/obrigo/robo/drive', label: 'e-Contínuo — Conectar Google Drive' },
    { href: '/sistema/obrigo/robo/envio', label: 'e-Contínuo — Envio manual' },
    { href: '/sistema/obrigo/robo/revisao', label: 'e-Contínuo — Revisão' },
    { href: '/sistema/obrigo/area-vip/app', label: 'Área VIP — App' },
    { href: '/sistema/obrigo/area-vip/comunicados', label: 'Área VIP — Comunicados' },
    { href: '/sistema/obrigo/area-vip/nps', label: 'Área VIP — Avaliação NPS' },
    { href: '/sistema/obrigo/area-vip/avaliacoes', label: 'Área VIP — Avaliação das Solicitações' },
    { href: '/sistema/obrigo/area-vip/usuarios-app', label: 'Área VIP — Usuários do APP' },
    { href: '/sistema/obrigo/insights', label: 'Relatórios — Insights' },
    { href: '/sistema/obrigo/dashboard/indicadores', label: 'Relatórios — Indicadores' },
    { href: '/sistema/obrigo/dashboard/paineis', label: 'Relatórios — Painéis' },
    { href: '/sistema/obrigo/relatorios/semanais', label: 'Relatórios — Estatísticas semanais' },
    { href: '/sistema/obrigo/relatorios/mensais', label: 'Relatórios — Estatísticas mensais' },
    { href: '/sistema/obrigo/relatorios/responsaveis', label: 'Relatórios — Responsáveis Dptos' },
    { href: '/sistema/obrigo/relatorios/exportar-emails', label: 'Relatórios — Exportar e-mails' },
  ] },
]

const ONBOARDING = ['/sistema/onboarding']

/** Permissões padrão de cada cargo. null = vê tudo. */
export function defaultPermsForRole(role: string): string[] | null {
  switch (role) {
    case 'admin':
    case 'gerente':
      return null
    case 'comercial':
      return ['/sistema/comercial/kanban', '/sistema/comercial/leads', '/sistema/comercial/meta', ...ONBOARDING]
    case 'pessoal':
      return ['/sistema/pessoal', ...ONBOARDING]
    case 'fiscal':
      return ['/sistema/fiscal', ...ONBOARDING]
    case 'atendente':
      return [...ONBOARDING]
    default:
      return [...ONBOARDING]
  }
}

/** Permissões efetivas: menu_perms salvo, ou o padrão do cargo. null = vê tudo. */
export function effectivePerms(role: string, stored: string[] | null | undefined): string[] | null {
  if (role === 'admin' || role === 'gerente') return null
  if (stored && stored.length) return stored
  return defaultPermsForRole(role)
}

/** O usuário pode ver este href? perms null = vê tudo. */
export function podeVer(perms: string[] | null | undefined, href: string): boolean {
  if (perms == null) return true
  return perms.includes(href)
}
