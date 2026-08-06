import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora de RPA — Recibo de Pagamento Autônomo',
  description: 'Calcule o líquido do RPA com INSS, Imposto de Renda e ISS. Gratuito e sem cadastro.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/calculadora-rpa' },
  openGraph: { title: 'Calculadora de RPA — Recibo de Pagamento Autônomo | Nauta Contabilidade', description: 'Calcule o líquido do RPA com INSS, Imposto de Renda e ISS. Gratuito e sem cadastro.', url: 'https://nautacontabilidade.com.br/ferramentas/calculadora-rpa' },
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
