import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora de Salário Líquido',
  description:
    'Calcule o salário líquido após os descontos de INSS e Imposto de Renda. Ferramenta gratuita e sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/calculadora-salario-liquido' },
  openGraph: {
    title: 'Calculadora de Salário Líquido | Nauta Contabilidade',
    description: 'Calcule o salário líquido após os descontos de INSS e Imposto de Renda. Ferramenta gratuita e sem cadastro.',
    url: 'https://nautacontabilidade.com.br/ferramentas/calculadora-salario-liquido',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
