import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulador da Reforma Tributária (IVA, CBS e IBS)',
  description: 'Estime a carga do novo IVA dual (CBS + IBS) que substitui PIS, COFINS, ISS e ICMS. Grátis.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/calculadora-reforma-tributaria' },
  openGraph: { title: 'Simulador da Reforma Tributária (IVA, CBS e IBS) | Nauta Contabilidade', description: 'Estime a carga do novo IVA dual (CBS + IBS) que substitui PIS, COFINS, ISS e ICMS. Grátis.', url: 'https://nautacontabilidade.com.br/ferramentas/calculadora-reforma-tributaria' },
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
