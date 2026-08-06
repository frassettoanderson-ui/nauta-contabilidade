import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planilha de Fluxo de Caixa Grátis (Excel)',
  description: 'Baixe grátis uma planilha pronta de fluxo de caixa para o seu negócio. Sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/planilha-fluxo-de-caixa' },
  openGraph: { title: 'Planilha de Fluxo de Caixa Grátis (Excel) | Nauta Contabilidade', description: 'Baixe grátis uma planilha pronta de fluxo de caixa para o seu negócio. Sem cadastro.', url: 'https://nautacontabilidade.com.br/ferramentas/planilha-fluxo-de-caixa' },
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
