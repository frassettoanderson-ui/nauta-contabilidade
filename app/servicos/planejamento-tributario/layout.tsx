import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planejamento Tributário — Pague Menos Impostos Legalmente',
  description:
    'Análise de regime tributário e planejamento para reduzir a carga de impostos da sua empresa de forma legal e segura, em todo o Brasil.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/servicos/planejamento-tributario' },
  openGraph: {
    title: 'Planejamento Tributário — Pague Menos Impostos Legalmente | Nauta Contabilidade',
    description: 'Análise de regime tributário e planejamento para reduzir a carga de impostos da sua empresa de forma legal e segura, em todo o Brasil.',
    url: 'https://nautacontabilidade.com.br/servicos/planejamento-tributario',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
