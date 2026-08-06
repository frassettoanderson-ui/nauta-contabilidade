import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora de Custo para Abrir CNPJ',
  description: 'Estime quanto custa abrir sua empresa conforme o tipo e a atividade. Grátis e sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/calculadora-custo-abrir-cnpj' },
  openGraph: { title: 'Calculadora de Custo para Abrir CNPJ | Nauta Contabilidade', description: 'Estime quanto custa abrir sua empresa conforme o tipo e a atividade. Grátis e sem cadastro.', url: 'https://nautacontabilidade.com.br/ferramentas/calculadora-custo-abrir-cnpj' },
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
