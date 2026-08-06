import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Folha de Pagamento — Admissões, eSocial e Encargos',
  description:
    'Processamento de folha de pagamento, admissões, rescisões, férias e eSocial para empresas de todo o Brasil, 100% digital.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/servicos/folha-de-pagamento' },
  openGraph: {
    title: 'Folha de Pagamento — Admissões, eSocial e Encargos | Nauta Contabilidade',
    description: 'Processamento de folha de pagamento, admissões, rescisões, férias e eSocial para empresas de todo o Brasil, 100% digital.',
    url: 'https://nautacontabilidade.com.br/servicos/folha-de-pagamento',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
