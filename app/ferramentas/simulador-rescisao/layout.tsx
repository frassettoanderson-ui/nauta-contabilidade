import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulador de Rescisão Trabalhista',
  description:
    'Calcule verbas rescisórias para demissão com e sem justa causa, pedido de demissão e acordo. Gratuito, sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/simulador-rescisao' },
  openGraph: {
    title: 'Simulador de Rescisão Trabalhista | Nauta Contabilidade',
    description: 'Calcule verbas rescisórias para demissão com e sem justa causa, pedido de demissão e acordo. Gratuito, sem cadastro.',
    url: 'https://nautacontabilidade.com.br/ferramentas/simulador-rescisao',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
