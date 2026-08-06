import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulador de Regime Tributário — Simples, Presumido e Real',
  description:
    'Compare Simples Nacional, Lucro Presumido e Lucro Real e descubra o regime com menor carga tributária para sua empresa. Gratuito.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/simulador-regime-tributario' },
  openGraph: {
    title: 'Simulador de Regime Tributário — Simples, Presumido e Real | Nauta Contabilidade',
    description: 'Compare Simples Nacional, Lucro Presumido e Lucro Real e descubra o regime com menor carga tributária para sua empresa. Gratuito.',
    url: 'https://nautacontabilidade.com.br/ferramentas/simulador-regime-tributario',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
