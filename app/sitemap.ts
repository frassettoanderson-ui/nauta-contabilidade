import type { MetadataRoute } from 'next'
import { getAllPublishedSlugs } from '@/lib/blog'

const BASE = 'https://nautacontabilidade.com.br'

// Rotas públicas estáticas (não inclui /admin, /sistema nem /api).
const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/',                                     priority: 1.0, changeFrequency: 'weekly' },
  { path: '/quem-atendemos',                       priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contato',                              priority: 0.7, changeFrequency: 'monthly' },
  { path: '/servicos/contabil',                    priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/fiscal',                      priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/folha-de-pagamento',          priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/legalizacao-societario',      priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/bpo-financeiro',              priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/planejamento-tributario',     priority: 0.9, changeFrequency: 'monthly' },
  { path: '/servicos/contabilidade-eleitoral',     priority: 0.9, changeFrequency: 'monthly' },
  { path: '/ferramentas',                          priority: 0.8, changeFrequency: 'monthly' },
  { path: '/ferramentas/calculadora-fator-r',      priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/simulador-regime-tributario', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/calculadora-salario-liquido', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/ferramentas/simulador-rescisao',       priority: 0.7, changeFrequency: 'yearly' },
  { path: '/blog',                                 priority: 0.8, changeFrequency: 'weekly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(r => ({
    url: BASE + r.path,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Posts publicados (blog é dinâmico via Supabase). Falha graciosa se indisponível.
  let postEntries: MetadataRoute.Sitemap = []
  try {
    const slugs = await getAllPublishedSlugs()
    postEntries = slugs.map(slug => ({
      url: `${BASE}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    // se o banco estiver fora, entrega ao menos as rotas estáticas
  }

  return [...staticEntries, ...postEntries]
}
