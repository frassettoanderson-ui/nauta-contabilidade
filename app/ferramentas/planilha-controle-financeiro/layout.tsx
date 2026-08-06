import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planilha de Controle Financeiro Grátis (Excel)',
  description: 'Baixe grátis uma planilha de controle financeiro com resumo automático. Sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/planilha-controle-financeiro' },
  openGraph: { title: 'Planilha de Controle Financeiro Grátis (Excel) | Nauta Contabilidade', description: 'Baixe grátis uma planilha de controle financeiro com resumo automático. Sem cadastro.', url: 'https://nautacontabilidade.com.br/ferramentas/planilha-controle-financeiro' },
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
