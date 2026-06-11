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
  { grupo: 'Clientes', itens: [
    { href: '/sistema/clientes/cadastrar', label: 'Cadastrar' },
    { href: '/sistema/clientes/consultar', label: 'Consultar' },
  ] },
  { grupo: 'Geração de Contrato', itens: [
    { href: '/sistema/contratos/gerar', label: 'Gerar Contrato' },
    { href: '/sistema/contratos/andamento', label: 'Em Andamento' },
    { href: '/sistema/contratos/consultar', label: 'Consultar Contrato' },
  ] },
  { grupo: 'Comercial', itens: [
    { href: '/sistema/comercial/kanban', label: 'Kanban' },
    { href: '/sistema/comercial/leads', label: 'Leads' },
  ] },
  { grupo: 'Onboarding', itens: [
    { href: '/sistema/onboarding', label: 'Dashboard' },
    { href: '/sistema/onboarding/trocar-de-contador', label: 'Trocar de contador' },
    { href: '/sistema/onboarding/abrir-empresa', label: 'Abrir minha empresa' },
    { href: '/sistema/onboarding/deixar-mei', label: 'Deixar de ser MEI' },
    { href: '/sistema/onboarding/bpo-financeiro', label: 'BPO Financeiro' },
    { href: '/sistema/onboarding/contabilidade-eleitoral', label: 'Contabilidade Eleitoral' },
  ] },
  { grupo: 'Relatórios', itens: [
    { href: '/sistema/relatorios/conversao', label: 'Conversão' },
  ] },
  { grupo: 'Áreas', itens: [
    { href: '/sistema/fiscal', label: 'Fiscal' },
    { href: '/sistema/pessoal', label: 'Pessoal' },
  ] },
  { grupo: 'Usuários', itens: [
    { href: '/sistema/usuarios/criar', label: 'Criar Usuário' },
    { href: '/sistema/usuarios/consultar', label: 'Consultar' },
  ] },
]

const ONBOARDING = [
  '/sistema/onboarding',
  '/sistema/onboarding/trocar-de-contador',
  '/sistema/onboarding/abrir-empresa',
  '/sistema/onboarding/deixar-mei',
  '/sistema/onboarding/bpo-financeiro',
  '/sistema/onboarding/contabilidade-eleitoral',
]

/** Permissões padrão de cada cargo. null = vê tudo. */
export function defaultPermsForRole(role: string): string[] | null {
  switch (role) {
    case 'admin':
    case 'gerente':
      return null
    case 'comercial':
      return ['/sistema/comercial/kanban', '/sistema/comercial/leads', ...ONBOARDING]
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
