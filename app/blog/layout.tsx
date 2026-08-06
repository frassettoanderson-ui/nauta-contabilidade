import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Conteúdo Contábil, Tributário e Financeiro',
  description:
    'Artigos, guias e análises sobre contabilidade, tributação e gestão financeira escritos pela equipe da Nauta Contabilidade.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/blog' },
  openGraph: {
    title: 'Blog — Conteúdo Contábil, Tributário e Financeiro | Nauta Contabilidade',
    description: 'Artigos, guias e análises sobre contabilidade, tributação e gestão financeira escritos pela equipe da Nauta Contabilidade.',
    url: 'https://nautacontabilidade.com.br/blog',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
