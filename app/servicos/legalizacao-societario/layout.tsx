import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legalização e Societário — Abertura e Alterações',
  description:
    'Abertura de empresa, alterações contratuais, encerramento e regularização societária em todo o Brasil, sem burocracia.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/servicos/legalizacao-societario' },
  openGraph: {
    title: 'Legalização e Societário — Abertura e Alterações | Nauta Contabilidade',
    description: 'Abertura de empresa, alterações contratuais, encerramento e regularização societária em todo o Brasil, sem burocracia.',
    url: 'https://nautacontabilidade.com.br/servicos/legalizacao-societario',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
