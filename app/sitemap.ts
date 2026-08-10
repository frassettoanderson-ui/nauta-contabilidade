import type { MetadataRoute } from 'next'
import { getPublishedForSitemap } from '@/lib/blog'

const BASE = 'https://nautacontabilidade.com.br'

// Revalida periodicamente para incluir posts publicados pelo agendador (cron)
// sem depender de um novo build.
export const revalidate = 3600

// Rotas públicas estáticas (não inclui /admin, /sistema nem /api).
const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/',                                        priority: 1.0, changeFrequency: 'weekly' },
  { path: '/quem-atendemos',                          priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contato',                                 priority: 0.7, changeFrequency: 'monthly' },
  { path: '/servicos/contabil',                       priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/fiscal',                         priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/folha-de-pagamento',             priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/legalizacao-societario',         priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/bpo-financeiro',                 priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/planejamento-tributario',        priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/contabilidade-eleitoral',        priority: 0.9, changeFrequency: 'monthly' },
  { path: '/ferramentas',                             priority: 0.8, changeFrequency: 'monthly' },
  { path: '/ferramentas/calculadora-fator-r',         priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/simulador-regime-tributario', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/calculadora-salario-liquido', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/simulador-rescisao',          priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/calculadora-pj-x-clt',        priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/calculadora-custo-abrir-cnpj', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/calculadora-reforma-tributaria', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/consulta-cnae',               priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/calculadora-rpa',             priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/planilha-fluxo-de-caixa',     priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/planilha-controle-financeiro', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/blog',                                    priority: 0.8, changeFrequency: 'daily' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(r => ({
    url: BASE + r.path,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Posts publicados (dinâmico via banco). Falha graciosa se indisponível.
  let postEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await getPublishedForSitemap()
    postEntries = posts.map(p => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.atualizado_em ? new Date(p.atualizado_em) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    // se o banco estiver fora, entrega ao menos as rotas estáticas
  }

  return [...staticEntries, ...postEntries]
}
