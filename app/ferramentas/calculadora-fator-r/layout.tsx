import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora Fator R do Simples Nacional',
  description:
    'Calcule o Fator R e descubra se sua empresa se enquadra no Anexo III do Simples Nacional. Gratuito, sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/calculadora-fator-r' },
  openGraph: {
    title: 'Calculadora Fator R do Simples Nacional | Nauta Contabilidade',
    description: 'Calcule o Fator R e descubra se sua empresa se enquadra no Anexo III do Simples Nacional. Gratuito, sem cadastro.',
    url: 'https://nautacontabilidade.com.br/ferramentas/calculadora-fator-r',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
