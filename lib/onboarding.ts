// Mapeamento de interesse do lead → categoria (slug) do Onboarding — client-safe.

export const ONBOARDING_CATEGORIAS: { slug: string; label: string; interesse: string }[] = [
  { slug: 'trocar-de-contador',       label: 'Trocar de contador',      interesse: 'Trocar de contador' },
  { slug: 'abrir-empresa',            label: 'Abrir minha empresa',     interesse: 'Abrir minha empresa' },
  { slug: 'deixar-mei',               label: 'Deixar de ser MEI',       interesse: 'Deixar de ser MEI' },
  { slug: 'bpo-financeiro',           label: 'BPO Financeiro',          interesse: 'BPO Financeiro' },
  { slug: 'contabilidade-eleitoral',  label: 'Contabilidade Eleitoral', interesse: 'Contabilidade Eleitoral' },
]

/** Converte o interesse do lead no slug da categoria de onboarding. null se não houver (ex.: "Outro"). */
export function categoriaFromInteresse(interesse?: string | null): string | null {
  if (!interesse) return null
  const c = ONBOARDING_CATEGORIAS.find(x => x.interesse.toLowerCase() === interesse.trim().toLowerCase())
  return c?.slug ?? null
}

export const ONBOARDING_ETAPAS = ['Etapa 1', 'Etapa 2', 'Etapa 3', 'Etapa 4']
