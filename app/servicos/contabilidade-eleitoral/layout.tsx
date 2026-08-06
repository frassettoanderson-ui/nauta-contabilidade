import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contabilidade Eleitoral — Prestação de Contas ao TSE',
  description:
    'Contabilidade eleitoral especializada: prestação de contas de candidatos e partidos à Justiça Eleitoral. Mais de 400 prestações aprovadas.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/servicos/contabilidade-eleitoral' },
  openGraph: {
    title: 'Contabilidade Eleitoral — Prestação de Contas ao TSE | Nauta Contabilidade',
    description: 'Contabilidade eleitoral especializada: prestação de contas de candidatos e partidos à Justiça Eleitoral. Mais de 400 prestações aprovadas.',
    url: 'https://nautacontabilidade.com.br/servicos/contabilidade-eleitoral',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
