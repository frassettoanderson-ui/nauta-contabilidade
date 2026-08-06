import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contabilidade Contábil — Escrituração, Balanço e DRE',
  description:
    'Escrituração contábil, balanço patrimonial, DRE e relatórios gerenciais mensais para empresas de todo o Brasil, com registro no CRC-SC.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/servicos/contabil' },
  openGraph: {
    title: 'Contabilidade Contábil — Escrituração, Balanço e DRE | Nauta Contabilidade',
    description: 'Escrituração contábil, balanço patrimonial, DRE e relatórios gerenciais mensais para empresas de todo o Brasil, com registro no CRC-SC.',
    url: 'https://nautacontabilidade.com.br/servicos/contabil',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
