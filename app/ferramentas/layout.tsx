import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ferramentas e Calculadoras Contábeis Gratuitas',
  description:
    'Calculadoras gratuitas da Nauta: Fator R, comparador de regime tributário, salário líquido e simulador de rescisão. Sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas' },
  openGraph: {
    title: 'Ferramentas e Calculadoras Contábeis Gratuitas | Nauta Contabilidade',
    description: 'Calculadoras gratuitas da Nauta: Fator R, comparador de regime tributário, salário líquido e simulador de rescisão. Sem cadastro.',
    url: 'https://nautacontabilidade.com.br/ferramentas',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
