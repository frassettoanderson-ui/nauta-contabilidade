import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quem Atendemos — Segmentos e Empresas',
  description:
    'Atendemos MEI, Simples Nacional, Lucro Presumido e profissionais liberais em todo o Brasil, 100% online. Veja os segmentos atendidos pela Nauta.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/quem-atendemos' },
  openGraph: {
    title: 'Quem Atendemos — Segmentos e Empresas | Nauta Contabilidade',
    description: 'Atendemos MEI, Simples Nacional, Lucro Presumido e profissionais liberais em todo o Brasil, 100% online. Veja os segmentos atendidos pela Nauta.',
    url: 'https://nautacontabilidade.com.br/quem-atendemos',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
