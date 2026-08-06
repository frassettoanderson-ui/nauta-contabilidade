import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Serviço Fiscal — Apuração e Obrigações Tributárias',
  description:
    'Apuração de impostos, entrega de obrigações acessórias e conformidade fiscal para MEI, Simples Nacional e Lucro Presumido em todo o Brasil.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/servicos/fiscal' },
  openGraph: {
    title: 'Serviço Fiscal — Apuração e Obrigações Tributárias | Nauta Contabilidade',
    description: 'Apuração de impostos, entrega de obrigações acessórias e conformidade fiscal para MEI, Simples Nacional e Lucro Presumido em todo o Brasil.',
    url: 'https://nautacontabilidade.com.br/servicos/fiscal',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
