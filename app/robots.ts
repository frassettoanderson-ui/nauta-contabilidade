import type { MetadataRoute } from 'next'

const BASE = 'https://nautacontabilidade.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Áreas privadas / não-indexáveis.
        disallow: ['/admin', '/sistema', '/api', '/cadastro'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
