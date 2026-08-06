import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora PJ x CLT: o que compensa mais',
  description: 'Compare quanto sobra como CLT (com benefícios) e como PJ (após impostos). Ferramenta gratuita da Nauta, sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/calculadora-pj-x-clt' },
  openGraph: { title: 'Calculadora PJ x CLT: o que compensa mais | Nauta Contabilidade', description: 'Compare quanto sobra como CLT (com benefícios) e como PJ (após impostos). Ferramenta gratuita da Nauta, sem cadastro.', url: 'https://nautacontabilidade.com.br/ferramentas/calculadora-pj-x-clt' },
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
